import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brand } from './Brand';

export function AdminLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div>
      <header className="topbar">
        <Link to="/admin" className="brand-link">
          <Brand />
        </Link>
        <nav className="nav">
          <Link to="/admin" className="nav-link">
            Auctions
          </Link>
        </nav>
        <div className="topbar-right">
          <span className="muted">{session?.username}</span>
          <button className="btn btn-ghost btn-small" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
