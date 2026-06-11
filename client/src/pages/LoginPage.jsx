import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(form.email, form.password);
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    } catch (loginError) {
      setError(loginError.response?.data?.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-header">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h2>Student Sign In</h2>
          </div>
          <button className="ghost-button" onClick={toggleTheme} type="button">
            {theme === 'dark' ? '☀ Light' : '☾ Dark'}
          </button>
        </div>

        <form className="stack-form" onSubmit={submit}>
          <label>
            Email
            <input
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              type="email"
              required
            />
          </label>
          <label>
            Password
            <input
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              type="password"
              required
            />
          </label>
          {error ? <div className="alert-box">{error}</div> : null}
          <button className="primary-button full-width" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-footer-links">
          <p className="muted-copy">
            New student? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}