import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AuctionState } from './auctionState';
import { addLogo } from './pdfUtils';
import { CATEGORIES, type Category } from './types';

const rs = (value: number) => `Rs. ${value.toLocaleString('en-IN')}`;

/** Downloads the player list for one category, or for all categories, as a PDF for the auction representatives. */
export function downloadPlayersPdf(state: AuctionState, category: Category | 'All') {
  const players = state.players
    .filter(p => category === 'All' || p.category === category)
    .sort((a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || a.name.localeCompare(b.name));

  const doc = new jsPDF();
  addLogo(doc, state.config.logo, 14, 10, 24);

  doc.setFontSize(18);
  doc.text(state.config.name, 44, 20);
  doc.setFontSize(12);
  doc.setTextColor(90);
  doc.text(category === 'All' ? 'Player list: all categories' : `Player list: ${category}`, 44, 28);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 40,
    theme: 'striped',
    head: [['#', 'Player', 'Category', 'Base price', 'Phone']],
    body: players.map((p, index) => [String(index + 1), p.name, p.category, rs(p.basePrice), p.phone ?? '—']),
    headStyles: { fillColor: [253, 185, 19], textColor: [8, 27, 74] },
  });

  if (players.length === 0) {
    doc.setFontSize(11);
    doc.text('No players in this category yet.', 14, 50);
  }

  const fileName = `${state.config.name}-${category === 'All' ? 'all' : category}-players.pdf`;
  doc.save(fileName.replace(/\s+/g, '-'));
}
