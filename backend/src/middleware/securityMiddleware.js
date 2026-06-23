const requestBuckets = new Map();

const clientKey = (req) =>
  `${req.ip || req.socket.remoteAddress || "unknown"}:${req.path}`;

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = "Trop de requêtes. Réessayez plus tard.",
} = {}) => {
  return (req, res, next) => {
    const now = Date.now();
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
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Resource-Policy": "cross-origin",
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
