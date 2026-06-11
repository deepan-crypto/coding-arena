import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import StatCard from '../components/StatCard.jsx';

export default function StudentDashboardPage() {
  const [dashboard, setDashboard] = useState({ upcomingAssessments: [], recentSubmissions: [], leaderboard: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get('/student/dashboard');
        setDashboard(response.data);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const totalAttempts = dashboard.recentSubmissions.length;
  const totalScore = dashboard.recentSubmissions.reduce((sum, s) => sum + (s.score || 0), 0);
  const avgScore = totalAttempts ? Math.round(totalScore / totalAttempts) : 0;

  return (
    <div className="dashboard-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Student Dashboard</p>
          <h1>Ready to code? Pick an assessment and start solving.</h1>
        </div>
      </section>

      <section className="stat-grid stat-grid-3">
        <StatCard label="Available Assessments" value={dashboard.upcomingAssessments.length} accent="var(--accent)" />
        <StatCard label="Recent Submissions" value={totalAttempts} accent="var(--accent-2)" />
        <StatCard label="Average Score" value={`${avgScore}%`} accent="var(--accent)" />
      </section>

      {/* Assessments */}
      <section className="panel-card">
        <h3>📋 Available Assessments</h3>
        {loading && <p className="muted-copy">Loading assessments...</p>}
        <div className="assessment-grid">
          {!loading && dashboard.upcomingAssessments.length === 0 && (
            <p className="muted-copy">No assessments available right now.</p>
          )}
          {dashboard.upcomingAssessments.map((assessment) => (
            <article className="assessment-card" key={assessment._id}>
              <div className="assessment-card-header">
                <h4>{assessment.title}</h4>
                <span className={`pill ${assessment.status === 'live' ? 'success' : ''}`}>
                  {assessment.status}
                </span>
              </div>
              {assessment.description && (
                <p className="muted-copy">{assessment.description}</p>
              )}
              <div className="pill-row">
                <span className="pill">⏱ {assessment.durationMinutes} mins</span>
                <span className="pill">📝 {assessment.questions?.length || 0} questions</span>
                {assessment.allowMentor !== false && <span className="pill">🤖 AI Mentor</span>}
              </div>
              {assessment.isCompleted ? (
                <button className="primary-button full-width inline-button" disabled style={{ background: 'var(--border)', color: 'var(--muted)', cursor: 'not-allowed' }}>
                  ✓ Completed
                </button>
              ) : assessment.questions?.[0] ? (
                <Link
                  className="primary-button full-width inline-button"
                  to={`/student/assessments/${assessment._id}/questions/${assessment.questions[0].question?._id || assessment.questions[0].question}`}
                >
                  ▶ Start Assessment
                </Link>
              ) : (
                <span className="muted-copy">No questions assigned</span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="panel-grid-two">
        {/* Recent Submissions */}
        <article className="panel-card">
          <h3>📊 Recent Submissions</h3>
          <div className="table-list">
            {dashboard.recentSubmissions.length === 0 && (
              <p className="muted-copy">No submissions yet. Start solving!</p>
            )}
            {dashboard.recentSubmissions.map((submission) => (
              <div className="table-row" key={submission._id}>
                <div>
                  <strong>{submission.question?.title || 'Unknown'}</strong>
                  <div className="muted-copy">
                    <span className={submission.verdict === 'Accepted' ? 'text-success' : 'text-danger'}>
                      {submission.verdict}
                    </span>
                    {' · '}{submission.score}% · {submission.language}
                  </div>
                </div>
                <Link className="secondary-button small-button" to={`/results/${submission._id}`}>
                  View
                </Link>
              </div>
            ))}
          </div>
        </article>

        {/* Leaderboard */}
        <article className="panel-card">
          <h3>🏆 Leaderboard</h3>
          <div className="table-list">
            {dashboard.leaderboard.length === 0 && (
              <p className="muted-copy">No rankings yet.</p>
            )}
            {dashboard.leaderboard.map((entry, index) => (
              <div className="table-row" key={String(entry._id) || index}>
                <div>
                  <strong>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    {' '}Rank {index + 1}
                  </strong>
                  <div className="muted-copy">{entry.attempts} submissions</div>
                </div>
                <span className="pill success">{entry.totalScore} pts</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}