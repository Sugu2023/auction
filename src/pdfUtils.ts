import type { jsPDF } from 'jspdf';

/** Puts the auction logo on the page. Does nothing when there is no logo. */
export function addLogo(doc: jsPDF, logo: string | null | undefined, x: number, y: number, size: number) {
  if (!logo || !logo.startsWith('data:image/')) return;
  const format = logo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
  doc.addImage(logo, format, x, y, size, size);
}
