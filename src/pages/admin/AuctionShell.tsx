import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { AuctionProvider, useAuction } from '../../context/AuctionContext';

const SECTIONS = [
  { to: 'setup', label: 'Setup' },
  { to: 'teams', label: 'Teams' },
  { to: 'players', label: 'Players' },
  { to: 'start', label: 'Start Auction' },
  { to: 'live', label: 'Live Auction' },
  { to: 'squads', label: 'Squads' },
];

/** Wraps every page of one auction: loads it from the server and shows its section menu. */
export function AuctionShell() {
  const { auctionId = '' } = useParams();
  return (
    <AuctionProvider key={auctionId} auctionId={auctionId}>
      <AuctionFrame />
    </AuctionProvider>
  );
}

function AuctionFrame() {
  const { state } = useAuction();
  const base = `/admin/auctions/${state.config.id}`;

  return (
    <>
      <div className="page-head">
        <Link to="/admin" className="muted">
          ← All auctions
        </Link>
        <div className="row" style={{ marginTop: 4 }}>
          {state.config.logo && <img src={state.config.logo} alt="Auction logo" className="auction-logo" />}
          <h1>{state.config.name}</h1>
        </div>
      </div>

      <nav className="sub-nav">
        {SECTIONS.map(section => (
          <NavLink
            key={section.to}
            to={`${base}/${section.to}`}
            className={({ isActive }) => (isActive ? 'sub-link active' : 'sub-link')}
          >
            {section.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </>
  );
}
