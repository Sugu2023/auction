import { purseOf, squadOf } from '../../auctionState';
import { TeamLogo } from '../../components/TeamLogo';
import { useAuction } from '../../context/AuctionContext';
import { downloadTeamPdf } from '../../teamPdf';
import { formatRupees } from '../../utils';

export function SquadsPage() {
  const { state } = useAuction();
  const soldIds = new Set(state.sales.map(s => s.playerId));
  const unsoldPlayers = state.players.filter(p => state.live.unsold.includes(p.id) && !soldIds.has(p.id));

  return (
    <>
      <div className="page-head">
        <h1>Squads</h1>
        <p className="muted">Which players each team has bought.</p>
      </div>

      {state.teams.map(team => {
        const squad = squadOf(state, team.id);
        return (
          <section className="card" key={team.id}>
            <div className="squad-head">
              <TeamLogo src={team.logo} name={team.name} size={56} />
              <div>
                <h3>{team.name}</h3>
                <div className="muted">
                  Owner: {team.owner} · Captain: {team.captain}
                </div>
              </div>
              <div className="purse-amount">Purse: {formatRupees(purseOf(state, team.id))}</div>
              <button className="btn btn-navy btn-small" onClick={() => downloadTeamPdf(team, state)}>
                Download PDF
              </button>
            </div>
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
        );
      })}

      {unsoldPlayers.length > 0 && (
        <section className="card">
          <h3>Unsold players</h3>
          <p className="muted">{unsoldPlayers.map(p => p.name).join(', ')}</p>
        </section>
      )}
    </>
  );
}
