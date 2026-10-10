import { useState, type ChangeEvent, type FormEvent } from 'react';
import { TeamLogo } from '../../components/TeamLogo';
import { isAuctionLocked, purseOf, useAuction } from '../../context/AuctionContext';
import { formatRupees } from '../../utils';
import type { Team } from '../../types';

const DEFAULT_LOGO = '/logos/default.svg';

export function TeamsPage() {
  const { state, dispatch } = useAuction();
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [captain, setCaptain] = useState('');
  const [logo, setLogo] = useState('');
  const [error, setError] = useState('');
  const locked = isAuctionLocked(state);
  const full = state.teams.length >= state.config.totalTeams;

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.readAsDataURL(file);
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !owner.trim() || !captain.trim()) {
      setError('Team name, owner and captain are required.');
      return;
    }
    if (state.teams.some(t => t.name.toLowerCase() === name.trim().toLowerCase())) {
      setError('A team with this name already exists.');
      return;
    }
    const team: Team = {
      id: `team-${Date.now()}`,
      name: name.trim(),
      owner: owner.trim(),
      captain: captain.trim(),
      logo: logo || DEFAULT_LOGO,
    };
    dispatch({ type: 'ADD_TEAM', team });
    setName('');
    setOwner('');
    setCaptain('');
    setLogo('');
    setError('');
  }

  return (
    <>
      <div className="page-head">
        <h1>Teams</h1>
        <p className="muted">
          Add each team with its logo, owner and captain ({state.teams.length} / {state.config.totalTeams} added).
        </p>
      </div>

      {locked && <div className="alert">The auction has started, so teams are locked.</div>}
      {!locked && full && <div className="alert">All {state.config.totalTeams} teams are added.</div>}

      <section className="card">
        <form onSubmit={handleAdd}>
          <div className="form-grid">
            <label>
              Team name
              <input value={name} disabled={locked || full} onChange={e => setName(e.target.value)} />
            </label>
            <label>
              Owner name
              <input value={owner} disabled={locked || full} onChange={e => setOwner(e.target.value)} />
            </label>
            <label>
              Captain name
              <input value={captain} disabled={locked || full} onChange={e => setCaptain(e.target.value)} />
            </label>
            <label>
              Team logo (image)
              <input type="file" accept="image/*" disabled={locked || full} onChange={handleLogoChange} />
            </label>
          </div>
          <div className="form-actions">
            <button className="btn btn-yellow" type="submit" disabled={locked || full}>
              Add team
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
                disabled={locked}
                onClick={() => dispatch({ type: 'REMOVE_TEAM', teamId: team.id })}
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
