export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const formatRupees = (value: number) => `₹${value.toLocaleString('en-IN')}`;

/**
 * Opens WhatsApp with the text filled in; the admin presses send.
 * Without a phone number, WhatsApp asks the admin to pick a contact.
 */
export function whatsappLink(phone: string | undefined, text: string): string {
  // String() guards against numbers typed without quotes in the JSON.
  const digits = String(phone ?? '').replace(/\D/g, '');
  // Indian 10-digit mobile numbers need the 91 country code.
  const number = digits.length === 10 ? `91${digits}` : digits;
  const base = number ? `https://wa.me/${number}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text)}`;
}
