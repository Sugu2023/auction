import { useState, type FormEvent } from 'react';
import { isAuctionLocked, useAuction } from '../../context/AuctionContext';
import type { AuctionConfig } from '../../types';

export function SetupPage() {
  const { state, dispatch } = useAuction();
  const [draft, setDraft] = useState<AuctionConfig>(state.config);
  const [message, setMessage] = useState('');
  const locked = isAuctionLocked(state);

  function update<K extends keyof AuctionConfig>(key: K, value: AuctionConfig[K]) {
    setDraft(prev => ({ ...prev, [key]: value }));
  }

  function handleSave(e: FormEvent) {
    e.preventDefault();
    if (draft.totalTeams < state.teams.length) {
      setMessage(`${state.teams.length} teams are already added. Set the number of teams to at least ${state.teams.length}.`);
      return;
    }
    if (draft.totalTeams < 1 || draft.basePurse < 1 || draft.bidIncrement < 1) {
      setMessage('Teams, base purse and bid increment must be at least 1.');
      return;
    }
    dispatch({ type: 'SAVE_CONFIG', config: draft });
    setMessage('Auction setup saved.');
  }

  return (
    <>
      <div className="page-head">
        <h1>Auction Setup</h1>
        <p className="muted">Set the number of teams and the base purse (₹) every team gets.</p>
      </div>

      {locked && <div className="alert">The auction has started, so setup is locked.</div>}

      <section className="card">
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <label>
              Auction name
              <input value={draft.name} disabled={locked} onChange={e => update('name', e.target.value)} />
            </label>
            <label>
              Number of teams
              <input
                type="number"
                min={1}
                value={draft.totalTeams}
                disabled={locked}
                onChange={e => update('totalTeams', Number(e.target.value))}
              />
            </label>
            <label>
              Base purse per team (₹)
              <input
                type="number"
                min={1}
                value={draft.basePurse}
                disabled={locked}
                onChange={e => update('basePurse', Number(e.target.value))}
              />
            </label>
            <label>
              Bid increment (₹)
              <input
                type="number"
                min={1}
                value={draft.bidIncrement}
                disabled={locked}
                onChange={e => update('bidIncrement', Number(e.target.value))}
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="btn btn-yellow" type="submit" disabled={locked}>
              Save setup
            </button>
            {message && <span className="muted">{message}</span>}
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
