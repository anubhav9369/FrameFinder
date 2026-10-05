export interface Plan {
  id: string;
  name: string;
  priceInr: number;
  interval: 'forever' | 'month';
  limits: { events: number; photos: number };
  blurb: string;
  features: string[];
}

export const FREE_QUOTA = { events: 1, photos: 200 };

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceInr: 0,
    interval: 'forever',
    limits: { events: 1, photos: 200 },
    blurb: 'Try FrameFinder on one real event.',
    features: [
      '1 event',
      'Up to 200 photos',
      'AI face search',
      'Client album selection',
      'WhatsApp ordering',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    priceInr: 499,
    interval: 'month',
    limits: { events: 5, photos: 2000 },
    blurb: 'For photographers getting regular bookings.',
    features: [
      '5 events / month',
      'Up to 2,000 photos',
      'Everything in Free',
      'Watermarked previews',
      'Priority support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceInr: 1299,
    interval: 'month',
    limits: { events: 50, photos: 20000 },
    blurb: 'For busy studios and wedding season.',
    features: [
      '50 events / month',
      'Up to 20,000 photos',
      'Everything in Starter',
      'Whole-event selling',
      'Dedicated support',
    ],
  },
];

export function planById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}
