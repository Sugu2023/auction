import { createContext, useContext, useEffect, useReducer, useRef, type Dispatch, type ReactNode } from 'react';
import { auctionData } from '../data';
import type { AuctionConfig, AuctionData, Category, LiveState, Player, SoldRecord, Team } from '../types';
import { shuffle } from '../utils';

export interface AuctionState {
  config: AuctionConfig;
  teams: Team[];
  players: Player[];
  sold: Record<string, SoldRecord>; // keyed by player id
  unsold: string[];
  live: LiveState;
}

export type AuctionAction =
  | { type: 'LOAD'; state: AuctionState }
  | { type: 'SAVE_CONFIG'; config: AuctionConfig }
  | { type: 'ADD_TEAM'; team: Team }
  | { type: 'REMOVE_TEAM'; teamId: string }
  | { type: 'ADD_PLAYER'; player: Player }
  | { type: 'REMOVE_PLAYER'; playerId: string }
  | { type: 'START_CATEGORY'; category: Category; queue: string[] }
  | { type: 'BID'; teamId: string }
  | { type: 'RESET_BID' }
  | { type: 'SOLD' }
  | { type: 'UNSOLD' }
  | { type: 'END_CATEGORY' }
  | { type: 'RESET_AUCTION' };

const idleLive: LiveState = {
  category: null,
  queue: [],
  currentPlayerId: null,
  currentBid: 0,
  currentBidTeamId: null,
};

/** Setup and squad edits are locked once the auction has started or any player has been decided. */
export function isAuctionLocked(state: AuctionState): boolean {
  return state.live.category !== null || Object.keys(state.sold).length > 0 || state.unsold.length > 0;
}

export function purseOf(state: AuctionState, teamId: string): number {
  const spent = Object.values(state.sold)
    .filter(record => record.teamId === teamId)
    .reduce((sum, record) => sum + record.price, 0);
  return state.config.basePurse - spent;
}

export interface SquadEntry {
  player: Player;
  price: number;
}

export function squadOf(state: AuctionState, teamId: string): SquadEntry[] {
  return Object.values(state.sold)
    .filter(record => record.teamId === teamId)
    .flatMap(record => {
      const player = state.players.find(p => p.id === record.playerId);
      return player ? [{ player, price: record.price }] : [];
    });
}

/** First bid starts at the base price; every raise after that adds the increment. */
export function nextBidAmount(state: AuctionState): number {
  const { currentBid, currentBidTeamId } = state.live;
  return currentBidTeamId === null ? currentBid : currentBid + state.config.bidIncrement;
}

export interface QueueCounts {
  fresh: number;
  unsold: number;
}

/** Players of a category still to be auctioned: never-auctioned ones, and unsold ones waiting for a re-auction. */
export function queueCounts(state: AuctionState, category: Category): QueueCounts {
  const pending = state.players.filter(p => p.category === category && !state.sold[p.id]);
  return {
    fresh: pending.filter(p => !state.unsold.includes(p.id)).length,
    unsold: pending.filter(p => state.unsold.includes(p.id)).length,
  };
}

/** Fresh players are auctioned first (shuffled); unsold players follow as the re-auction round. */
export function buildAuctionQueue(state: AuctionState, category: Category): string[] {
  const pending = state.players.filter(p => p.category === category && !state.sold[p.id]);
  const fresh = pending.filter(p => !state.unsold.includes(p.id)).map(p => p.id);
  const unsold = pending.filter(p => state.unsold.includes(p.id)).map(p => p.id);
  return [...shuffle(fresh), ...shuffle(unsold)];
}

function nextPlayer(state: AuctionState, queue: string[]): AuctionState {
  const [playerId, ...rest] = queue;
  const player = state.players.find(p => p.id === playerId);
  return {
    ...state,
    live: {
      ...state.live,
      queue: rest,
      currentPlayerId: player?.id ?? null,
      currentBid: player?.basePrice ?? 0,
      currentBidTeamId: null,
    },
  };
}

