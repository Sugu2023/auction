import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, ApiError } from '../api/client';
import { purseOf, squadOf } from '../auctionState';
import { Brand } from '../components/Brand';
import { PlayerPhoto } from '../components/PlayerPhoto';
import { TeamLogo } from '../components/TeamLogo';
import { AuctionProvider, useAuction } from '../context/AuctionContext';
import { useAuth } from '../context/AuthContext';
import { downloadTeamPdf } from '../teamPdf';
import { formatRupees } from '../utils';

/** A team login finds its auction (the server only returns the one its team is in), then shows it. */
export function TeamPage() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [auctionId, setAuctionId] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ id: string }[]>('/auctions')
      .then(list => setAuctionId(list[0]?.id ?? null))
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load your auction.'));
  }, []);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

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

  let body;
  if (error) body = <div className="alert alert-error">{error}</div>;
  else if (auctionId === undefined) body = <p className="muted">Loading…</p>;
  else if (auctionId === null)
    body = (
      <section className="card empty-state">
        <h2>Not in an auction</h2>
        <p className="muted">Your team is not part of any auction. Please contact the admin.</p>
      </section>
    );
  else
    body = (
      <AuctionProvider auctionId={auctionId}>
        <TeamView />
      </AuctionProvider>
    );

  return (
    <>
      {header}
      <main className="container">{body}</main>
    </>
  );
}

function TeamView() {
  const { session } = useAuth();
  const { state } = useAuction();

  const team = state.teams.find(t => t.id === session?.teamId);
  if (!team) {
    return (
      <section className="card empty-state">
        <h2>Team not found</h2>
        <p className="muted">Your team is not part of this auction. Please contact the admin.</p>
      </section>
    );
  }

  const purse = purseOf(state, team.id);
  const squad = squadOf(state, team.id);
  const spent = state.config.basePurse - purse;
  const leader = state.teams.find(t => t.id === state.live.currentBidTeamId);
  const livePlayer = state.players.find(p => p.id === state.live.currentPlayerId);

  return (
    <>
      <section className="card team-hero">
        <TeamLogo src={team.logo} name={team.name} size={96} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1>{team.name}</h1>
          <p className="kv">Owner: <strong>{team.owner}</strong></p>
          <p className="kv">Captain: <strong>{team.captain}</strong></p>
          <p className="kv muted">{state.config.name}</p>
          <button className="btn btn-navy btn-small" style={{ marginTop: 8 }} onClick={() => downloadTeamPdf(team, state)}>
            Download team PDF
          </button>
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

      <section className="card">
        <h3>All players</h3>
        <div className="player-grid">
          {state.players.map(player => (
            <div className="player-tile" key={player.id}>
              <PlayerPhoto src={player.photo} name={player.name} />
              <strong>{player.name}</strong>
              <span className="muted">
                {player.category} · {formatRupees(player.basePrice)}
              </span>
            </div>
          ))}
        </div>
        {state.players.length === 0 && <p className="muted">No players yet.</p>}
      </section>
    </>
  );
}
