import * as crypto from 'crypto';

/**
 * Verifies a Billplz x_signature on a callback payload.
 *
 * Algorithm (from Billplz docs):
 * 1. Take all params from the callback body
 * 2. Remove x_signature
 * 3. Sort remaining keys alphabetically (case-insensitive)
 * 4. Concatenate each as key + value (no separator between key and value)
 * 5. Join all pairs with |
 * 6. HMAC-SHA256 with the X-Signature key (hex digest)
 * 7. Compare with timingSafeEqual
 */
export function verifyBillplzSignature(
  params: Record<string, string>,
  xSignatureKey: string,
): boolean {
  const received = params['x_signature'];
  if (!received) return false;

  const data: Record<string, string> = { ...params };
  delete data['x_signature'];

  const source = Object.keys(data)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((k) => `${k}${data[k]}`)
    .join('|');

  const computed = crypto
    .createHmac('sha256', xSignatureKey)
    .update(source)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(received));
  } catch {
    return false;
  }
}
