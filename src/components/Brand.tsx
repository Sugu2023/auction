import { auctionData } from '../data';

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">SE</span>
      <span>{auctionData.auction.name}</span>
    </div>
  );
}
