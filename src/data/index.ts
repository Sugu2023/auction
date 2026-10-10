import raw from './auction.json';
import type { AuctionData } from '../types';

// Static data source. Replace this import with an API call later.
export const auctionData = raw as AuctionData;
