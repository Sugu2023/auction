import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { useAuth } from '../context/AuthContext';
import { auctionData } from '../data';

export function LoginPage() {
  const { session, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (session) return <Navigate to={session.role === 'admin' ? '/admin' : '/team'} replace />;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!login(username, password)) setError('Invalid username or password.');
  }

  return (
    <div className="login-wrap">
      <section className="card login-card">
        <Brand />
        <h2 style={{ marginTop: 16 }}>Sign in</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Username
            <input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-yellow btn-block" type="submit">
            Login
          </button>
        </form>
        <p className="muted" style={{ marginTop: 16 }}>Demo accounts (from static JSON):</p>
        <ul className="demo-list">
          {auctionData.users.map(u => (
            <li key={u.username}>
              <strong>{u.username}</strong> / {u.password} ({u.role === 'admin' ? 'Admin' : 'Team'})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
