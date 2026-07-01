import React, { useEffect, useMemo, useState } from "react";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  History,
  Landmark,
  LockKeyhole,
  PlayCircle,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Store,
  Wallet,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { assetUrl } from "../config/runtime.js";
import "../styles/wallet-flow.css";

const money = (value) =>
  `${Number(value || 0).toLocaleString("fr-HT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} HTG`;

const shortDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("fr-HT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const statusMeta = {
  pending: { label: "En attente admin", tone: "warning", Icon: Clock3 },
  approved: { label: "Approuvée", tone: "approved", Icon: ShieldCheck },
  rejected: { label: "Refusée", tone: "danger", Icon: X },
  processing: { label: "Transfert en cours", tone: "processing", Icon: RefreshCw },
  paid: { label: "Payée", tone: "success", Icon: CheckCircle2 },
  failed: { label: "Échec du transfert", tone: "danger", Icon: AlertTriangle },
  cancelled: { label: "Annulée", tone: "muted", Icon: X },
};

const transactionMeta = {
  sale_released: {
    label: "Vente libérée",
    note: "Réception confirmée par le client",
    tone: "credit",
    Icon: ArrowDownToLine,
  },
  withdrawal_reserved: {
    label: "Montant réservé",
    note: "Demande de paiement envoyée",
    tone: "reserve",
    Icon: LockKeyhole,
  },
  withdrawal_released: {
    label: "Montant retourné",
    note: "Somme de nouveau disponible",
    tone: "credit",
    Icon: RefreshCw,
  },
  withdrawal_paid: {
    label: "Paiement effectué",
    note: "Transfert MonCash confirmé",
    tone: "paid",
    Icon: ArrowUpRight,
  },
  adjustment: {
    label: "Ajustement",
    note: "Mise à jour du wallet",
    tone: "muted",
    Icon: History,
  },
};

function WalletStatus({ value }) {
  const meta = statusMeta[value] || statusMeta.pending;
  return (
    <span className={`wallet-status ${meta.tone}`}>
      <meta.Icon /> {meta.label}
    </span>
  );
}

function WalletFeedback({ message, error }) {
  if (!message && !error) return null;
  return (
    <div className={`wallet-feedback ${error ? "error" : "success"}`}>
      {error ? <AlertTriangle /> : <CheckCircle2 />}
      <span>{error || message}</span>
    </div>
  );
}

function WalletPageHeading({ eyebrow, title, text, children }) {
  return (
    <header className="wallet-page-heading">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {children}
    </header>
  );
}

