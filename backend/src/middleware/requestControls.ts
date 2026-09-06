import { Request, Response, NextFunction } from 'express';

// Prevent accidental high-frequency polling from consuming hosting/API resources.
// This is intentionally lightweight and in-memory; it is a safety net, not billing/quota control.
const recentRequests = new Map<string, number>();
const WINDOW_MS = 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

export function requestControls(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/health') return next();

  const key = `${req.ip}:${req.method}:${req.path}`;
  const now = Date.now();
  const previous = recentRequests.get(key) ?? 0;

  if (now - previous < WINDOW_MS) {
    const countKey = `${key}:count`;
    const count = Number(res.getHeader('X-Request-Count') || 0) + 1;
    res.setHeader('X-Request-Count', count);
    if (count > MAX_REQUESTS_PER_WINDOW) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please slow down.',
      });
    }
    void countKey;
  } else {
    recentRequests.set(key, now);
  }

  next();
}
