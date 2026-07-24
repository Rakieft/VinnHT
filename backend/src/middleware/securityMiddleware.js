const requestBuckets = new Map();
const BUCKET_CLEANUP_INTERVAL_MS = 60 * 1000;
let lastBucketCleanupAt = 0;

const clientKey = (req) =>
  [
    req.ip || req.socket?.remoteAddress || "unknown",
    req.method || "GET",
    `${req.baseUrl || ""}${req.path || ""}`,
  ].join(":");

const cleanupExpiredBuckets = (now) => {
  if (now - lastBucketCleanupAt < BUCKET_CLEANUP_INTERVAL_MS) return;
  for (const [key, bucket] of requestBuckets.entries()) {
    if (!bucket || bucket.expiresAt <= now) requestBuckets.delete(key);
  }
  lastBucketCleanupAt = now;
};

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = "Trop de requêtes. Réessayez plus tard.",
} = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    cleanupExpiredBuckets(now);

    const key = clientKey(req);
    const bucket = requestBuckets.get(key);

    if (!bucket || bucket.expiresAt <= now) {
      requestBuckets.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      res.set("Retry-After", String(Math.ceil((bucket.expiresAt - now) / 1000)));
      return res.status(429).json({ message });
    }

    next();
  };
};

export const securityHeaders = (_req, res, next) => {
  res.set({
    "Content-Security-Policy": "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Resource-Policy": "cross-origin",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Origin-Agent-Cluster": "?1",
    Vary: "Origin",
  });
  if (process.env.NODE_ENV === "production") {
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
};

export const noStore = (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
};
