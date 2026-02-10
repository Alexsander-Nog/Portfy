import type { VercelRequest, VercelResponse } from '@vercel/node';

const PLAN_MAP: Record<string, { title: string; unitPrice: number; periodDays: number }> = {
  basic: { title: 'Plano Basico', unitPrice: 19.99, periodDays: 30 },
  pro: { title: 'Plano Pro', unitPrice: 39.0, periodDays: 30 },
  premium: { title: 'Plano Premium', unitPrice: 69.0, periodDays: 30 },
};

function getBaseUrl(req: VercelRequest) {
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https';
  const host = req.headers.host ?? '';
  return `${proto}://${host}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    res.status(500).json({ error: 'Missing MERCADO_PAGO_ACCESS_TOKEN' });
    return;
  }

  const { planId, userId } = req.body as { planId?: string; userId?: string };
  if (!planId || !PLAN_MAP[planId]) {
    res.status(400).json({ error: 'Invalid planId' });
    return;
  }
  if (!userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }

  const plan = PLAN_MAP[planId];
  const baseUrl = process.env.APP_BASE_URL || getBaseUrl(req);
  const notificationUrl = process.env.MERCADO_PAGO_WEBHOOK_URL || `${baseUrl}/api/mercadopago/webhook`;

  const preferencePayload = {
    items: [
      {
        title: plan.title,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: plan.unitPrice,
      },
    ],
    metadata: {
      user_id: userId,
      plan_id: planId,
      period_days: plan.periodDays,
    },
    notification_url: notificationUrl,
    back_urls: {
      success: `${baseUrl}/?payment=success`,
      failure: `${baseUrl}/?payment=failure`,
      pending: `${baseUrl}/?payment=pending`,
    },
    auto_return: 'approved',
  };

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preferencePayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    res.status(400).json({ error: 'Mercado Pago error', details: errorText });
    return;
  }

  const data = await response.json();
  res.status(200).json({
    id: data.id,
    init_point: data.init_point,
    sandbox_init_point: data.sandbox_init_point,
  });
}
