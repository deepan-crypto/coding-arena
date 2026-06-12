import { useEffect, useState } from 'react';
import api from '../api/client';

const blankForm = {
  title: '',
  difficulty: 'Easy',
  description: '',
  constraints: '',
  tags: '',
  status: 'draft',
  timeLimit: 2,
  memoryLimit: 256,
  starterCode: {
    cpp: '',
    java: '',
    python: '',
    javascript: ''
  },
  visibleTestCases: '[]',
  hiddenTestCases: '[]'
};

function parseTestCases(value, label) {
  try {
    const parsed = JSON.parse(value || '[]');

    if (!Array.isArray(parsed)) {
      throw new Error(`${label} must be a JSON array.`);
    }

    parsed.forEach((testCase, index) => {
      if (!testCase || typeof testCase !== 'object' || Array.isArray(testCase)) {
        throw new Error(`${label} item ${index + 1} must be an object.`);
      }

      if (testCase.input === undefined || testCase.output === undefined) {
        throw new Error(`${label} item ${index + 1} must include input and output.`);
      }
    });

    return parsed.map((testCase) => ({
      ...testCase,
      input: String(testCase.input),
      output: String(testCase.output),
      explanation: testCase.explanation ? String(testCase.explanation) : ''
    }));
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(
        `${label} is invalid JSON. Use double quotes around text values and escape line breaks as \\n.`
      );
    }

    throw err;
  }
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [starterTab, setStarterTab] = useState('javascript');

  const loadQuestions = async () => {
    try {
      const response = await api.get('/questions');
      setQuestions(response.data.questions || []);
    } catch (err) {
      console.error('Failed to load questions', err);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        visibleTestCases: parseTestCases(form.visibleTestCases, 'Visible test cases'),
        hiddenTestCases: parseTestCases(form.hiddenTestCases, 'Hidden test cases'),
        timeLimit: Number(form.timeLimit),
        memoryLimit: Number(form.memoryLimit)
      };

      if (editingId) {
        await api.put(`/questions/${editingId}`, payload);
      } else {
        await api.post('/questions', payload);
      }

      setForm(blankForm);
      setEditingId('');
      await loadQuestions();
    } catch (submitError) {
      setError(submitError.response?.data?.message || submitError.message || 'Unable to save question');
    } finally {
      setSaving(false);
    }
  };

  const editQuestion = (question) => {
    setEditingId(question._id);
    setForm({
      title: question.title,
      difficulty: question.difficulty,
      description: question.description,
      constraints: question.constraints || '',
      tags: (question.tags || []).join(', '),
      status: question.status || 'draft',
      timeLimit: question.timeLimit || 2,
      memoryLimit: question.memoryLimit || 256,
      starterCode: {
        cpp: question.starterCode?.cpp || '',
        java: question.starterCode?.java || '',
        python: question.starterCode?.python || '',
        javascript: question.starterCode?.javascript || ''
      },
      visibleTestCases: JSON.stringify(question.visibleTestCases || [], null, 2),
      hiddenTestCases: JSON.stringify(question.hiddenTestCases || [], null, 2)
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteQuestion = async (id) => {
    if (!window.confirm('Delete this question? This cannot be undone.')) return;
    try {
      await api.delete(`/questions/${id}`);
      await loadQuestions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const cancelEdit = () => {
    setEditingId('');
    setForm(blankForm);
    setError('');
  };

  return (
    <div className="dashboard-stack">
      <section className="page-hero compact-hero">
        <div>
          <p className="eyebrow">Question bank</p>
          <h1>Create and manage coding challenges</h1>
        </div>
        <span className="pill">{questions.length} questions</span>
      </section>

      <section className="panel-grid-two">
        {/* Form Panel */}
        <form className="panel-card form-grid" onSubmit={submit}>
          <h3>{editingId ? '✏️ Edit question' : '➕ Create question'}</h3>

          <label>
            Title *
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>

          <label>
            Difficulty
            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </label>

          <label>
            Description *
            <textarea rows="7" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </label>

          <label>
            Constraints
            <textarea rows="3" value={form.constraints} onChange={(e) => setForm({ ...form, constraints: e.target.value })} />
          </label>

          <div className="form-row-2">
            <label>
              Tags
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="arrays, hashmap" />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>



          {/* Starter code with tabs */}
          <div className="starter-code-section">
            <span className="example-label">Starter Code</span>
            <div className="console-tabs">
              {['javascript', 'python', 'java', 'cpp'].map((lang) => (
                <button key={lang} type="button" className={`console-tab ${starterTab === lang ? 'active' : ''}`} onClick={() => setStarterTab(lang)}>
                  {lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              ))}
            </div>
            <textarea
              rows="6"
              value={form.starterCode[starterTab]}
              onChange={(e) => setForm({ ...form, starterCode: { ...form.starterCode, [starterTab]: e.target.value } })}
              placeholder={`Starter code for ${starterTab}...`}
              className="code-textarea"
            />
          </div>

          <label>
            Visible test cases (JSON)
            <textarea rows="5" value={form.visibleTestCases} onChange={(e) => setForm({ ...form, visibleTestCases: e.target.value })} className="code-textarea" placeholder='[{"input": "...", "output": "...", "explanation": "..."}]' />
            <span className="field-help">{'Example: [{"input":"1\\n1 2","output":"3","explanation":"Sum of 1+2 is 3"}]'}</span>
          </label>

          <label>
            Hidden test cases (JSON)
            <textarea rows="5" value={form.hiddenTestCases} onChange={(e) => setForm({ ...form, hiddenTestCases: e.target.value })} className="code-textarea" placeholder='[{"input": "...", "output": "..."}]' />
            <span className="field-help">Use valid JSON only. Text values need double quotes.</span>
          </label>

          {error ? <div className="alert-box">{error}</div> : null}

          <div className="action-row">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Question' : 'Create Question'}
            </button>
            {editingId && (
              <button className="ghost-button" type="button" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Questions List */}
        <section className="panel-card list-card">
          <h3>📚 Existing Questions</h3>
          <div className="table-list">
            {questions.length === 0 && <p className="muted-copy">No questions created yet.</p>}
            {questions.map((question) => (
              <article className="question-item" key={question._id}>
                <div>
                  <strong>{question.title}</strong>
                  <div className="pill-row" style={{ marginTop: '0.4rem' }}>
                    <span className={`pill diff-${question.difficulty.toLowerCase()}`}>{question.difficulty}</span>
                    <span className={`pill ${question.status === 'published' ? 'success' : ''}`}>{question.status}</span>
                    {(question.tags || []).map((tag) => (
                      <span className="pill" key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="muted-copy" style={{ marginTop: '0.3rem', fontSize: '0.82rem' }}>
                    {question.visibleTestCases?.length || 0} visible · {question.hiddenTestCases?.length || 0} hidden test cases
                  </div>
                </div>
                <div className="action-row">
                  <button className="secondary-button small-button" type="button" onClick={() => editQuestion(question)}>
                    Edit
                  </button>
                  <button className="danger-button small-button" type="button" onClick={() => deleteQuestion(question._id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
