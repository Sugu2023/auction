import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { purseOf, squadOf, type AuctionState } from './auctionState';
import type { Team } from './types';

// The PDF font has no ₹ symbol, so amounts use "Rs." here.
const rs = (value: number) => `Rs. ${value.toLocaleString('en-IN')}`;

/** Builds a PDF with the team's details and the players it bought, then downloads it. */
export function downloadTeamPdf(team: Team, state: AuctionState) {
  const doc = new jsPDF();
  const purse = purseOf(state, team.id);
  const squad = squadOf(state, team.id);
  const spent = state.config.basePurse - purse;

  doc.setFontSize(18);
  doc.text(team.name, 14, 20);
  doc.setFontSize(11);
  doc.setTextColor(90);
  doc.text(state.config.name, 14, 27);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 34,
    theme: 'grid',
    head: [['Team details', '']],
    body: [
      ['Owner', team.owner],
      ['Captain', team.captain],
      ['Base purse', rs(state.config.basePurse)],
      ['Spent', rs(spent)],
      ['Remaining purse', rs(purse)],
      ['Players bought', String(squad.length)],
    ],
    headStyles: { fillColor: [14, 42, 107] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
  });

  const afterDetails = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  autoTable(doc, {
    startY: afterDetails + 10,
    theme: 'striped',
    head: [['#', 'Player', 'Category', 'Base price', 'Bought for']],
    body: squad.map((entry, index) => [
      String(index + 1),
      entry.player.name,
      entry.player.category,
      rs(entry.player.basePrice),
      rs(entry.price),
    ]),
    foot: squad.length ? [['', 'Total spent', '', '', rs(spent)]] : undefined,
    headStyles: { fillColor: [253, 185, 19], textColor: [8, 27, 74] },
    footStyles: { fontStyle: 'bold' },
  });

  if (squad.length === 0) {
    const y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    doc.setFontSize(11);
    doc.text('No players bought yet.', 14, y + 8);
  }

  doc.save(`${team.name.replace(/\s+/g, '-')}-squad.pdf`);
}
