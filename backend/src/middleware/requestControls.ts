import { Request, Response, NextFunction } from 'express';

// Lightweight in-process protection against accidental frontend polling/request storms.
// This protects the app from runaway clients; hosting-provider quotas still apply.
const buckets = new Map<string, { windowStart: number; count: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_MINUTE = 120;

export function requestControls(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/health') return next();

  const key = `${req.ip}:${req.method}:${req.path}`;
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    bucket = { windowStart: now, count: 0 };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS_PER_MINUTE) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down.',
    });
  }

  if (buckets.size > 5000) {
    for (const [entryKey, entry] of buckets) {
      if (now - entry.windowStart >= WINDOW_MS) buckets.delete(entryKey);
    }
  }

  next();
}