function auctionReducer(state: AuctionState, action: AuctionAction): AuctionState {
  switch (action.type) {
    case 'LOAD':
      return action.state;

    case 'SAVE_CONFIG':
      if (isAuctionLocked(state) || action.config.totalTeams < state.teams.length) return state;
      return { ...state, config: action.config };

    case 'ADD_TEAM':
      if (isAuctionLocked(state) || state.teams.length >= state.config.totalTeams) return state;
      return { ...state, teams: [...state.teams, action.team] };

    case 'REMOVE_TEAM':
      if (isAuctionLocked(state)) return state;
      return { ...state, teams: state.teams.filter(t => t.id !== action.teamId) };

    case 'ADD_PLAYER':
      if (isAuctionLocked(state)) return state;
      return { ...state, players: [...state.players, action.player] };

    case 'REMOVE_PLAYER':
      if (isAuctionLocked(state)) return state;
      return { ...state, players: state.players.filter(p => p.id !== action.playerId) };

    case 'START_CATEGORY':
      // A set can be (re)started only when no player is on the block.
      if (state.live.currentPlayerId) return state;
      return nextPlayer({ ...state, live: { ...idleLive, category: action.category } }, action.queue);

    case 'BID': {
      const { live } = state;
      if (!live.currentPlayerId || live.currentBidTeamId === action.teamId) return state;
      const amount = nextBidAmount(state);
      if (purseOf(state, action.teamId) < amount) return state;
      return { ...state, live: { ...live, currentBid: amount, currentBidTeamId: action.teamId } };
    }

    case 'RESET_BID': {
      const player = state.players.find(p => p.id === state.live.currentPlayerId);
      if (!player) return state;
      return { ...state, live: { ...state.live, currentBid: player.basePrice, currentBidTeamId: null } };
    }

    case 'SOLD': {
      const { live } = state;
      if (!live.currentPlayerId || !live.currentBidTeamId) return state;
      const record: SoldRecord = {
        playerId: live.currentPlayerId,
        teamId: live.currentBidTeamId,
        price: live.currentBid,
      };
      return nextPlayer(
        {
          ...state,
          sold: { ...state.sold, [record.playerId]: record },
          unsold: state.unsold.filter(id => id !== record.playerId),
        },
        live.queue,
      );
    }

    case 'UNSOLD': {
      const { live } = state;
      if (!live.currentPlayerId) return state;
      const unsold = state.unsold.includes(live.currentPlayerId)
        ? state.unsold
        : [...state.unsold, live.currentPlayerId];
      return nextPlayer({ ...state, unsold }, live.queue);
    }

    case 'END_CATEGORY':
      return { ...state, live: idleLive };

    case 'RESET_AUCTION':
      return { ...state, sold: {}, unsold: [], live: idleLive };

    default:
      return state;
  }
}

function createInitialState(data: AuctionData): AuctionState {
  return {
    config: data.auction,
    teams: data.teams,
    players: data.players,
    sold: {},
    unsold: [],
    live: idleLive,
  };
}

interface AuctionContextValue {
  state: AuctionState;
  dispatch: Dispatch<AuctionAction>;
}

const AuctionContext = createContext<AuctionContextValue | null>(null);

/**
 * Saved state holds a copy of players and teams, which goes stale when the JSON changes.
 * Prefer the JSON version for matching ids, and keep any entries added through the admin pages.
 */
function withStaticData(saved: AuctionState): AuctionState {
  const playerIds = new Set(auctionData.players.map(p => p.id));
  const teamIds = new Set(auctionData.teams.map(t => t.id));
  return {
    ...saved,
    players: [...auctionData.players, ...saved.players.filter(p => !playerIds.has(p.id))],
    teams: [...auctionData.teams, ...saved.teams.filter(t => !teamIds.has(t.id))],
  };
}

const STATE_URL = '/api/state';
const POLL_MS = 2000;

export function AuctionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(auctionReducer, auctionData, createInitialState);
  // Last JSON known to match the shared store; used to avoid echoing and loops.
  const lastSynced = useRef('');
  const loaded = useRef(false);
  const pendingSaves = useRef(0);
  const saveCount = useRef(0);

  // Push local changes to the shared store. Waits for the first load so the
  // initial JSON never overwrites saved auction data.
  useEffect(() => {
    if (!loaded.current) return;
    const json = JSON.stringify(state);
    if (json === lastSynced.current) return;
    lastSynced.current = json;
    saveCount.current += 1;
    pendingSaves.current += 1;
    fetch(STATE_URL, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: json })
      .catch(() => undefined)
      .finally(() => {
        pendingSaves.current -= 1;
      });
  }, [state]);

  // Pull changes made on other devices or tabs.
  useEffect(() => {
    let active = true;

    async function pull() {
      if (pendingSaves.current > 0) return;
      const savesAtStart = saveCount.current;
      try {
        const res = await fetch(STATE_URL, { cache: 'no-store' });
        if (!active) return;
        if (res.status === 404) {
          loaded.current = true; // nothing saved yet; keep the JSON defaults
          return;
        }
        if (!res.ok) return;
        const text = await res.text();
        // Discard the response if this device saved something meanwhile.
        if (!active || pendingSaves.current > 0 || saveCount.current !== savesAtStart) return;
        loaded.current = true;
        if (text === lastSynced.current) return;
        lastSynced.current = text;
        dispatch({ type: 'LOAD', state: withStaticData(JSON.parse(text) as AuctionState) });
      } catch {
        // Server unreachable: keep working with local state.
      }
    }

    pull();
    const timer = window.setInterval(pull, POLL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return <AuctionContext.Provider value={{ state, dispatch }}>{children}</AuctionContext.Provider>;
}

export function useAuction(): AuctionContextValue {
  const ctx = useContext(AuctionContext);
  if (!ctx) throw new Error('useAuction must be used inside AuctionProvider');
  return ctx;
}
