import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { queueCounts } from '../../auctionState';
import { useAuction } from '../../context/AuctionContext';
import { CATEGORIES, type Category } from '../../types';

export function StartAuctionPage() {
  const { state, send } = useAuction();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const base = `/admin/auctions/${state.config.id}`;
  const teamsReady = state.teams.length === state.config.totalTeams;
  // A player on the block means a set is still being auctioned.
  const inProgress = state.live.currentPlayerId !== null;

  async function startCategory(category: Category) {
    setError('');
    setBusy(true);
    try {
      await send(`/auctions/${state.config.id}/live/start`, { method: 'POST', body: { category } });
      navigate(`${base}/live`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start the auction.');
    } finally {
      setBusy(false);
    }
  }

  async function resetAuction() {
    if (!window.confirm('Reset the auction? All sold and unsold records will be cleared.')) return;
    setError('');
    try {
      await send(`/auctions/${state.config.id}/reset`, { method: 'POST' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset the auction.');
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Start Auction</h1>
        <p className="muted">Pick a category. Its players are shuffled and auctioned one by one.</p>
      </div>

      {!teamsReady && (
        <div className="alert">
          Add all {state.config.totalTeams} teams before starting (currently {state.teams.length}).
        </div>
      )}

      {inProgress && (
        <div className="alert">
          <span>Auction in progress: <strong>{state.live.category}</strong></span>
          <button className="btn btn-yellow btn-small" onClick={() => navigate(`${base}/live`)}>
            Continue auction
          </button>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-cards">
        {CATEGORIES.map(category => {
          const { fresh, unsold } = queueCounts(state, category);
          const total = fresh + unsold;
          return (
            <div className="card" key={category}>
              <h3>{category}</h3>
              <p className="muted">
                {fresh} new player(s)
                {unsold > 0 && ` · ${unsold} unsold for re-auction`}
              </p>
              <button
                className="btn btn-navy btn-block"
                disabled={!teamsReady || inProgress || total === 0 || busy}
                onClick={() => startCategory(category)}
              >
                {unsold > 0 && fresh === 0 ? 'Start re-auction' : 'Shuffle & start'}
              </button>
            </div>
          );
        })}
      </div>

      <section className="card danger-zone" style={{ marginTop: 16 }}>
        <h3>Reset</h3>
        <p className="muted">Clears all sold and unsold records of this auction so it can be run again.</p>
        <button className="btn btn-danger btn-small" onClick={resetAuction}>
          Reset auction
        </button>
      </section>
    </>
  );
}
