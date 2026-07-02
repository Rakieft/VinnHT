import crypto from "node:crypto";

const SANDBOX_BASE_URL = "https://sandbox.moncashbutton.digicelgroup.com/Api";
const LIVE_BASE_URL = "https://moncashbutton.digicelgroup.com/Api";

let cachedToken = null;
let tokenExpiresAt = 0;

export class MonCashProviderError extends Error {
  constructor(message, { code = "MONCASH_ERROR", status = 502, ambiguous = false, details = null } = {}) {
    super(message);
    this.name = "MonCashProviderError";
    this.code = code;
    this.status = status;
    this.ambiguous = ambiguous;
    this.details = details;
  }
}

const envBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).toLowerCase() === "true";
};

const timeoutMs = () => Math.max(3_000, Number(process.env.MONCASH_TIMEOUT_MS || 15_000));

const endpoint = (environmentName, fallback) =>
  String(process.env[environmentName] || fallback).startsWith("/")
    ? String(process.env[environmentName] || fallback)
    : `/${String(process.env[environmentName] || fallback)}`;

export const monCashConfiguration = () => {
  const mode = process.env.MONCASH_MODE === "live" ? "live" : "sandbox";
  const clientId = String(process.env.MONCASH_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.MONCASH_CLIENT_SECRET || "").trim();
  const enabled = envBoolean(process.env.MONCASH_ENABLED, false);

  return {
    enabled,
    configured: Boolean(clientId && clientSecret),
    manualFallback: envBoolean(process.env.MONCASH_MANUAL_FALLBACK, true),
    mode,
    baseUrl: String(
      process.env.MONCASH_API_BASE_URL ||
        (mode === "live" ? LIVE_BASE_URL : SANDBOX_BASE_URL),
    ).replace(/\/$/, ""),
    clientId,
    clientSecret,
  };
};

export const publicMonCashConfiguration = () => {
  const config = monCashConfiguration();
  return {
    enabled: config.enabled,
    configured: config.configured,
    manualFallback: config.manualFallback,
    mode: config.mode,
  };
};

const requireConfiguration = () => {
  const config = monCashConfiguration();
  if (!config.enabled) {
    throw new MonCashProviderError("Les virements MonCash API sont désactivés.", {
      code: "MONCASH_DISABLED",
      status: 503,
    });
  }
  if (!config.configured) {
    throw new MonCashProviderError("Les identifiants MonCash ne sont pas configurés.", {
      code: "MONCASH_NOT_CONFIGURED",
      status: 503,
    });
  }
  return config;
};

const safeJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 500) };
  }
};

const providerMessage = (payload, fallback) =>
  payload?.message || payload?.error_description || payload?.error || fallback;

const request = async (path, { method = "POST", token, body, form, basicAuth } = {}) => {
  const config = requireConfiguration();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  const headers = { Accept: "application/json" };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (basicAuth) headers.Authorization = `Basic ${basicAuth}`;
  if (body) headers["Content-Type"] = "application/json";
  if (form) headers["Content-Type"] = "application/x-www-form-urlencoded";

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : form?.toString(),
      signal: controller.signal,
    });
    const payload = await safeJson(response);
    if (!response.ok) {
      throw new MonCashProviderError(
        providerMessage(payload, `MonCash a répondu avec le statut ${response.status}.`),
        {
          code: `MONCASH_HTTP_${response.status}`,
          status: response.status >= 500 ? 502 : 422,
          details: payload,
        },
      );
    }
    return payload;
  } catch (error) {
    if (error instanceof MonCashProviderError) throw error;
    const timedOut = error?.name === "AbortError";
    throw new MonCashProviderError(
      timedOut ? "MonCash n’a pas répondu à temps." : "Connexion à MonCash impossible.",
      {
        code: timedOut ? "MONCASH_TIMEOUT" : "MONCASH_NETWORK_ERROR",
        status: 502,
        ambiguous: true,
      },
    );
  } finally {
    clearTimeout(timer);
  }
};

