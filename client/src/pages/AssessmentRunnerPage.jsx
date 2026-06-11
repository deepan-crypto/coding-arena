import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import api from '../api/client';
import EditorPanel from '../components/EditorPanel.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function AssessmentRunnerPage() {
  const { assessmentId, questionId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [assessment, setAssessment] = useState(null);
  const [question, setQuestion] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [stdin, setStdin] = useState('');
  const [runOutput, setRunOutput] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('input');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoadError('');
        const response = await api.get(`/assessments/${assessmentId}`);
        const nextAssessment = response.data.assessment;
        
        if (nextAssessment.isCompleted) {
          setLoadError('You have already completed this assessment and cannot re-attend it.');
          return;
        }

        const currentQuestion = nextAssessment.questions.find(
          (item) => String(item.question?._id || item.question) === String(questionId)
        );

        setAssessment(nextAssessment);
        const q = currentQuestion?.question || currentQuestion;
        setQuestion(q);
        const starterCode = q?.starterCode || {};
        setCode(starterCode[language] || starterCode.javascript || '// Write your solution here\n');
      } catch (err) {
        setLoadError(err.response?.data?.message || 'Failed to load assessment');
      }
    }

    load();
  }, [assessmentId, questionId]);

  // Update code when language changes
  const handleLanguageChange = useCallback((newLang) => {
    setLanguage(newLang);
    if (question?.starterCode?.[newLang]) {
      setCode(question.starterCode[newLang]);
    }
  }, [question]);

  const questionList = useMemo(() => assessment?.questions || [], [assessment]);

  const runCode = async () => {
    setRunning(true);
    setActiveTab('output');
    try {
      const response = await api.post('/submissions/run', {
        questionId,
        language,
        sourceCode: code,
        stdin
      });
      setRunOutput(response.data);
    } catch (err) {
      setRunOutput({
        status: 'Error',
        stderr: err.response?.data?.message || 'Failed to execute code',
        stdout: '',
        compileOutput: '',
        time: '',
        memory: ''
      });
    } finally {
      setRunning(false);
    }
  };

  const submitCode = async () => {
    setSubmitting(true);
    setActiveTab('results');
    try {
      const response = await api.post('/submissions/submit', {
        assessmentId,
        questionId,
        language,
        sourceCode: code
      });
      setSubmissionResult(response.data);
    } catch (err) {
      setSubmissionResult({
        verdict: 'Error',
        passedCount: 0,
        totalCount: 0,
        score: 0,
        error: err.response?.data?.message || 'Submission failed'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Scroll chat to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await api.post('/mentor/chat', {
        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        problemDescription: question?.description || '',
        studentCode: code,
        language,
        assessmentId,
        questionId
      });
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ ' + (err.response?.data?.message || 'Mentor is unavailable. Try again.') }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  if (loadError) {
    return (
      <div className="auth-screen">
        <div className="auth-card center-card">
          <p className="eyebrow">Error</p>
          <h2>{loadError}</h2>
          <button className="primary-button" onClick={() => navigate('/student')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <PanelGroup direction="horizontal" orientation="horizontal" className="runner-layout">
      {/* Left panel — problem statement */}
      <Panel defaultSize={30} minSize={20} className="problem-panel">
        <div className="problem-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="eyebrow">Assessment</p>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{assessment?.title || 'Loading...'}</h2>
            <div className="pill-row">
              <span className="pill">{assessment?.durationMinutes || 0} mins</span>
              <span className="pill">{assessment?.status || 'draft'}</span>
            </div>
          </div>
          <button 
            className="danger-button minimal" 
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={async () => {
              if (window.confirm("Are you sure you want to finish and exit the assessment? Make sure you have submitted your code!")) {
                try {
                  await api.post(`/assessments/${assessmentId}/complete`);
                  navigate('/student');
                } catch (err) {
                  alert('Failed to complete assessment');
                }
              }
            }}
          >
            Finish Assessment
          </button>
        </div>

        {/* Question navigation */}
        <div className="question-nav">
          {questionList.map((item, index) => {
            const q = item.question || item;
            const qId = q?._id || q;
            return (
              <button
                key={String(qId)}
                type="button"
                className={`question-chip ${String(qId) === String(questionId) ? 'active' : ''}`}
                onClick={() => navigate(`/student/assessments/${assessmentId}/questions/${qId}`)}
              >
                Q{index + 1}
              </button>
            );
          })}
        </div>

        {/* Problem statement */}
        <article className="statement-card">
          <h3>{question?.title || 'Loading...'}</h3>
          <span className={`difficulty-tag diff-${(question?.difficulty || 'easy').toLowerCase()}`}>
            {question?.difficulty}
          </span>
          <pre className="problem-text">{question?.description}</pre>
          {question?.constraints ? (
            <>
              <h4>Constraints</h4>
              <pre className="problem-text subtle">{question.constraints}</pre>
            </>
          ) : null}
        </article>

        {/* Examples */}
        {(question?.visibleTestCases || []).length > 0 && (
          <article className="statement-card">
            <h4>Examples</h4>
            <div className="example-list">
              {question.visibleTestCases.map((example, index) => (
                <div className="example-card" key={index}>
                  <strong>Example {index + 1}</strong>
                  <div className="example-io">
                    <div>
                      <span className="example-label">Input:</span>
                      <pre>{example.input}</pre>
                    </div>
                    <div>
                      <span className="example-label">Output:</span>
                      <pre>{example.output}</pre>
                    </div>
                  </div>
                  {example.explanation ? (
                    <p className="muted-copy">{example.explanation}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </article>
        )}
      </Panel>

      <PanelResizeHandle className="resize-handle" />

      {/* Middle panel — code editor + console */}
      <Panel defaultSize={45} minSize={25} className="workspace-panel">
        <PanelGroup direction="vertical" orientation="vertical" className="editor-split">
          <Panel defaultSize={65} minSize={20} className="editor-card">
            <div className="workspace-toolbar">
              <div className="toolbar-group">
                <span className="editor-tab-label">{'< /> Code'}</span>
                <select className="minimal-select" value={language} onChange={(event) => handleLanguageChange(event.target.value)}>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                </select>
              </div>
              <div className="toolbar-group">
                <button
                  className="ghost-button icon-button"
                  title="Reset Code"
                  type="button"
                  onClick={() => setCode(question?.starterCode?.[language] || '// Write your solution here\n')}
                >
                  ↺
                </button>
              </div>
            </div>
            <div className="editor-container-inner">
              <EditorPanel language={language} value={code} onChange={setCode} theme={theme} />
            </div>
          </Panel>

          <PanelResizeHandle className="resize-handle horizontal" />

          <Panel defaultSize={35} minSize={10} className="console-panel">
            <div className="console-header">
              <div className="console-tabs">
                <button
                  type="button"
                  className={`console-tab ${activeTab === 'input' ? 'active' : ''}`}
                  onClick={() => setActiveTab('input')}
                >
                  <span className="tab-icon">{'>_'}</span> Input
                </button>
                <button
                  type="button"
                  className={`console-tab ${activeTab === 'output' ? 'active' : ''}`}
                  onClick={() => setActiveTab('output')}
                >
                  Output
                </button>
                <button
                  type="button"
                  className={`console-tab ${activeTab === 'results' ? 'active' : ''}`}
                  onClick={() => setActiveTab('results')}
                >
                  Results
                </button>
              </div>
              
              <div className="console-actions">
                <button className="secondary-button run-btn minimal" type="button" onClick={runCode} disabled={running}>
                  {running ? '⏳' : '▶'} Run
                </button>
                <button className="primary-button submit-btn minimal" type="button" onClick={submitCode} disabled={submitting}>
                  {submitting ? '⏳' : '☁'} Submit
                </button>
              </div>
            </div>

            <div className="console-content-area">
              {activeTab === 'input' && (
                <div className="console-section">
                  <textarea
                    value={stdin}
                    onChange={(event) => setStdin(event.target.value)}
                    placeholder="Enter custom input here..."
                    rows={8}
                    className="console-textarea"
                  />
                </div>
              )}

              {activeTab === 'output' && (
                <div className="console-section">
                  {runOutput ? (
                    <div className="output-display">
                      <div className="output-meta">
                        <span className={`pill ${runOutput.status === 'Accepted' ? 'success' : runOutput.stderr ? 'danger' : ''}`}>
                          {runOutput.status}
                        </span>
                        {runOutput.time && <span className="pill">⏱ {runOutput.time}s</span>}
                        {runOutput.memory && <span className="pill">💾 {runOutput.memory} KB</span>}
                      </div>
                      {runOutput.stdout && (
                        <div>
                          <span className="example-label">Stdout:</span>
                          <pre className="output-pre">{runOutput.stdout}</pre>
                        </div>
                      )}
                      {runOutput.stderr && (
                        <div>
                          <span className="example-label error-label">Stderr:</span>
                          <pre className="output-pre error-pre">{runOutput.stderr}</pre>
                        </div>
                      )}
                      {runOutput.compileOutput && (
                        <div>
                          <span className="example-label error-label">Compile Error:</span>
                          <pre className="output-pre error-pre">{runOutput.compileOutput}</pre>
                        </div>
                      )}
                      {!runOutput.stdout && !runOutput.stderr && !runOutput.compileOutput && (
                        <p className="muted-copy">No output produced.</p>
                      )}
                    </div>
                  ) : (
                    <div className="empty-console">You must run your code first</div>
                  )}
                </div>
              )}

              {activeTab === 'results' && (
                <div className="console-section">
                  {submissionResult ? (
                    <div className="output-display">
                      <div className="output-meta">
                        <span className={`pill ${submissionResult.verdict === 'Accepted' ? 'success' : 'danger'}`}>
                          {submissionResult.verdict}
                        </span>
                        <span className="pill">Score: {submissionResult.score}%</span>
                        <span className="pill">
                          {submissionResult.passedCount}/{submissionResult.totalCount} passed
                        </span>
                      </div>
                      {submissionResult.visibleResults?.map((r, i) => (
                        <div key={i} className={`test-result-row ${r.passed ? 'pass' : 'fail'}`}>
                          <strong>Test {i + 1}</strong>
                          <span className={`pill ${r.passed ? 'success' : 'danger'}`}>
                            {r.passed ? '✓ Passed' : '✗ Failed'}
                          </span>
                          {!r.passed && r.expectedOutput && (
                            <div className="test-detail">
                              <div><span className="example-label">Expected:</span> <pre>{r.expectedOutput}</pre></div>
                              <div><span className="example-label">Got:</span> <pre>{r.actualOutput}</pre></div>
                            </div>
                          )}
                        </div>
                      ))}
                      {submissionResult.hiddenSummary?.map((r, i) => (
                        <div key={`h-${i}`} className={`test-result-row ${r.passed ? 'pass' : 'fail'}`}>
                          <strong>Hidden Test {r.testNumber}</strong>
                          <span className={`pill ${r.passed ? 'success' : 'danger'}`}>
                            {r.passed ? '✓ Passed' : '✗ ' + r.verdict}
                          </span>
                        </div>
                      ))}
                      {submissionResult.submission?._id && (
                        <button
                          className="secondary-button minimal mt-2"
                          onClick={() => navigate(`/results/${submissionResult.submission._id}`)}
                        >
                          View Full Results →
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="empty-console">You must submit your code first</div>
                  )}
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </Panel>

      <PanelResizeHandle className="resize-handle" />

      {/* Right panel — AI Mentor Chat */}
      <Panel defaultSize={25} minSize={15} className="mentor-panel">
        <div className="chat-header">
          <span className="chat-header-title">🤖 AI Mentor</span>
        </div>

        <div className="chat-messages">
          {chatMessages.length === 0 && (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">🤖</div>
              <p>Hi! I'm your AI Mentor.</p>
              <p className="muted-copy">Ask me anything about the problem. I'll give you hints and guide you — but I won't give you the answer!</p>
            </div>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role}`}>
              {msg.role === 'assistant' && <span className="chat-avatar">🤖</span>}
              <div className="chat-bubble-content">
                <pre className="chat-text">{msg.content}</pre>
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="chat-bubble assistant">
              <span className="chat-avatar">🤖</span>
              <div className="chat-bubble-content">
                <span className="chat-typing">Thinking<span className="dot-anim">...</span></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-input-bar">
          <textarea
            className="chat-input"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleChatKeyDown}
            placeholder="Ask a question..."
            rows={1}
          />
          <button
            className="chat-send-btn"
            type="button"
            onClick={sendChatMessage}
            disabled={chatLoading || !chatInput.trim()}
          >
            ➤
          </button>
        </div>
      </Panel>
    </PanelGroup>
  );
}
