import { useNavigate } from 'react-router-dom';
import { PlayerPhoto } from '../../components/PlayerPhoto';
import { TeamLogo } from '../../components/TeamLogo';
import {
  buildAuctionQueue,
  nextBidAmount,
  purseOf,
  queueCounts,
  squadOf,
  useAuction,
} from '../../context/AuctionContext';
import { formatRupees, whatsappLink } from '../../utils';

export function AuctionPage() {
  const { state, dispatch } = useAuction();
  const navigate = useNavigate();
  const { live, config, teams } = state;

  if (!live.category) {
    return (
      <section className="card empty-state">
        <h2>No auction is running</h2>
        <p className="muted">Pick a player category on the Start Auction page to begin.</p>
        <button className="btn btn-yellow" onClick={() => navigate('/admin/start')}>
          Go to Start Auction
        </button>
      </section>
    );
  }

  const category = live.category;
  const player = state.players.find(p => p.id === live.currentPlayerId);
  const leader = teams.find(t => t.id === live.currentBidTeamId);
  const playersLeft = live.queue.length + (player ? 1 : 0);
  const unsoldLeft = queueCounts(state, category).unsold;
  const bidAmount = nextBidAmount(state);

  function endCategory() {
    dispatch({ type: 'END_CATEGORY' });
    navigate('/admin/start');
  }

  // Open WhatsApp with the congratulation message, then record the sale.
  function handleSold() {
    if (player && leader) {
      const text = `Congratulations ${player.name}! You have been selected for ${leader.name} in ${config.name}.`;
      window.open(whatsappLink(player.phone, text), '_blank', 'noopener');
    }
    dispatch({ type: 'SOLD' });
  }

  return (
    <>
      <div className="auction-layout">
        <section className="card player-card">
          <div className="row between">
            <span className="badge">{category} set</span>
            <span className="muted">{playersLeft} player(s) left in this set</span>
          </div>

          {player ? (
            <>
              <div className="player-hero">
                <PlayerPhoto src={player.photo} name={player.name} />
                <div className="player-hero-info">
                  <span className="muted">{player.category}</span>
                  <h2 className="player-name">{player.name}</h2>
                </div>
              </div>
              <div className="stats">
                <div className="stat">
                  <span className="muted">Base price</span>
                  <strong>{formatRupees(player.basePrice)}</strong>
                </div>
                <div className="stat stat-highlight">
                  <span className="muted">Current bid</span>
                  <strong>{formatRupees(live.currentBid)}</strong>
                </div>
                <div className="stat">
                  <span className="muted">Current bid team</span>
                  <strong>{leader ? leader.name : 'No bids yet'}</strong>
                </div>
              </div>
              <div className="action-row">
                <button
                  className="btn btn-success"
                  disabled={!leader}
                  onClick={handleSold}
                >
                  {leader ? `SOLD to ${leader.name}` : 'SOLD'}
                </button>
                <button className="btn btn-danger" onClick={() => dispatch({ type: 'UNSOLD' })}>
                  UNSOLD
                </button>
                <button className="btn btn-ghost" disabled={!leader} onClick={() => dispatch({ type: 'RESET_BID' })}>
                  Reset bid
                </button>
              </div>
            </>
          ) : (
            <div className="complete">
              <h2>{category} set complete</h2>
              {unsoldLeft > 0 && (
                <p className="muted">{unsoldLeft} unsold player(s) are waiting for a re-auction.</p>
              )}
              <div className="action-row" style={{ justifyContent: 'center' }}>
                {unsoldLeft > 0 && (
                  <button
                    className="btn btn-navy"
                    onClick={() => dispatch({ type: 'START_CATEGORY', category, queue: buildAuctionQueue(state, category) })}
                  >
                    Re-auction {unsoldLeft} unsold
                  </button>
                )}
                <button className="btn btn-yellow" onClick={endCategory}>
                  Choose another category
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="card">
          <h3>Teams</h3>
          <p className="muted" style={{ marginBottom: 12 }}>
            Click a team to raise the bid for it.
          </p>
          {teams.map(team => {
            const purse = purseOf(state, team.id);
            const isLeader = leader?.id === team.id;
            const canBid = !!player && !isLeader && purse >= bidAmount;
            return (
              <div className={isLeader ? 'team-bid leading' : 'team-bid'} key={team.id}>
                <TeamLogo src={team.logo} name={team.name} size={40} />
                <div className="team-bid-info">
                  <strong>{team.name}</strong>
                  <span className="muted">Purse {formatRupees(purse)}</span>
                </div>
                <button
                  className="btn btn-yellow btn-small"
                  disabled={!canBid}
                  onClick={() => dispatch({ type: 'BID', teamId: team.id })}
                >
                  {isLeader ? 'Leading' : `Bid ${bidAmount}`}
                </button>
              </div>
            );
          })}
          <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={endCategory}>
            End this set
          </button>
        </aside>
      </div>

      <section className="card">
        <h3>Remaining purse</h3>
        <div className="purse-grid">
          {teams.map(team => {
            const purse = purseOf(state, team.id);
            const count = squadOf(state, team.id).length;
            const percent = config.basePurse > 0 ? Math.max(0, (purse / config.basePurse) * 100) : 0;
            return (
              <div className="purse-item" key={team.id}>
                <TeamLogo src={team.logo} name={team.name} size={40} />
                <div>
                  <strong>{team.name}</strong>
                  <div className="muted">{count} player(s) bought</div>
                  <div className="purse-bar">
                    <span style={{ width: `${percent}%` }} />
                  </div>
                </div>
                <div className="purse-amount">{formatRupees(purse)}</div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
