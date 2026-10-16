import { useState, type ChangeEvent, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { isAuctionLocked } from '../../auctionState';
import { PlayerPhoto } from '../../components/PlayerPhoto';
import { useAuction } from '../../context/AuctionContext';
import { downloadPlayersPdf } from '../../playersPdf';
import { CATEGORIES, type Category } from '../../types';
import { formatRupees } from '../../utils';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export function PlayersPage() {
  const { state, send } = useAuction();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Batsman');
  const [basePrice, setBasePrice] = useState('100');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState('');
  const [pdfCategory, setPdfCategory] = useState<Category | 'All'>('All');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const locked = isAuctionLocked(state);
  const base = `/auctions/${state.config.id}`;

  // Reads the chosen image and keeps it as a base64 data URL, which the backend stores.
  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('Photo must be 2 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Player name is required.');
      return;
    }
    const price = Number(basePrice);
    if (!Number.isFinite(price) || price < 1) {
      setError('Base price must be at least 1.');
      return;
    }

    setSaving(true);
    try {
      await send(`${base}/players`, {
        method: 'POST',
        body: { name: name.trim(), category, basePrice: price, phone: phone.trim() || null, photo: photo || null },
      });
      setName('');
      setPhone('');
      setPhoto('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the player.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(playerId: string) {
    setError('');
    try {
      await send(`${base}/players/${playerId}`, { method: 'DELETE' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove the player.');
    }
  }

  async function handleRemoveAll() {
    if (!window.confirm(`Delete all ${state.players.length} players of this auction? Their sales are removed too, and the auction is reset.`)) {
      return;
    }
    setError('');
    try {
      await send(`${base}/players`, { method: 'DELETE' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete the players.');
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Players</h1>
        <p className="muted">Players are saved to this auction in the database.</p>
      </div>

      {locked && <div className="alert">The auction has started, so the player list is locked.</div>}

      <section className="card">
        <form onSubmit={handleAdd}>
          <div className="form-grid">
            <label>
              Player name
              <input value={name} disabled={locked || saving} onChange={e => setName(e.target.value)} />
            </label>
            <label>
              Category
              <select value={category} disabled={locked || saving} onChange={e => setCategory(e.target.value as Category)}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Base price (₹)
              <input type="number" min={1} value={basePrice} disabled={locked || saving} onChange={e => setBasePrice(e.target.value)} />
            </label>
            <label>
              Phone (optional)
              <input
                inputMode="numeric"
                placeholder="10-digit mobile"
                value={phone}
                disabled={locked || saving}
                onChange={e => setPhone(e.target.value)}
              />
            </label>
            <label>
              Photo (optional)
              <input type="file" accept="image/*" disabled={locked || saving} onChange={handlePhotoChange} />
            </label>
          </div>

          {photo && (
            <div className="row" style={{ marginTop: 12 }}>
              <img src={photo} alt="Preview" className="photo-preview" />
              <button type="button" className="btn btn-ghost btn-small" onClick={() => setPhoto('')}>
                Remove photo
              </button>
            </div>
          )}

          <div className="form-actions">
            <button className="btn btn-yellow" type="submit" disabled={locked || saving}>
              {saving ? 'Saving…' : 'Add player'}
            </button>
            {error && <span className="alert alert-error" style={{ margin: 0 }}>{error}</span>}
          </div>
        </form>
      </section>

      <section className="card">
        <h3>Download player list</h3>
        <p className="muted">Choose a category to get a PDF of its players, to send to the auction representatives.</p>
        <div className="form-actions">
          <label style={{ minWidth: 220 }}>
            Category
            <select value={pdfCategory} onChange={e => setPdfCategory(e.target.value as Category | 'All')}>
              <option value="All">All categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn btn-navy"
            disabled={state.players.length === 0}
            onClick={() => downloadPlayersPdf(state, pdfCategory)}
          >
            Download PDF
          </button>
        </div>
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
                <th>Photo</th>
                <th>Player</th>
                <th>Category</th>
                <th>Base price</th>
                <th>Phone</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.players.map((player, index) => (
                <tr key={player.id}>
                  <td>{index + 1}</td>
                  <td>
                    <PlayerPhoto src={player.photo} name={player.name} thumbnail />
                  </td>
                  <td>{player.name}</td>
                  <td>{player.category}</td>
                  <td>{formatRupees(player.basePrice)}</td>
                  <td>{player.phone ?? '—'}</td>
                  <td>
                    <button className="btn btn-danger btn-small" disabled={locked || saving} onClick={() => handleRemove(player.id)}>
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

      <section className="card danger-zone">
        <h3>Danger zone</h3>
        <p className="muted">
          Delete every player of this auction. Their sales are removed too, and the live auction is cleared.
        </p>
        <button className="btn btn-danger btn-small" disabled={saving || state.players.length === 0} onClick={handleRemoveAll}>
          Delete all players
        </button>
      </section>
    </>
  );
}
