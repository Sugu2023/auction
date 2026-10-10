import { useNavigate } from 'react-router-dom';
import { buildAuctionQueue, queueCounts, useAuction } from '../../context/AuctionContext';
import { CATEGORIES, type Category } from '../../types';

export function StartAuctionPage() {
  const { state, dispatch } = useAuction();
  const navigate = useNavigate();
  const teamsReady = state.teams.length === state.config.totalTeams;
  // A player on the block means a set is still being auctioned.
  const inProgress = state.live.currentPlayerId !== null;

  function startCategory(category: Category) {
    dispatch({ type: 'START_CATEGORY', category, queue: buildAuctionQueue(state, category) });
    navigate('/admin/auction');
  }

  function resetAuction() {
    if (window.confirm('Reset the auction? All sold and unsold records will be cleared.')) {
      dispatch({ type: 'RESET_AUCTION' });
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
          <button className="btn btn-yellow btn-small" onClick={() => navigate('/admin/auction')}>
            Continue auction
          </button>
        </div>
      )}

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
                disabled={!teamsReady || inProgress || total === 0}
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
        <p className="muted">Clears all sold and unsold records so the auction can be run again.</p>
        <button className="btn btn-danger btn-small" onClick={resetAuction}>
          Reset auction
        </button>
      </section>
    </>
  );
}
