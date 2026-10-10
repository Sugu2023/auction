export type Role = 'admin' | 'team';

export type Category = 'Batsman' | 'Bowler' | 'All-rounder' | 'Keeper';

export const CATEGORIES: Category[] = ['Batsman', 'Bowler', 'All-rounder', 'Keeper'];

export interface AuctionConfig {
  name: string;
  totalTeams: number;
  basePurse: number;
  bidIncrement: number;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  owner: string;
  captain: string;
}

export interface Player {
  id: string;
  name: string;
  category: Category;
  basePrice: number;
  photo?: string;
}

export interface UserAccount {
  username: string;
  password: string;
  role: Role;
  teamId?: string;
}

export interface AuctionData {
  auction: AuctionConfig;
  teams: Team[];
  players: Player[];
  users: UserAccount[];
}

export interface SoldRecord {
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
}
