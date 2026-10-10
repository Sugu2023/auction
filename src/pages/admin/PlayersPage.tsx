import { useState, type FormEvent } from 'react';
import { isAuctionLocked, useAuction } from '../../context/AuctionContext';
import { CATEGORIES, type Category } from '../../types';
import { formatRupees } from '../../utils';

export function PlayersPage() {
  const { state, dispatch } = useAuction();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Batsman');
  const [basePrice, setBasePrice] = useState('100');
  const [error, setError] = useState('');
  const locked = isAuctionLocked(state);

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const price = Number(basePrice);
    if (!name.trim()) {
      setError('Player name is required.');
      return;
    }
    if (!Number.isFinite(price) || price < 1) {
      setError('Base price must be at least 1.');
      return;
    }
    dispatch({
      type: 'ADD_PLAYER',
      player: { id: `player-${Date.now()}`, name: name.trim(), category, basePrice: price },
    });
    setName('');
    setError('');
  }

  return (
    <>
      <div className="page-head">
        <h1>Players</h1>
        <p className="muted">Add players with their category and base price.</p>
      </div>

      {locked && <div className="alert">The auction has started, so the player list is locked.</div>}

      <section className="card">
        <form onSubmit={handleAdd}>
          <div className="form-grid">
            <label>
              Player name
              <input value={name} disabled={locked} onChange={e => setName(e.target.value)} />
            </label>
            <label>
              Category
              <select value={category} disabled={locked} onChange={e => setCategory(e.target.value as Category)}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Base price (₹)
              <input type="number" min={1} value={basePrice} disabled={locked} onChange={e => setBasePrice(e.target.value)} />
            </label>
          </div>
          <div className="form-actions">
            <button className="btn btn-yellow" type="submit" disabled={locked}>
              Add player
            </button>
            {error && <span className="alert alert-error" style={{ margin: 0 }}>{error}</span>}
          </div>
        </form>
      </section>

      <section className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          {CATEGORIES.map(c => (
            <span className="badge" key={c}>
              {c}: {state.players.filter(p => p.category === c).length}
            </span>
          ))}
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Category</th>
                <th>Base price</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.players.map((player, index) => (
                <tr key={player.id}>
                  <td>{index + 1}</td>
                  <td>{player.name}</td>
                  <td>{player.category}</td>
                  <td>{formatRupees(player.basePrice)}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-small"
                      disabled={locked}
                      onClick={() => dispatch({ type: 'REMOVE_PLAYER', playerId: player.id })}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {state.players.length === 0 && <p className="muted">No players yet.</p>}
      </section>
    </>
  );
}
