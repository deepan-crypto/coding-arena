import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', batch: 'General' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await register(form);
      navigate(user.role === 'admin' ? '/admin' : '/student', { replace: true });
    } catch (registerError) {
      setError(registerError.response?.data?.message || 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <p className="eyebrow">Student onboarding</p>
        <h2>Create account</h2>
        <form className="stack-form" onSubmit={submit}>
          <label>
            Full name
            <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
          </label>
          <label>
            Email
            <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required />
          </label>
          <label>
            Password
            <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" required />
          </label>
          <label>
            Batch
            <input value={form.batch} onChange={(event) => setForm({ ...form, batch: event.target.value })} />
          </label>
          {error ? <div className="alert-box">{error}</div> : null}
          <button className="primary-button full-width" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>
        <p className="muted-copy">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}