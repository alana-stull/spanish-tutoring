import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const key = req.query.key;
    if (!key) return res.status(400).json({ error: 'key required' });
    const stored = await redis.get(key);
    const value = stored && typeof stored === 'object' && 'v' in stored ? stored.v : null;
    return res.status(200).json({ value });
  }

  if (req.method === 'POST') {
    const { key, value } = req.body || {};
    if (!key) return res.status(400).json({ error: 'key required' });
    await redis.set(key, { v: value });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end('Method Not Allowed');
}
