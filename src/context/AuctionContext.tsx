import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiRequest, ApiError, type RequestOptions } from '../api/client';
import type { AuctionState } from '../auctionState';

interface AuctionContextValue {
  state: AuctionState;
  /** Sends a change to the server and shows the state it returns. Throws ApiError on failure. */
  send: (path: string, options?: RequestOptions) => Promise<AuctionState>;
}

const AuctionContext = createContext<AuctionContextValue | null>(null);

/** Loads one auction from the server. Nothing is kept in the browser beyond this page. */
export function AuctionProvider({ auctionId, children }: { auctionId: string; children: ReactNode }) {
  const [state, setState] = useState<AuctionState | null>(null);
  const [loadError, setLoadError] = useState('');

  const send = useCallback(
    async (path: string, options?: RequestOptions) => {
      const next = await apiRequest<AuctionState>(path, options);
      setState(next);
      return next;
    },
    [],
  );

  useEffect(() => {
    let active = true;
    apiRequest<AuctionState>(`/auctions/${auctionId}/state`)
      .then(next => {
        if (active) setState(next);
      })
      .catch(err => {
        if (active) setLoadError(err instanceof ApiError ? err.message : 'Could not load the auction.');
      });
    return () => {
      active = false;
    };
  }, [auctionId]);

  if (loadError) return <div className="alert alert-error">{loadError}</div>;
  if (!state) return <p className="muted">Loading auction…</p>;

  return <AuctionContext.Provider value={{ state, send }}>{children}</AuctionContext.Provider>;
}

export function useAuction(): AuctionContextValue {
  const ctx = useContext(AuctionContext);
  if (!ctx) throw new Error('useAuction must be used inside AuctionProvider');
  return ctx;
}
