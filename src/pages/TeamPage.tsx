import { useNavigate } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { TeamLogo } from '../components/TeamLogo';
import { purseOf, squadOf, useAuction } from '../context/AuctionContext';
import { useAuth } from '../context/AuthContext';
import { formatRupees } from '../utils';

export function TeamPage() {
  const { session, logout } = useAuth();
  const { state } = useAuction();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const team = state.teams.find(t => t.id === session?.teamId);
  const header = (
    <header className="topbar">
      <Brand />
      <div className="topbar-right">
        <span className="muted">{session?.username}</span>
        <button className="btn btn-ghost btn-small" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );

  if (!team) {
    return (
      <>
        {header}
        <main className="container">
          <section className="card empty-state">
            <h2>Team not found</h2>
            <p className="muted">Your team is not part of this auction. Please contact the admin.</p>
          </section>
        </main>
      </>
    );
  }

  const purse = purseOf(state, team.id);
  const squad = squadOf(state, team.id);
  const spent = state.config.basePurse - purse;
  const leader = state.teams.find(t => t.id === state.live.currentBidTeamId);
  const livePlayer = state.players.find(p => p.id === state.live.currentPlayerId);

  return (
    <>
      {header}
      <main className="container">
        <section className="card team-hero">
          <TeamLogo src={team.logo} name={team.name} size={96} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1>{team.name}</h1>
            <p className="kv">Owner: <strong>{team.owner}</strong></p>
            <p className="kv">Captain: <strong>{team.captain}</strong></p>
          </div>
        </section>

        {livePlayer && (
          <div className="live-banner">
            Live now: <strong>{livePlayer.name}</strong> · Current bid {formatRupees(state.live.currentBid)}
            {leader ? ` by ${leader.name}` : ' (no bids yet)'}
          </div>
        )}

        <div className="stats">
          <div className="stat">
            <span className="muted">Base purse</span>
            <strong>{formatRupees(state.config.basePurse)}</strong>
          </div>
          <div className="stat">
            <span className="muted">Spent</span>
            <strong>{formatRupees(spent)}</strong>
          </div>
          <div className="stat stat-highlight">
            <span className="muted">Remaining purse</span>
            <strong>{formatRupees(purse)}</strong>
          </div>
          <div className="stat">
            <span className="muted">Players bought</span>
            <strong>{squad.length}</strong>
          </div>
        </div>

        <section className="card">
          <h3>Our squad</h3>
          {squad.length === 0 ? (
            <p className="muted">No players bought yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Category</th>
                    <th>Bought for</th>
                  </tr>
                </thead>
                <tbody>
                  {squad.map((entry, index) => (
                    <tr key={entry.player.id}>
                      <td>{index + 1}</td>
                      <td>{entry.player.name}</td>
                      <td>{entry.player.category}</td>
                      <td>{formatRupees(entry.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
