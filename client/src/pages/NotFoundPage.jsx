import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="auth-screen">
      <div className="auth-card center-card">
        <p className="eyebrow">404</p>
        <h2>Page not found</h2>
        <Link className="primary-button" to="/">
          Go home
        </Link>
      </div>
    </div>
  );
}