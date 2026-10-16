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

/** Reads an auction logo file as a base64 data URL. Only PNG and JPEG can go into the PDFs. */
export function readAuctionLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      reject(new Error('The logo must be a PNG or JPEG image.'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error('The logo must be 2 MB or smaller.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}