const accessToken = async () => {
  if (cachedToken && Date.now() < tokenExpiresAt - 5_000) return cachedToken;
  const config = requireConfiguration();
  const form = new URLSearchParams({
    scope: "read,write",
    grant_type: "client_credentials",
  });
  const payload = await request(endpoint("MONCASH_TOKEN_PATH", "/oauth/token"), {
    form,
    basicAuth: Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64"),
  });
  if (!payload.access_token) {
    throw new MonCashProviderError("MonCash n’a pas retourné de jeton d’accès.", {
      code: "MONCASH_INVALID_TOKEN_RESPONSE",
    });
  }
  cachedToken = payload.access_token;
  tokenExpiresAt = Date.now() + Math.max(10, Number(payload.expires_in || 59)) * 1_000;
  return cachedToken;
};

const authorizedRequest = async (path, options = {}) =>
  request(path, { ...options, token: await accessToken() });

export const normalizeMonCashReceiver = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 8) return digits;
  if (digits.length === 11 && digits.startsWith("509")) return digits.slice(3);
  throw new MonCashProviderError("Le numéro MonCash doit contenir 8 chiffres haïtiens.", {
    code: "INVALID_MONCASH_RECEIVER",
    status: 422,
  });
};

export const createMonCashReference = (requestId) =>
  `VHTPAY-${requestId}-${Date.now().toString(36).toUpperCase()}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`.slice(0, 120);

export const checkMonCashCustomer = async (receiver) => {
  const payload = await authorizedRequest(endpoint("MONCASH_CUSTOMER_STATUS_PATH", "/v1/CustomerStatus"), {
    body: { account: normalizeMonCashReceiver(receiver) },
  });
  const statusValues = Object.entries(payload || {})
    .filter(([key]) => /(status|active|registered)/i.test(key))
    .map(([, value]) => String(value).toLowerCase());
  const explicitlyIneligible = statusValues.some((value) =>
    ["false", "inactive", "blocked", "suspended", "unregistered", "not registered"].includes(value),
  );
  if (explicitlyIneligible) {
    throw new MonCashProviderError("Le compte MonCash du vendeur n’est pas admissible au transfert.", {
      code: "MONCASH_BENEFICIARY_INELIGIBLE",
      status: 422,
      details: payload,
    });
  }
  return payload;
};

export const getMonCashPrefundedBalance = async () => {
  const payload = await authorizedRequest(
    endpoint("MONCASH_PREFUNDED_BALANCE_PATH", "/v1/PrefundedBalance"),
    { method: "GET" },
  );
  const rawBalance = payload.balance ?? payload.prefunded_balance ?? payload.amount;
  return {
    balance: Number.isFinite(Number(rawBalance)) ? Number(rawBalance) : null,
    providerResponse: payload,
  };
};

export const sendMonCashTransfer = async ({ amount, receiver, description, reference }) => {
  const payload = await authorizedRequest(endpoint("MONCASH_TRANSFER_PATH", "/v1/Transfert"), {
    body: {
      amount: Number(Number(amount).toFixed(2)),
      receiver: normalizeMonCashReceiver(receiver),
      desc: String(description || "Paiement vendeur VinnHT").slice(0, 140),
      reference,
    },
  });
  const transactionId = payload.transaction_id ?? payload.transactionId ?? null;
  const status = String(payload.transStatus || payload.status || payload.message || "").toLowerCase();
  if (!transactionId && !status.includes("success")) {
    throw new MonCashProviderError("MonCash n’a pas confirmé le transfert.", {
      code: "MONCASH_UNCONFIRMED_TRANSFER",
      ambiguous: true,
      details: payload,
    });
  }
  return { transactionId: transactionId ? String(transactionId) : null, providerResponse: payload };
};

export const getMonCashTransferStatus = async (reference) => {
  const payload = await authorizedRequest(
    endpoint("MONCASH_TRANSFER_STATUS_PATH", "/v1/PrefundedTransactionStatus"),
    {
    body: { reference },
    },
  );
  const status = String(payload.transStatus || payload.status || payload.message || "").toLowerCase();
  return {
    successful: status.includes("success"),
    transactionId: payload.transaction_id ?? payload.transactionId ?? null,
    providerStatus: status || "unknown",
    providerResponse: payload,
  };
};

export const redactMonCashPayload = (payload) => {
  if (!payload || typeof payload !== "object") return payload || null;
  const clone = JSON.parse(JSON.stringify(payload));
  for (const key of ["access_token", "refresh_token", "client_secret", "token"]) {
    if (key in clone) clone[key] = "[REDACTED]";
  }
  return clone;
};

export const resetMonCashTokenCache = () => {
  cachedToken = null;
  tokenExpiresAt = 0;
};
