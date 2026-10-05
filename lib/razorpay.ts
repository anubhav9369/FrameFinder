// SERVER ONLY — never import from client components.
import Razorpay from 'razorpay';
import crypto from 'crypto';

export function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

function hmac(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = hmac(rawBody, process.env.RAZORPAY_WEBHOOK_SECRET!);
  return (
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  );
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const expected = hmac(`${orderId}|${paymentId}`, process.env.RAZORPAY_KEY_SECRET!);
  return (
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  );
}
