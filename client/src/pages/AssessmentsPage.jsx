import { useEffect, useState } from 'react';
import api from '../api/client';

const blankForm = {
  title: '',
  description: '',
  durationMinutes: 90,
  status: 'draft',
  selectedQuestions: [],
  assignedBatches: '',
  assignedStudents: '',
  allowMentor: true
};

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewingId, setViewingId] = useState('');
  const [submissions, setSubmissions] = useState([]);

  const loadData = async () => {
    try {
      const [assessmentResponse, questionResponse, studentResponse] = await Promise.all([
        api.get('/assessments'),
        api.get('/questions'),
        api.get('/admin/students')
      ]);
      setAssessments(assessmentResponse.data.assessments || []);
      setQuestions(questionResponse.data.questions || []);
      setStudents(studentResponse.data.students || []);
    } catch (err) {
      console.error('Failed to load data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleQuestion = (qId) => {
    setForm((prev) => {
      const selected = prev.selectedQuestions.includes(qId)
        ? prev.selectedQuestions.filter((id) => id !== qId)
        : [...prev.selectedQuestions, qId];
      return { ...prev, selectedQuestions: selected };
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        durationMinutes: Number(form.durationMinutes),
        status: form.status,
        allowMentor: form.allowMentor,
        questions: form.selectedQuestions.map((questionId, index) => ({
          question: questionId,
          order: index + 1,
          points: 100
        })),
        assignedBatches: form.assignedBatches.split(',').map((i) => i.trim()).filter(Boolean),
        assignedStudents: form.assignedStudents.split(',').map((i) => i.trim()).filter(Boolean)
      };

      if (editingId) {
        await api.put(`/assessments/${editingId}`, payload);
      } else {
        await api.post('/assessments', payload);
      }

      setEditingId('');
      setForm(blankForm);
      await loadData();
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Unable to save assessment');
    } finally {
      setSaving(false);
    }
  };

  const editAssessment = (assessment) => {
    setEditingId(assessment._id);
    setForm({
      title: assessment.title,
      description: assessment.description || '',
      durationMinutes: assessment.durationMinutes || 90,
      status: assessment.status,
      selectedQuestions: (assessment.questions || []).map((item) => item.question?._id || item.question),
      assignedBatches: (assessment.assignedBatches || []).join(', '),
      assignedStudents: (assessment.assignedStudents || []).map((s) => s._id || s).join(', '),
      allowMentor: assessment.allowMentor !== false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteAssessment = async (id) => {
    if (!window.confirm('Delete this assessment?')) return;
    try {
      await api.delete(`/assessments/${id}`);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const viewSubmissions = async (id) => {
    if (viewingId === id) {
      setViewingId('');
      return;
    }
    try {
      const response = await api.get(`/submissions/assessment/${id}`);
      setSubmissions(response.data.submissions || []);
      setViewingId(id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load submissions');
    }
  };

  const cancelEdit = () => {
    setEditingId('');
    setForm(blankForm);
    setError('');
  };

  const questionLookup = new Map(questions.map((q) => [q._id, q]));

  // Unique batches from students
  const availableBatches = [...new Set(students.map((s) => s.batch).filter(Boolean))];

  return (
    <div className="dashboard-stack">
      <section className="page-hero compact-hero">
        <div>
          <p className="eyebrow">Assessment builder</p>
          <h1>Create and manage coding assessments</h1>
        </div>
        <span className="pill">{assessments.length} assessments</span>
      </section>

      <section className="panel-grid-two">
        {/* Form */}
        <form className="panel-card form-grid" onSubmit={submit}>
          <h3>{editingId ? '✏️ Edit assessment' : '➕ Create assessment'}</h3>

          <label>
            Title *
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>

          <label>
            Description
            <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>

          <div className="form-row-2">
            <label>
              Duration (minutes)
              <input type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </div>

          {/* Question Selection */}
          <div className="question-selector">
            <span className="example-label">Select Questions ({form.selectedQuestions.length} selected)</span>
            <div className="question-checkbox-list">
              {questions.length === 0 && <p className="muted-copy">No questions available. Create questions first.</p>}
              {questions.map((q) => (
                <label className="checkbox-row" key={q._id}>
                  <input
                    type="checkbox"
                    checked={form.selectedQuestions.includes(q._id)}
                    onChange={() => toggleQuestion(q._id)}
                  />
                  <span>{q.title}</span>
                  <span className={`pill diff-${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                </label>
              ))}
            </div>
          </div>

          <label>
            Assigned Batches
            <input
              value={form.assignedBatches}
              onChange={(e) => setForm({ ...form, assignedBatches: e.target.value })}
              placeholder={availableBatches.length ? `e.g. ${availableBatches.join(', ')}` : 'General'}
            />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.allowMentor}
              onChange={(e) => setForm({ ...form, allowMentor: e.target.checked })}
            />
            🤖 Allow AI Mentor during assessment
          </label>

          {error ? <div className="alert-box">{error}</div> : null}

          <div className="action-row">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Assessment' : 'Create Assessment'}
            </button>
            {editingId && (
              <button className="ghost-button" type="button" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Assessment List */}
        <section className="panel-card list-card">
          <h3>📋 Assessments</h3>
          <div className="table-list">
            {assessments.length === 0 && <p className="muted-copy">No assessments created yet.</p>}
            {assessments.map((assessment) => (
              <article className="question-item assessment-list-item" key={assessment._id}>
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong>{assessment.title}</strong>
                    <span className={`pill ${assessment.status === 'live' ? 'success' : assessment.status === 'completed' ? '' : 'scheduled'}`}>
                      {assessment.status}
                    </span>
                  </div>
                  <div className="muted-copy">{assessment.durationMinutes} mins · {assessment.questions?.length || 0} questions</div>
                  <div className="pill-row" style={{ marginTop: '0.4rem' }}>
                    {assessment.questions?.map((item) => {
                      const q = questionLookup.get(item.question?._id || item.question);
                      return q ? <span className="pill" key={q._id}>{q.title}</span> : null;
                    })}
                  </div>
                  {assessment.assignedBatches?.length > 0 && (
                    <div className="muted-copy" style={{ marginTop: '0.3rem', fontSize: '0.82rem' }}>
                      Batches: {assessment.assignedBatches.join(', ')}
                    </div>
                  )}

                  <div className="action-row" style={{ marginTop: '0.6rem' }}>
                    <button className="secondary-button small-button" type="button" onClick={() => editAssessment(assessment)}>
                      Edit
                    </button>
                    <button className="secondary-button small-button" type="button" onClick={() => viewSubmissions(assessment._id)}>
                      {viewingId === assessment._id ? 'Hide' : 'Submissions'}
                    </button>
                    <button className="danger-button small-button" type="button" onClick={() => deleteAssessment(assessment._id)}>
                      Delete
                    </button>
                  </div>

                  {/* Inline submissions view */}
                  {viewingId === assessment._id && (
                    <div className="submissions-inline">
                      <h4>Submissions ({submissions.length})</h4>
                      {submissions.length === 0 && <p className="muted-copy">No submissions yet.</p>}
                      {submissions.map((sub) => (
                        <div className="table-row" key={sub._id}>
                          <div>
                            <strong>{sub.student?.fullName || 'Unknown'}</strong>
                            <div className="muted-copy">{sub.question?.title} · {sub.language}</div>
                          </div>
                          <div className="action-row">
                            <span className={`pill ${sub.verdict === 'Accepted' ? 'success' : 'danger'}`}>{sub.verdict}</span>
                            <span className="pill">{sub.score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}