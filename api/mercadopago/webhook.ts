import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

async function readRawBody(req: VercelRequest) {
  return new Promise<string>((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function verifySignature(rawBody: string, signatureHeader: string | undefined, secret: string) {
  if (!signatureHeader) {
    return false;
  }

  const parts = signatureHeader.split(',').reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split('=').map((item) => item.trim());
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});

  const ts = parts.ts;
  const signature = parts.v1;
  if (!ts || !signature) {
    return false;
  }

  const payload = `${ts}.${rawBody}`;
  const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  let expected: Buffer;
  let received: Buffer;
  try {
    expected = Buffer.from(hash, 'hex');
    received = Buffer.from(signature, 'hex');
  } catch (_error) {
    return false;
  }

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rawBody = await readRawBody(req);
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (secret) {
    const signatureHeader = req.headers['x-signature'] as string | undefined;
    if (!verifySignature(rawBody, signatureHeader, secret)) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!accessToken || !supabaseUrl || !supabaseServiceRole) {
    res.status(500).json({ error: 'Missing server configuration' });
    return;
  }

  let payload: Record<string, unknown> = {};
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch (_error) {
      res.status(400).json({ error: 'Invalid JSON payload' });
      return;
    }
  }
  const payloadData = typeof payload.data === 'object' && payload.data !== null ? payload.data as Record<string, unknown> : undefined;
  const rawId = typeof payload.id === 'string' || typeof payload.id === 'number' ? payload.id : undefined;
  const rawDataId = payloadData && (typeof payloadData.id === 'string' || typeof payloadData.id === 'number') ? payloadData.id : undefined;
  const paymentIdRaw = rawDataId ?? rawId;
  if (paymentIdRaw === undefined) {
    res.status(200).json({ ok: true });
    return;
  }

  const paymentId = paymentIdRaw.toString();

  const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!paymentResponse.ok) {
    res.status(400).json({ error: 'Failed to fetch payment' });
    return;
  }

  const payment = await paymentResponse.json();
  const userId = payment?.metadata?.user_id as string | undefined;
  const periodDays = Number(payment?.metadata?.period_days ?? 30);

  if (!userId) {
    res.status(200).json({ ok: true });
    return;
  }

  const now = new Date();
  const currentPeriodEnd = new Date(now);
  currentPeriodEnd.setDate(currentPeriodEnd.getDate() + periodDays);

  let status = 'past_due';
  if (payment.status === 'approved') {
    status = 'active';
  } else if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(payment.status)) {
    status = 'past_due';
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
    auth: {
      persistSession: false,
    },
  });

  await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: userId,
      status,
      current_period_end: status === 'active' ? currentPeriodEnd.toISOString() : null,
      trial_ends_at: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  res.status(200).json({ ok: true });
}
