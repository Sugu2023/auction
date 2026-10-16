import type { Category, Player, Team } from './types';

// The shape the server sends for one auction. The server does all the auction rules;
// these helpers only read the state to show purses, squads and counts.

export interface AuctionConfig {
  id: string;
  name: string;
  totalTeams: number;
  basePurse: number;
  bidIncrement: number;
  logo: string | null;
}

export interface Sale {
  playerId: string;
  teamId: string;
  price: number;
}

export interface LiveState {
  category: Category | null;
  queue: string[];
  currentPlayerId: string | null;
  currentBid: number;
  currentBidTeamId: string | null;
  unsold: string[];
}

export interface AuctionState {
  config: AuctionConfig;
  teams: Team[];
  players: Player[];
  sales: Sale[];
  live: LiveState;
}

/** Teams, players and settings are fixed once the auction has started. */
export function isAuctionLocked(state: AuctionState): boolean {
  return state.live.category !== null || state.sales.length > 0 || state.live.unsold.length > 0;
}

export function purseOf(state: AuctionState, teamId: string): number {
  const spent = state.sales.filter(s => s.teamId === teamId).reduce((sum, s) => sum + s.price, 0);
  return state.config.basePurse - spent;
}

export interface SquadEntry {
  player: Player;
  price: number;
}

export function squadOf(state: AuctionState, teamId: string): SquadEntry[] {
  return state.sales
    .filter(s => s.teamId === teamId)
    .flatMap(s => {
      const player = state.players.find(p => p.id === s.playerId);
      return player ? [{ player, price: s.price }] : [];
    });
}

/** The price the next team's bid button would set: the base price first, then base + increment. */
export function nextBidAmount(state: AuctionState): number {
  const { currentBid, currentBidTeamId } = state.live;
  return currentBidTeamId === null ? currentBid : currentBid + state.config.bidIncrement;
}

export interface QueueCounts {
  fresh: number;
  unsold: number;
}

/** Players in a category still to be auctioned, split into new players and unsold ones. */
export function queueCounts(state: AuctionState, category: Category): QueueCounts {
  const soldIds = new Set(state.sales.map(s => s.playerId));
  const pending = state.players.filter(p => p.category === category && !soldIds.has(p.id));
  const unsold = pending.filter(p => state.live.unsold.includes(p.id)).length;
  return { fresh: pending.length - unsold, unsold };
}
