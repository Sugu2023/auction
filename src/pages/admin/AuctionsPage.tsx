import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, ApiError } from '../../api/client';
import { formatRupees } from '../../utils';

interface AuctionSummary {
  id: string;
  name: string;
  totalTeams: number;
  basePurse: number;
  bidIncrement: number;
}

export function AuctionsPage() {
  const [auctions, setAuctions] = useState<AuctionSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [totalTeams, setTotalTeams] = useState('3');
  const [basePurse, setBasePurse] = useState('1000');
  const [bidIncrement, setBidIncrement] = useState('10');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadAuctions() {
    setAuctions(await apiRequest<AuctionSummary[]>('/auctions'));
  }

  useEffect(() => {
    loadAuctions()
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load auctions.'))
      .finally(() => setLoaded(true));
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Auction name is required.');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/auctions', {
        method: 'POST',
        body: {
          name: name.trim(),
          totalTeams: Number(totalTeams),
          basePurse: Number(basePurse),
          bidIncrement: Number(bidIncrement),
        },
      });
      setName('');
      await loadAuctions();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the auction.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(auction: AuctionSummary) {
    if (!window.confirm(`Delete "${auction.name}" with all its teams, players and sales? This cannot be undone.`)) {
      return;
    }
    setError('');
    try {
      await apiRequest(`/auctions/${auction.id}`, { method: 'DELETE' });
      await loadAuctions();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete the auction.');
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Auctions</h1>
        <p className="muted">Create an auction, then add its teams and players. Each auction has its own teams and players.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="card">
        <h3>New auction</h3>
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <label>
              Auction name
              <input value={name} disabled={saving} onChange={e => setName(e.target.value)} />
            </label>
            <label>
              Number of teams
              <input type="number" min={1} value={totalTeams} disabled={saving} onChange={e => setTotalTeams(e.target.value)} />
            </label>
            <label>
              Base purse per team (₹)
              <input type="number" min={1} value={basePurse} disabled={saving} onChange={e => setBasePurse(e.target.value)} />
            </label>
            <label>
              Bid increment (₹)
              <input type="number" min={1} value={bidIncrement} disabled={saving} onChange={e => setBidIncrement(e.target.value)} />
            </label>
          </div>
          <div className="form-actions">
            <button className="btn btn-yellow" type="submit" disabled={saving}>
              {saving ? 'Creating…' : 'Create auction'}
            </button>
          </div>
        </form>
      </section>

      <div className="grid-cards">
        {auctions.map(auction => (
          <div className="card" key={auction.id}>
            <h3>{auction.name}</h3>
            <p className="kv muted">
              {auction.totalTeams} teams · base purse {formatRupees(auction.basePurse)} · bid step {formatRupees(auction.bidIncrement)}
            </p>
            <div className="row" style={{ marginTop: 8 }}>
              <Link to={`/admin/auctions/${auction.id}`} className="btn btn-navy btn-small">
                Open
              </Link>
              <button className="btn btn-danger btn-small" onClick={() => handleDelete(auction)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {loaded && auctions.length === 0 && <p className="muted">No auctions yet. Create one above.</p>}
    </>
  );
}
