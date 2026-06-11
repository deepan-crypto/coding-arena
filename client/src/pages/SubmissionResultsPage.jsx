import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';

export default function SubmissionResultsPage() {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);

  useEffect(() => {
    async function load() {
      const response = await api.get(`/submissions/${submissionId}`);
      setSubmission(response.data.submission);
    }

    load();
  }, [submissionId]);

  return (
    <div className="dashboard-stack">
      <section className="page-hero compact-hero">
        <div>
          <p className="eyebrow">Submission result</p>
          <h1>{submission?.verdict || 'Loading result...'}</h1>
        </div>
        <Link className="secondary-button" to="/student">
          Back to dashboard
        </Link>
      </section>

      <section className="stat-grid">
        <div className="stat-card"><span className="stat-label">Score</span><strong className="stat-value">{submission?.score ?? '...'}</strong></div>
        <div className="stat-card"><span className="stat-label">Passed</span><strong className="stat-value">{submission?.passedCount ?? '...'}</strong></div>
        <div className="stat-card"><span className="stat-label">Total</span><strong className="stat-value">{submission?.totalCount ?? '...'}</strong></div>
      </section>

      <section className="panel-card">
        <h3>Test breakdown</h3>
        <div className="results-list">
          {(submission?.testResults || []).map((result, index) => (
            <article className="result-row" key={index}>
              <div>
                <strong>{result.isHidden ? `Hidden Test ${index + 1}` : `Visible Test ${index + 1}`}</strong>
                <div className="muted-copy">{result.verdict}</div>
              </div>
              <span className={`pill ${result.passed ? 'success' : 'danger'}`}>{result.passed ? 'Passed' : 'Failed'}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}