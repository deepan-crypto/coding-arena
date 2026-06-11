import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="landing-page">
      <div className="landing-glow glow-a" />
      <div className="landing-glow glow-b" />
      <div className="landing-top-bar">
        <button className="ghost-button" onClick={toggleTheme} type="button">
          {theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>
      </div>
      <main className="hero-card">
        <p className="eyebrow">AI-powered coding assessment platform</p>
        <h1>Run secure assessments, coach students with AI, and keep every solution honest.</h1>
        <p className="hero-copy">
          A production-ready stack for admin-authored problems, Judge0-backed execution, Monaco-based code editing,
          and an AI mentor that teaches with hints instead of final answers.
        </p>

        <div className="landing-login-grid">
          <div className="login-card student-card">
            <div className="login-card-icon">🎓</div>
            <h3>Student Portal</h3>
            <p className="muted-copy">Solve coding problems, run code in the browser, and get AI-guided hints.</p>
            <Link className="primary-button full-width" to="/login">
              Student Sign In
            </Link>
            <Link className="secondary-button full-width" to="/register">
              Create Account
            </Link>
          </div>

          <div className="login-card admin-card">
            <div className="login-card-icon">🛡️</div>
            <h3>Admin Console</h3>
            <p className="muted-copy">Create questions, manage assessments, monitor submissions and analytics.</p>
            <Link className="primary-button full-width admin-login-btn" to="/admin/login">
              Admin Sign In
            </Link>
          </div>
        </div>

        <div className="hero-badges">
          <span>React + JavaScript</span>
          <span>Node + Express</span>
          <span>MongoDB</span>
          <span>OpenAI + Judge0</span>
          <span>Monaco Editor</span>
        </div>
      </main>
    </div>
  );
}