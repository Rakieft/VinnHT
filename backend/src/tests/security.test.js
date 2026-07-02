import assert from "node:assert/strict";
import test from "node:test";
import { authorize } from "../middleware/roleMiddleware.js";
import { createRateLimiter, securityHeaders } from "../middleware/securityMiddleware.js";
import { sessionCookieOptions } from "../utils/sessionCookie.js";
import {
  cleanupExpiredMessages,
  normalizeRetentionDays,
} from "../utils/messageRetention.js";
import {
  deliveryHistoryCutoffSql,
  normalizeDeliveryRetentionDays,
} from "../utils/deliveryRetention.js";
import {
  createMonCashReference,
  normalizeMonCashReceiver,
  publicMonCashConfiguration,
} from "../services/moncashPayoutService.js";

const response = () => ({
  code: 200,
  body: null,
  headers: {},
  status(code) {
    this.code = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
  set(name, value) {
    if (typeof name === "object") Object.assign(this.headers, name);
    else this.headers[name] = value;
    return this;
  },
});

test("authorize permet toujours l'accès à un admin", () => {
  const req = { user: { roles: ["admin"] } };
  const res = response();
  let allowed = false;

  authorize("manager")(req, res, () => {
    allowed = true;
  });

  assert.equal(allowed, true);
});

test("authorize bloque un rôle non autorisé", () => {
  const req = { user: { roles: ["client"] } };
  const res = response();

  authorize("admin")(req, res, () => {});

  assert.equal(res.code, 403);
});

test("le limiteur bloque après le nombre autorisé", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, max: 2 });
  const req = { ip: "127.0.0.77", path: "/test-rate-limit" };
  const res = response();
  let calls = 0;

  limiter(req, res, () => { calls += 1; });
  limiter(req, res, () => { calls += 1; });
  limiter(req, res, () => { calls += 1; });

  assert.equal(calls, 2);
  assert.equal(res.code, 429);
});

test("les en-têtes essentiels sont ajoutés", () => {
  const res = response();
  securityHeaders({}, res, () => {});

  assert.equal(res.headers["X-Content-Type-Options"], "nosniff");
  assert.equal(res.headers["X-Frame-Options"], "DENY");
});

test("le cookie de session est inaccessible au JavaScript", () => {
  const options = sessionCookieOptions();
  assert.equal(options.httpOnly, true);
  assert.equal(options.path, "/");
});

test("la rétention des messages utilise 30 jours par défaut", () => {
  assert.equal(normalizeRetentionDays(undefined), 30);
  assert.equal(normalizeRetentionDays("0"), 30);
  assert.equal(normalizeRetentionDays("45"), 45);
});

test("le nettoyage supprime les anciens messages puis les conversations vides", async () => {
  const queries = [];
  const executor = {
    async query(sql) {
      queries.push(sql);
      return [{ affectedRows: 2 }];
    },
  };

  const result = await cleanupExpiredMessages(executor, 30);

  assert.equal(queries.length, 2);
  assert.match(queries[0], /INTERVAL 30 DAY/);
  assert.match(queries[1], /LEFT JOIN messages/);
  assert.equal(result.deletedMessages, 2);
  assert.equal(result.deletedConversations, 2);
});

test("l'historique livreur conserve deux mois par défaut", () => {
  assert.equal(normalizeDeliveryRetentionDays(undefined), 60);
  assert.equal(normalizeDeliveryRetentionDays("0"), 60);
  assert.equal(normalizeDeliveryRetentionDays("90"), 90);
  assert.match(deliveryHistoryCutoffSql(undefined), /INTERVAL 60 DAY/);
});

test("MonCash reste désactivé sans activation explicite", () => {
  const previous = process.env.MONCASH_ENABLED;
  delete process.env.MONCASH_ENABLED;
  assert.equal(publicMonCashConfiguration().enabled, false);
  if (previous === undefined) delete process.env.MONCASH_ENABLED;
  else process.env.MONCASH_ENABLED = previous;
});

test("les numéros MonCash haïtiens sont normalisés", () => {
  assert.equal(normalizeMonCashReceiver("37 12-34 56"), "37123456");
  assert.equal(normalizeMonCashReceiver("50937123456"), "37123456");
  assert.throws(() => normalizeMonCashReceiver("123"), /8 chiffres/);
});

test("chaque tentative MonCash reçoit une référence VinnHT bornée", () => {
  const first = createMonCashReference(42);
  const second = createMonCashReference(42);
  assert.match(first, /^VHTPAY-42-/);
  assert.notEqual(first, second);
  assert.ok(first.length <= 120);
});
