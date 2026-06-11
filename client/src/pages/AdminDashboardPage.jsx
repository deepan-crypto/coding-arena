import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import StatCard from '../components/StatCard.jsx';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ fullName: '', email: '', password: '', batch: 'General' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const loadData = async () => {
    try {
      const [dashboardResponse, studentsResponse] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/students')
      ]);
      setStats(dashboardResponse.data.stats);
      setStudents(studentsResponse.data.students || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addStudent = async (event) => {
    event.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await api.post('/admin/students', newStudent);
      setNewStudent({ fullName: '', email: '', password: '', batch: 'General' });
      setShowAddForm(false);
      await loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create student');
    } finally {
      setFormLoading(false);
    }
  };

  const deleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.delete(`/admin/students/${id}`);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete student');
    }
  };

  return (
    <div className="dashboard-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Admin Console</p>
          <h1>Dashboard</h1>
        </div>
        <div className="toolbar-links">
          <Link className="secondary-button" to="/admin/questions">
            📝 Questions
          </Link>
          <Link className="secondary-button" to="/admin/assessments">
            📋 Assessments
          </Link>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="stat-grid">
        <StatCard label="Total Students" value={stats?.totalStudents ?? '...'} accent="var(--accent)" />
        <StatCard label="Total Assessments" value={stats?.totalAssessments ?? '...'} accent="var(--accent-2)" />
        <StatCard label="Total Questions" value={stats?.totalQuestions ?? '...'} accent="var(--accent)" />
        <StatCard label="Total Submissions" value={stats?.totalSubmissions ?? '...'} accent="var(--accent-2)" />
        <StatCard label="Average Score" value={stats?.averageScore != null ? `${stats.averageScore}%` : '...'} accent="var(--accent)" />
        <StatCard label="AI Mentor Requests" value={stats?.aiMentorRequests ?? '...'} accent="var(--accent-2)" />
      </section>

      {/* Student Management */}
      <section className="panel-card">
        <div className="panel-header">
          <h3>Student Management</h3>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '✕ Cancel' : '+ Add Student'}
          </button>
        </div>

        {showAddForm && (
          <form className="inline-form" onSubmit={addStudent}>
            <input
              placeholder="Full Name"
              value={newStudent.fullName}
              onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })}
              required
            />
            <input
              placeholder="Email"
              type="email"
              value={newStudent.email}
              onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
              required
            />
            <input
              placeholder="Password"
              type="password"
              value={newStudent.password}
              onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
              required
            />
            <input
              placeholder="Batch"
              value={newStudent.batch}
              onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })}
            />
            {formError && <div className="alert-box">{formError}</div>}
            <button className="primary-button" type="submit" disabled={formLoading}>
              {formLoading ? 'Creating...' : 'Create Student'}
            </button>
          </form>
        )}

        <div className="table-list">
          {loading && <p className="muted-copy">Loading students...</p>}
          {!loading && students.length === 0 && (
            <p className="muted-copy">No students registered yet.</p>
          )}
          {students.map((student) => (
            <div className="table-row" key={student.id}>
              <div>
                <strong>{student.fullName}</strong>
                <div className="muted-copy">{student.email}</div>
              </div>
              <div className="action-row">
                <span className="pill">{student.batch}</span>
                <span className={`pill ${student.isActive ? 'success' : 'danger'}`}>
                  {student.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  className="danger-button small-button"
                  type="button"
                  onClick={() => deleteStudent(student.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

