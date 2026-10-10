import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brand } from './Brand';

const LINKS = [
  { to: '/admin/setup', label: 'Auction Setup' },
  { to: '/admin/teams', label: 'Teams' },
  { to: '/admin/players', label: 'Players' },
  { to: '/admin/start', label: 'Start Auction' },
  { to: '/admin/auction', label: 'Live Auction' },
  { to: '/admin/squads', label: 'Squads' },
];

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
        <Brand />
        <nav className="nav">
          {LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {link.label}
            </NavLink>
          ))}
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