function WalletMetric({ icon: Icon, label, value, note, tone = "blue" }) {
  return (
    <motion.article
      className={`wallet-metric ${tone}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <span><Icon /></span>
      <small>{label}</small>
      <strong>
        <CountUp end={Number(value || 0)} duration={0.8} separator=" " decimals={0} /> HTG
      </strong>
      <p>{note}</p>
    </motion.article>
  );
}

function WalletLoading() {
  return (
    <div className="wallet-loading">
      <RefreshCw />
      <span>Chargement des informations financières...</span>
    </div>
  );
}

export function SellerWalletContent({ api }) {
  const [data, setData] = useState(null);
  const [showRequest, setShowRequest] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const { data: response } = await api.get("/seller/wallet");
      setData(response);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Impossible de charger votre wallet pour le moment.",
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  const wallet = data?.wallet || {};
  const payoutAccount = data?.payoutAccount;
  const requests = data?.requests || [];
  const transactions = data?.transactions || [];
  const activeRequest = requests.find((request) =>
    ["pending", "approved", "processing"].includes(request.status),
  );
  const canRequest =
    Number(wallet.available_balance || 0) >= Number(data?.minimumRequestAmount || 0) &&
    payoutAccount?.moncash_number &&
    payoutAccount?.moncash_account_name &&
    !activeRequest;

  const submitRequest = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const { data: response } = await api.post("/seller/wallet/requests", {
        amount: Number(amount),
        note: note.trim() || undefined,
      });
      setMessage(response.message);
      setAmount("");
      setNote("");
      setShowRequest(false);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Demande impossible.");
    } finally {
      setBusy(false);
    }
  };

  const cancelRequest = async (request) => {
    if (!window.confirm(`Annuler la demande ${request.request_number} ?`)) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const { data: response } = await api.patch(
        `/seller/wallet/requests/${request.id}/cancel`,
      );
      setMessage(response.message);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Annulation impossible.");
    } finally {
      setBusy(false);
    }
  };

  if (!data && !error) return <WalletLoading />;

  return (
    <div className="wallet-flow seller-wallet-flow">
      <WalletPageHeading
        eyebrow="Finances boutique"
        title="Mon wallet VinnHT"
        text="Vos ventes restent protégées jusqu’à la réception, puis deviennent disponibles pour une demande de paiement."
      >
        <button className="wallet-refresh" type="button" onClick={load}>
          <RefreshCw /> Actualiser
        </button>
      </WalletPageHeading>

      <WalletFeedback message={message} error={error} />

      <section className="seller-wallet-hero">
        <div className="seller-wallet-balance">
          <div className="seller-wallet-brand">
            <span><Wallet /></span>
            <div>
              <small>Wallet boutique</small>
              <b>{payoutAccount?.shop_name || "Ma boutique"}</b>
            </div>
            <ShieldCheck />
          </div>
          <p>Solde disponible</p>
          <h2>{money(wallet.available_balance)}</h2>
          <div className="seller-wallet-account">
            <span>
              <Landmark />
              <small>Compte de paiement</small>
              <b>{payoutAccount?.moncash_account_name || "À compléter"}</b>
            </span>
            <strong>{payoutAccount?.moncash_number || "MonCash non renseigné"}</strong>
          </div>
        </div>

        <aside className="seller-wallet-action">
          <span className="wallet-action-icon"><Send /></span>
          <div>
            <small>Demande de paiement</small>
            <h2>
              {activeRequest
                ? "Une demande est déjà en cours"
                : "Recevez votre argent sur MonCash"}
            </h2>
            <p>
              {activeRequest
                ? `${activeRequest.request_number} suit actuellement le parcours de validation VinnHT.`
                : `Montant minimum : ${money(data?.minimumRequestAmount)}.`}
            </p>
          </div>
          {!payoutAccount?.moncash_number || !payoutAccount?.moncash_account_name ? (
            <Link to="/seller/shop">Configurer mon compte MonCash</Link>
          ) : (
            <button
              type="button"
              disabled={!canRequest}
              onClick={() => {
                setAmount(String(wallet.available_balance || ""));
                setShowRequest(true);
              }}
            >
              <ArrowUpRight /> Demander mon paiement
            </button>
          )}
        </aside>
      </section>

      <section className="wallet-metric-grid">
        <WalletMetric
          icon={LockKeyhole}
          label="Fonds bloqués"
          value={wallet.held_balance}
          note={`${wallet.held_sales || 0} vente(s) attendent la réception`}
          tone="navy"
        />
        <WalletMetric
          icon={CircleDollarSign}
          label="Disponible"
          value={wallet.available_balance}
          note="Retirable maintenant"
          tone="blue"
        />
        <WalletMetric
          icon={Clock3}
          label="Réservé"
          value={wallet.reserved_balance}
          note="Demandes en cours"
          tone="gold"
        />
        <WalletMetric
          icon={CheckCircle2}
          label="Total reçu"
          value={wallet.total_paid}
          note="Paiements confirmés"
          tone="green"
        />
      </section>

      <div className="seller-wallet-columns">
        <section className="wallet-panel">
          <header>
            <div>
              <span><ReceiptText /></span>
              <div><small>Suivi</small><h2>Mes demandes</h2></div>
            </div>
          </header>
          <div className="seller-request-list">
            {requests.map((request) => (
              <article key={request.id}>
                <div>
                  <small>{request.request_number}</small>
                  <strong>{money(request.amount)}</strong>
                  <span>{shortDate(request.created_at)}</span>
                </div>
                <WalletStatus value={request.status} />
                {request.admin_note && <p>Décision admin : {request.admin_note}</p>}
                {request.failure_reason && <p>Suivi manager : {request.failure_reason}</p>}
                {request.payment_reference && (
                  <p className="wallet-reference">Référence : {request.payment_reference}</p>
                )}
                {request.status === "pending" && (
                  <button type="button" disabled={busy} onClick={() => cancelRequest(request)}>
                    Annuler la demande
                  </button>
                )}
              </article>
            ))}
            {!requests.length && (
              <div className="wallet-empty">
                <ReceiptText />
                <h3>Aucune demande pour le moment</h3>
                <p>Vos demandes de paiement apparaîtront ici.</p>
              </div>
            )}
          </div>
        </section>

        <section className="wallet-panel">
          <header>
            <div>
              <span><History /></span>
              <div><small>Registre</small><h2>Mouvements récents</h2></div>
            </div>
          </header>
          <div className="wallet-transaction-list">
            {transactions.map((transaction) => {
              const meta = transactionMeta[transaction.type] || transactionMeta.adjustment;
              return (
                <article key={transaction.id}>
                  <span className={meta.tone}><meta.Icon /></span>
                  <div>
                    <b>{meta.label}</b>
                    <small>{transaction.order_number || transaction.request_number || meta.note}</small>
                    <time>{shortDate(transaction.created_at)}</time>
                  </div>
                  <strong className={meta.tone}>
                    {transaction.type === "withdrawal_paid" ? "−" : "+"}{money(transaction.amount)}
                  </strong>
                </article>
              );
            })}
            {!transactions.length && (
              <div className="wallet-empty compact">
                <History />
                <p>Le registre commencera avec votre première vente libérée.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {showRequest && (
        <div className="wallet-modal-backdrop" role="presentation">
          <form className="wallet-request-modal" onSubmit={submitRequest}>
            <header>
              <div>
                <small>Demande sécurisée</small>
                <h2>Recevoir mon paiement</h2>
              </div>
              <button type="button" onClick={() => setShowRequest(false)} aria-label="Fermer">
                <X />
              </button>
            </header>
            <div className="wallet-modal-account">
              <Landmark />
              <span>
                <small>Destination MonCash vérifiée</small>
                <b>{payoutAccount?.moncash_account_name}</b>
                <strong>{payoutAccount?.moncash_number}</strong>
              </span>
            </div>
            <label>
              Montant demandé
              <span className="wallet-amount-input">
                <input
                  required
                  type="number"
                  min={data?.minimumRequestAmount}
                  max={wallet.available_balance}
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
                <b>HTG</b>
              </span>
              <small>Disponible : {money(wallet.available_balance)}</small>
            </label>
            <label>
              Note facultative
              <textarea
                rows="3"
                maxLength="500"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Une précision pour l’administration..."
              />
            </label>
            <div className="wallet-modal-notice">
              <ShieldCheck />
              <p>Le montant sera réservé pendant l’approbation admin et le transfert du manager.</p>
            </div>
            <footer>
              <button type="button" onClick={() => setShowRequest(false)}>Retour</button>
              <button type="submit" disabled={busy}>
                <Send /> {busy ? "Envoi..." : "Envoyer la demande"}
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}

function usePayoutDesk(api, endpoint) {
  const [data, setData] = useState({ requests: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const { data: response } = await api.get(endpoint);
      setData(response);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [endpoint]);

  return { data, loading, error, setError, load };
}

function PayoutDeskCard({ request, onOpen, actionLabel }) {
  return (
    <motion.article
      className="payout-desk-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <header>
        <span className="payout-shop-logo">
          {request.shop_logo_url ? (
            <img src={assetUrl(request.shop_logo_url)} alt={request.seller_name} />
          ) : (
            <Store />
          )}
        </span>
        <div>
          <small>{request.request_number}</small>
          <h3>{request.seller_name}</h3>
          <p>{shortDate(request.created_at)}</p>
        </div>
        <WalletStatus value={request.status} />
      </header>
      <div className="payout-desk-amount">
        <span>Montant demandé</span>
        <strong>{money(request.amount)}</strong>
      </div>
      <dl>
        <div><dt>MonCash</dt><dd>{request.moncash_number}</dd></div>
        <div><dt>Titulaire</dt><dd>{request.moncash_account_name}</dd></div>
        <div><dt>Ventes liées</dt><dd>{request.payout_count || 0}</dd></div>
      </dl>
      <button type="button" onClick={() => onOpen(request)}>
        {actionLabel} <ArrowUpRight />
      </button>
    </motion.article>
  );
}

export function AdminPayoutApprovalContent({ api }) {
  const { data, loading, error, setError, load } = usePayoutDesk(
    api,
    "/admin/payout-requests",
  );
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("pending");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const requests = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.requests.filter((request) => {
      const matchesStatus = filter === "all" || request.status === filter;
      const matchesQuery = `${request.request_number} ${request.seller_name} ${request.moncash_number}`
        .toLowerCase()
        .includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [data.requests, filter, query]);

  const review = async (decision) => {
    if (decision === "rejected" && note.trim().length < 3) {
      setError("Ajoutez un motif clair avant le refus.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { data: response } = await api.patch(
        `/admin/payout-requests/${selected.id}/review`,
        { decision, note: note.trim() || undefined },
      );
      setMessage(response.message);
      setSelected(null);
      setNote("");
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Décision impossible.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <WalletLoading />;

  return (
    <div className="wallet-flow payout-desk-flow">
      <WalletPageHeading
        eyebrow="Contrôle administratif"
        title="Demandes de paiement"
        text="Vérifiez l’identité MonCash, le montant et les ventes libérées. Le manager exécutera ensuite le transfert."
      >
        <span className="wallet-role-chip"><ShieldCheck /> Approbation uniquement</span>
      </WalletPageHeading>
      <WalletFeedback message={message} error={error} />
      <section className="wallet-metric-grid wallet-desk-metrics">
        <WalletMetric icon={Clock3} label="À examiner" value={data.stats.pending_amount} note={`${data.stats.pending_count || 0} demande(s)`} tone="gold" />
        <WalletMetric icon={ShieldCheck} label="Transmises" value={data.stats.approved_amount} note="Au manager" tone="blue" />
        <WalletMetric icon={CheckCircle2} label="Déjà payées" value={data.stats.paid_amount} note="Historique confirmé" tone="green" />
      </section>
      <section className="payout-desk-toolbar">
        <label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Boutique, demande ou MonCash" /></label>
        <nav>
          {["pending", "approved", "processing", "paid", "rejected", "all"].map((status) => (
            <button className={filter === status ? "active" : ""} onClick={() => setFilter(status)} key={status}>
              {status === "all" ? "Toutes" : statusMeta[status]?.label || status}
            </button>
          ))}
        </nav>
      </section>
      <section className="payout-desk-grid">
        {requests.map((request) => (
          <PayoutDeskCard request={request} onOpen={setSelected} actionLabel="Examiner" key={request.id} />
        ))}
        {!requests.length && <div className="wallet-empty desk"><ShieldCheck /><h3>Aucune demande dans cette file</h3><p>Les nouvelles demandes vendeurs apparaîtront ici.</p></div>}
      </section>

      {selected && (
        <div className="wallet-modal-backdrop" role="presentation">
          <section className="payout-review-modal" role="dialog" aria-modal="true">
            <header>
              <div><small>{selected.request_number}</small><h2>Décision administrative</h2></div>
              <button onClick={() => setSelected(null)} aria-label="Fermer"><X /></button>
            </header>
            <div className="payout-review-shop">
              <span className="payout-shop-logo">{selected.shop_logo_url ? <img src={assetUrl(selected.shop_logo_url)} alt={selected.seller_name} /> : <Store />}</span>
              <div><small>Boutique</small><h3>{selected.seller_name}</h3><p>{selected.seller_email}</p></div>
              <strong>{money(selected.amount)}</strong>
            </div>
            <div className="payout-review-facts">
              <span><small>MonCash</small><b>{selected.moncash_number}</b></span>
              <span><small>Titulaire</small><b>{selected.moncash_account_name}</b></span>
              <span><small>Ventes libérées</small><b>{selected.payout_count || 0}</b></span>
              <span><small>Date</small><b>{shortDate(selected.created_at)}</b></span>
            </div>
            {selected.seller_note && <blockquote>{selected.seller_note}</blockquote>}
            {selected.status === "pending" ? (
              <>
                <label>Note de décision<textarea rows="3" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Obligatoire seulement en cas de refus" /></label>
                <footer>
                  <button className="danger" disabled={busy} onClick={() => review("rejected")}><X /> Refuser</button>
                  <button disabled={busy} onClick={() => review("approved")}><ShieldCheck /> Approuver et transmettre</button>
                </footer>
              </>
            ) : (
              <div className="wallet-modal-notice"><WalletStatus value={selected.status} /><p>{selected.admin_note || "Cette demande a déjà quitté la file de décision."}</p></div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export function ManagerPayoutOperationsContent({ api }) {
  const { data, loading, error, setError, load } = usePayoutDesk(
    api,
    "/manager/payout-requests",
  );
  const [selected, setSelected] = useState(null);
  const [reference, setReference] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ready");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const requests = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.requests.filter((request) => {
      const matchesStatus =
        filter === "all" ||
        (filter === "ready" && ["approved", "processing"].includes(request.status)) ||
        request.status === filter;
      return matchesStatus && `${request.request_number} ${request.seller_name} ${request.moncash_number}`.toLowerCase().includes(normalized);
    });
  }, [data.requests, filter, query]);

  const runAction = async (action, payload) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { data: response } = await api.patch(
        `/manager/payout-requests/${selected.id}/${action}`,
        payload,
      );
      setMessage(response.message);
      setReference("");
      setFailureReason("");
      setSelected(null);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Action impossible.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <WalletLoading />;

  return (
    <div className="wallet-flow payout-desk-flow manager-payout-flow">
      <WalletPageHeading
        eyebrow="Opérations financières"
        title="Transferts vendeurs"
        text="Prenez en charge uniquement les demandes approuvées, effectuez le MonCash puis enregistrez sa référence."
      >
        <span className="wallet-role-chip manager"><Landmark /> Exécution manager</span>
      </WalletPageHeading>
      <WalletFeedback message={message} error={error} />
      <section className="wallet-metric-grid wallet-desk-metrics">
        <WalletMetric icon={PlayCircle} label="Prêtes" value={data.stats.approved_amount} note={`${data.stats.approved_count || 0} transfert(s)`} tone="blue" />
        <WalletMetric icon={RefreshCw} label="En traitement" value={data.stats.processing_amount} note="Pris en charge" tone="gold" />
        <WalletMetric icon={CheckCircle2} label="Transféré" value={data.stats.paid_amount} note="Références enregistrées" tone="green" />
      </section>
      <section className="payout-desk-toolbar">
        <label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Boutique, demande ou MonCash" /></label>
        <nav>
          {["ready", "approved", "processing", "paid", "failed", "all"].map((status) => (
            <button className={filter === status ? "active" : ""} onClick={() => setFilter(status)} key={status}>
              {status === "ready" ? "À traiter" : status === "all" ? "Toutes" : statusMeta[status]?.label || status}
            </button>
          ))}
        </nav>
      </section>
      <section className="payout-desk-grid">
        {requests.map((request) => (
          <PayoutDeskCard request={request} onOpen={setSelected} actionLabel={request.status === "approved" ? "Prendre en charge" : "Ouvrir le suivi"} key={request.id} />
        ))}
        {!requests.length && <div className="wallet-empty desk"><Landmark /><h3>Aucun transfert dans cette file</h3><p>Les demandes approuvées par l’admin apparaîtront ici.</p></div>}
      </section>

      {selected && (
        <div className="wallet-modal-backdrop" role="presentation">
          <section className="payout-review-modal manager-transfer-modal" role="dialog" aria-modal="true">
            <header>
              <div><small>{selected.request_number}</small><h2>Suivi du transfert</h2></div>
              <button onClick={() => setSelected(null)} aria-label="Fermer"><X /></button>
            </header>
            <div className="manager-transfer-amount">
              <small>Montant exact à transférer</small>
              <strong>{money(selected.amount)}</strong>
              <WalletStatus value={selected.status} />
            </div>
            <div className="payout-review-facts">
              <span><small>Boutique</small><b>{selected.seller_name}</b></span>
              <span><small>Numéro MonCash</small><b>{selected.moncash_number}</b></span>
              <span><small>Titulaire</small><b>{selected.moncash_account_name}</b></span>
              <span><small>Approuvé par</small><b>{selected.reviewed_by_name || "Admin VinnHT"}</b></span>
            </div>
            {selected.status === "approved" && (
              <button className="manager-start-transfer" disabled={busy} onClick={() => runAction("processing")}>
                <PlayCircle /> Prendre en charge ce transfert
              </button>
            )}
            {selected.status === "processing" && (
              <div className="manager-transfer-actions">
                <div className="wallet-modal-notice"><ShieldCheck /><p>Vérifiez le numéro et le titulaire avant d’envoyer l’argent. Ne demandez jamais le PIN du vendeur.</p></div>
                <label>Référence MonCash<input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Ex. MC-84A920..." /></label>
                <button disabled={busy || reference.trim().length < 3} onClick={() => runAction("complete", { reference: reference.trim() })}>
                  <CheckCircle2 /> Confirmer le transfert
                </button>
                <div className="manager-failure-box">
                  <label>Si le transfert échoue<textarea rows="2" value={failureReason} onChange={(event) => setFailureReason(event.target.value)} placeholder="Expliquez le problème rencontré" /></label>
                  <button disabled={busy || failureReason.trim().length < 8} onClick={() => runAction("fail", { reason: failureReason.trim() })}>
                    <AlertTriangle /> Enregistrer l’échec
                  </button>
                </div>
              </div>
            )}
            {["paid", "failed"].includes(selected.status) && (
              <div className="wallet-transfer-result">
                {selected.status === "paid" ? <CheckCircle2 /> : <AlertTriangle />}
                <div>
                  <h3>{selected.status === "paid" ? "Transfert terminé" : "Transfert non abouti"}</h3>
                  <p>{selected.status === "paid" ? `Référence : ${selected.payment_reference}` : selected.failure_reason}</p>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
