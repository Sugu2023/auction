export type Role = 'admin' | 'team';

export type Category = 'Batsman' | 'Bowler' | 'All-rounder' | 'Keeper';

export const CATEGORIES: Category[] = ['Batsman', 'Bowler', 'All-rounder', 'Keeper'];

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
  phone?: string;
}
