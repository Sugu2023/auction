import { useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { isAuctionLocked } from '../../auctionState';
import { useAuction } from '../../context/AuctionContext';
import { readAuctionLogo } from '../../utils';

interface Draft {
  name: string;
  totalTeams: number;
  basePurse: number;
  bidIncrement: number;
}

export function SetupPage() {
  const { state, send } = useAuction();
  const [draft, setDraft] = useState<Draft>({
    name: state.config.name,
    totalTeams: state.config.totalTeams,
    basePurse: state.config.basePurse,
    bidIncrement: state.config.bidIncrement,
  });
  // A new logo only when one is chosen; null keeps the current logo on the server.
  const [newLogo, setNewLogo] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const locked = isAuctionLocked(state);
  const shownLogo = newLogo ?? state.config.logo;

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft(prev => ({ ...prev, [key]: value }));
  }

  async function handleLogoChange(file: File | undefined) {
    if (!file) return;
    try {
      setNewLogo(await readAuctionLogo(file));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the logo.');
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);
    try {
      await send(`/auctions/${state.config.id}`, { method: 'PUT', body: { ...draft, logo: newLogo } });
      setNewLogo(null);
      setMessage('Auction setup saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the setup.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Auction Setup</h1>
        <p className="muted">Set the auction name, logo, number of teams, and the base purse every team gets.</p>
      </div>

      {locked && <div className="alert">The auction has started, so setup is locked.</div>}

      <section className="card">
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <label>
              Auction name
              <input value={draft.name} disabled={locked || saving} onChange={e => update('name', e.target.value)} />
            </label>
            <label>
              Number of teams
              <input
                type="number"
                min={1}
                value={draft.totalTeams}
                disabled={locked || saving}
                onChange={e => update('totalTeams', Number(e.target.value))}
              />
            </label>
            <label>
              Base purse per team (₹)
              <input
                type="number"
                min={1}
                value={draft.basePurse}
                disabled={locked || saving}
                onChange={e => update('basePurse', Number(e.target.value))}
              />
            </label>
            <label>
              Bid increment (₹)
              <input
                type="number"
                min={1}
                value={draft.bidIncrement}
                disabled={locked || saving}
                onChange={e => update('bidIncrement', Number(e.target.value))}
              />
            </label>
            <label>
              Auction logo (PNG or JPEG)
              <input
                type="file"
                accept="image/png,image/jpeg"
                disabled={locked || saving}
                onChange={e => handleLogoChange(e.target.files?.[0])}
              />
            </label>
          </div>

          {shownLogo && (
            <div className="row" style={{ marginTop: 12 }}>
              <img src={shownLogo} alt="Auction logo" className="auction-logo" />
              <span className="muted">{newLogo ? 'New logo, not saved yet' : 'Current logo'}</span>
            </div>
          )}

          <div className="form-actions">
            <button className="btn btn-yellow" type="submit" disabled={locked || saving}>
              {saving ? 'Saving…' : 'Save setup'}
            </button>
            {message && <span className="muted">{message}</span>}
            {error && <span className="alert alert-error" style={{ margin: 0 }}>{error}</span>}
          </div>
        </form>
      </section>

      <section className="card">
        <h3>Progress</h3>
        <p>
          Teams added: <strong>{state.teams.length} / {state.config.totalTeams}</strong>
        </p>
        <p>
          Players added: <strong>{state.players.length}</strong>
        </p>
      </section>
    </>
  );
}
