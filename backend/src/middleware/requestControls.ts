import { Request, Response, NextFunction } from 'express';

// Lightweight protection against accidental frontend polling/request storms.
// This is a safety net only; hosting-provider quotas still depend on the plan.
const buckets = new Map<string, { startedAt: number; count: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_MINUTE = 120;

export function requestControls(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/health') return next();

  const key = `${req.ip}:${req.method}:${req.path}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    buckets.set(key, { startedAt: now, count: 1 });
    return next();
  }

  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS_PER_MINUTE) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down.',
    });
  }

  next();
}
