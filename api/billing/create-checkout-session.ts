import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2024-06-20';

const priceMap: Record<string, string | undefined> = {
  basic: process.env.STRIPE_PRICE_BASIC,
  pro: process.env.STRIPE_PRICE_PRO,
  premium: process.env.STRIPE_PRICE_PREMIUM,
};

const getBaseUrl = () => {
  const configured = process.env.PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  return 'http://localhost:5173';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' });
    return;
  }

  const stripe = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });

  const body = typeof req.body === 'object' && req.body !== null ? req.body as { planId?: string } : {};
  const planId = typeof body.planId === 'string' ? body.planId : 'pro';
  const priceId = priceMap[planId] ?? priceMap.pro;

  if (!priceId) {
    res.status(400).json({ error: 'Invalid plan or price not configured' });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 0,
        metadata: {
          plan_id: planId,
        },
      },
      success_url: `${getBaseUrl()}/?checkout=success`,
      cancel_url: `${getBaseUrl()}/?checkout=cancelled`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout session error', error);
    const message = error instanceof Error ? error.message : 'Failed to create checkout session';
    res.status(500).json({ error: message });
  }
}
