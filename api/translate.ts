import type { VercelRequest, VercelResponse } from '@vercel/node';

interface TranslateRequestBody {
  target?: 'pt' | 'en' | 'es';
  texts?: string[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing GOOGLE_TRANSLATE_API_KEY' });
    return;
  }

  const body = typeof req.body === 'object' && req.body !== null ? req.body as TranslateRequestBody : {};
  const target = body.target;
  const texts = Array.isArray(body.texts)
    ? body.texts.filter((text): text is string => typeof text === 'string' && text.trim().length > 0)
    : [];

  if (!target || texts.length === 0) {
    res.status(400).json({ error: 'Missing target or texts' });
    return;
  }

  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: texts,
      target,
      format: 'text',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    res.status(400).json({ error: 'Translate API error', details: errorText });
    return;
  }

  const data = await response.json();
  const translations = Array.isArray(data?.data?.translations)
    ? data.data.translations.map((item: { translatedText?: string }) => item.translatedText ?? '')
    : [];

  res.status(200).json({ translations });
}
