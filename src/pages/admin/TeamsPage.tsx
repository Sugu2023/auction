import { useState, type ChangeEvent, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { isAuctionLocked, purseOf } from '../../auctionState';
import { TeamLogo } from '../../components/TeamLogo';
import { useAuction } from '../../context/AuctionContext';
import { formatRupees } from '../../utils';

const DEFAULT_LOGO = '/logos/default.svg';

export function TeamsPage() {
  const { state, send } = useAuction();
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [captain, setCaptain] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [logo, setLogo] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const locked = isAuctionLocked(state);
  const full = state.teams.length >= state.config.totalTeams;
  const disabled = locked || full || saving;

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be 2 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim() || !owner.trim() || !captain.trim()) {
      setError('Team name, owner and captain are required.');
      return;
    }
    if (!username.trim() || password.length < 6) {
      setError('Give the team a login: a username and a password of at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      await send(`/auctions/${state.config.id}/teams`, {
        method: 'POST',
        body: {
          name: name.trim(),
          owner: owner.trim(),
          captain: captain.trim(),
          username: username.trim(),
          password,
          logo: logo || DEFAULT_LOGO,
        },
      });
      setName('');
      setOwner('');
      setCaptain('');
      setUsername('');
      setPassword('');
      setLogo('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add the team.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(teamId: string) {
    setError('');
    try {
      await send(`/auctions/${state.config.id}/teams/${teamId}`, { method: 'DELETE' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove the team.');
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Teams</h1>
        <p className="muted">
          Add each team with its logo, owner, captain and a login for the team ({state.teams.length} / {state.config.totalTeams} added).
        </p>
      </div>

      {locked && <div className="alert">The auction has started, so teams are locked.</div>}
      {!locked && full && <div className="alert">All {state.config.totalTeams} teams are added.</div>}

      <section className="card">
        <form onSubmit={handleAdd}>
          <div className="form-grid">
            <label>
              Team name
              <input value={name} disabled={disabled} onChange={e => setName(e.target.value)} />
            </label>
            <label>
              Owner name
              <input value={owner} disabled={disabled} onChange={e => setOwner(e.target.value)} />
            </label>
            <label>
              Captain name
              <input value={captain} disabled={disabled} onChange={e => setCaptain(e.target.value)} />
            </label>
            <label>
              Team logo (image)
              <input type="file" accept="image/*" disabled={disabled} onChange={handleLogoChange} />
            </label>
            <label>
              Team login username
              <input value={username} disabled={disabled} autoComplete="off" onChange={e => setUsername(e.target.value)} />
            </label>
            <label>
              Team login password
              <input
                type="password"
                value={password}
                disabled={disabled}
                autoComplete="new-password"
                onChange={e => setPassword(e.target.value)}
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="btn btn-yellow" type="submit" disabled={disabled}>
              {saving ? 'Adding…' : 'Add team'}
            </button>
            {error && <span className="alert alert-error" style={{ margin: 0 }}>{error}</span>}
          </div>
        </form>
      </section>

      <div className="grid-cards">
        {state.teams.map(team => (
          <div className="card team-card" key={team.id}>
            <TeamLogo src={team.logo} name={team.name} size={64} />
            <div className="team-card-body">
              <h3>{team.name}</h3>
              <p className="kv">Owner: {team.owner}</p>
              <p className="kv">Captain: {team.captain}</p>
              <p className="kv muted">Purse: {formatRupees(purseOf(state, team.id))}</p>
              <button
                className="btn btn-danger btn-small"
                style={{ marginTop: 8 }}
                disabled={locked || saving}
                onClick={() => handleRemove(team.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      {state.teams.length === 0 && <p className="muted">No teams yet.</p>}
    </>
  );
}
