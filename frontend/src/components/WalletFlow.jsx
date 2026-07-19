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
  Download,
  History,
  Landmark,
  LockKeyhole,
  PlayCircle,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  MoreHorizontal,
  Store,
  Wallet,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  pending: { label: "En attente finance", tone: "warning", Icon: Clock3 },
  approved: { label: "Approuvée", tone: "approved", Icon: ShieldCheck },
  rejected: { label: "Refusée", tone: "danger", Icon: X },
  processing: { label: "Transfert en cours", tone: "processing", Icon: RefreshCw },
  verification_required: { label: "À vérifier", tone: "warning", Icon: AlertTriangle },
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

const payoutStepMeta = {
  pending: {
    title: "En attente de validation",
    text: "L’admin doit confirmer l’identité MonCash et le montant demandé.",
    tone: "warning",
  },
  approved: {
    title: "Prête pour la finance",
    text: "La demande est approuvée et peut être prise en charge pour le transfert.",
    tone: "approved",
  },
  processing: {
    title: "Traitement en cours",
    text: "L’équipe finance contrôle le bénéficiaire puis lance le virement MonCash.",
    tone: "processing",
  },
  verification_required: {
    title: "Réconciliation requise",
    text: "MonCash doit être interrogé avant toute nouvelle action sur cette demande.",
    tone: "warning",
  },
  paid: {
    title: "Paiement terminé",
    text: "Le virement a été confirmé et le wallet vendeur a été débité définitivement.",
    tone: "success",
  },
  failed: {
    title: "Transfert à relancer",
    text: "Le transfert n’a pas abouti. Le montant redevient disponible côté vendeur.",
    tone: "danger",
  },
  rejected: {
    title: "Demande refusée",
    text: "La demande a été stoppée avant transfert.",
    tone: "danger",
  },
  cancelled: {
    title: "Demande annulée",
    text: "Le vendeur a récupéré ce montant dans son solde disponible.",
    tone: "muted",
  },
};

function getWalletRequestBlocker({ wallet, payoutAccount, activeRequest, minimumRequestAmount }) {
  if (!payoutAccount?.moncash_number || !payoutAccount?.moncash_account_name) {
    return "Ajoutez votre vrai numéro MonCash et le nom exact du titulaire dans Ma boutique avant toute demande.";
  }
  if (activeRequest) {
    return `La demande ${activeRequest.request_number} doit d’abord sortir du circuit actuel avant d’en créer une nouvelle.`;
  }
  if (Number(wallet.available_balance || 0) < Number(minimumRequestAmount || 0)) {
    return `Votre solde disponible doit atteindre au moins ${money(minimumRequestAmount)} pour ouvrir une demande.`;
  }
  return "Votre wallet est prêt pour une nouvelle demande de paiement.";
}

function getPayoutStepDetails(request) {
  return payoutStepMeta[request?.status] || payoutStepMeta.pending;
}

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

function WalletMetric({
  icon: Icon,
  label,
  value,
  note,
  tone = "blue",
  suffix = "HTG",
}) {
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
        <CountUp end={Number(value || 0)} duration={0.8} separator=" " decimals={0} />
        {suffix && ` ${suffix}`}
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

function FinanceBreakdown({ request }) {
  return (
    <div className="finance-breakdown-grid">
      <article>
        <small>Ventes brutes</small>
        <strong>{money(request.gross_sales_amount)}</strong>
      </article>
      <article>
        <small>Livraison incluse</small>
        <strong>{money(request.delivery_total_amount)}</strong>
      </article>
      <article className="warning">
        <small>Commission VinnHT</small>
        <strong>- {money(request.commission_total_amount)}</strong>
      </article>
      <article className="success">
        <small>Net vendeur</small>
        <strong>{money(request.allocated_amount || request.amount)}</strong>
      </article>
    </div>
  );
}

export function SellerWalletContent({ api }) {
  const location = useLocation();
  const navigate = useNavigate();
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
  const requestBlocker = getWalletRequestBlocker({
    wallet,
    payoutAccount,
    activeRequest,
    minimumRequestAmount: data?.minimumRequestAmount,
  });
  const readinessItems = [
    {
      label: "Compte MonCash",
      ready: Boolean(payoutAccount?.moncash_number && payoutAccount?.moncash_account_name),
      text:
        payoutAccount?.moncash_number && payoutAccount?.moncash_account_name
          ? `${payoutAccount.moncash_account_name} · ${payoutAccount.moncash_number}`
          : "Le compte de réception n’est pas encore complet.",
    },
    {
      label: "Solde retirable",
      ready: Number(wallet.available_balance || 0) >= Number(data?.minimumRequestAmount || 0),
      text:
        Number(wallet.available_balance || 0) >= Number(data?.minimumRequestAmount || 0)
          ? `${money(wallet.available_balance)} peuvent être demandés maintenant.`
          : `Minimum requis : ${money(data?.minimumRequestAmount)}.`,
    },
    {
      label: "Circuit de validation",
      ready: !activeRequest,
      text: activeRequest
        ? `${activeRequest.request_number} est encore ${statusMeta[activeRequest.status]?.label?.toLowerCase?.() || "en cours"}.`
        : "Aucune demande active ne bloque un nouveau retrait.",
    },
  ];

  useEffect(() => {
    if (!data) return;
    const params = new URLSearchParams(location.search);
    if (params.get("request") !== "1") return;

    if (canRequest) {
      setAmount(String(wallet.available_balance || ""));
      setShowRequest(true);
    }

    params.delete("request");
    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [
    canRequest,
    data,
    location.pathname,
    location.search,
    navigate,
    wallet.available_balance,
  ]);

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
          <div className={`wallet-action-hint ${canRequest ? "ready" : "blocked"}`}>
            <small>{canRequest ? "Prêt pour la demande" : "Action bloquée pour le moment"}</small>
            <p>{requestBlocker}</p>
          </div>
        </aside>
      </section>

      <section className="seller-wallet-readiness">
        {readinessItems.map((item) => (
          <article className={item.ready ? "ready" : "blocked"} key={item.label}>
            <span>{item.ready ? <CheckCircle2 /> : <AlertTriangle />}</span>
            <div>
              <small>{item.label}</small>
              <p>{item.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="wallet-metric-grid">
        <WalletMetric
          icon={LockKeyhole}
          label="Fonds bloqués"
          value={wallet.held_balance}
          note={`${wallet.held_sales || 0} vente(s) payée(s) attendent la réception`}
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
            {requests.map((request) => {
              const step = getPayoutStepDetails(request);
              return (
                <article key={request.id}>
                  <div>
                    <small>{request.request_number}</small>
                    <strong>{money(request.amount)}</strong>
                    <span>{shortDate(request.created_at)}</span>
                  </div>
                  <WalletStatus value={request.status} />
                  <div className={`wallet-request-step ${step.tone}`}>
                    <b>{step.title}</b>
                    <small>{step.text}</small>
                  </div>
                  {request.reviewed_by_name && (
                    <p>Validation : {request.reviewed_by_name}</p>
                  )}
                  {request.manager_name && (
                    <p>Exécution finance : {request.manager_name}</p>
                  )}
                  {request.admin_note && <p>Décision admin : {request.admin_note}</p>}
                  {request.failure_reason && <p>Suivi finance : {request.failure_reason}</p>}
                  {request.payment_reference && (
                    <p className="wallet-reference">Référence : {request.payment_reference}</p>
                  )}
                  {request.status === "pending" && (
                    <button type="button" disabled={busy} onClick={() => cancelRequest(request)}>
                      Annuler la demande
                    </button>
                  )}
                </article>
              );
            })}
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
              <p>Le montant sera réservé pendant la validation et le transfert de l’équipe finance.</p>
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
  const step = getPayoutStepDetails(request);

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
      <div className={`payout-desk-step ${step.tone}`}>
        <b>{step.title}</b>
        <p>{step.text}</p>
      </div>
      <div className="payout-desk-summary">
        <span>Commission retenue</span>
        <b>{money(request.commission_total_amount)}</b>
      </div>
      <dl>
        <div><dt>MonCash</dt><dd>{request.moncash_number}</dd></div>
        <div><dt>Titulaire</dt><dd>{request.moncash_account_name}</dd></div>
        <div><dt>Ventes liées</dt><dd>{request.payout_count || 0}</dd></div>
      </dl>
      {request.reviewed_by_name && (
        <p className="payout-desk-note">Validation admin : {request.reviewed_by_name}</p>
      )}
      {request.manager_name && (
        <p className="payout-desk-note">Responsable finance : {request.manager_name}</p>
      )}
      {request.provider_transfer_reference && (
        <p className="payout-desk-reference">Réf. sécurisée : {request.provider_transfer_reference}</p>
      )}
      {request.failure_reason && (
        <p className="payout-desk-reference danger">Incident : {request.failure_reason}</p>
      )}
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const payoutFilterOptions = [
    ["pending", "En attente finance"],
    ["approved", "Approuvée"],
    ["processing", "Transfert en cours"],
    ["paid", "Payée"],
    ["rejected", "Refusée"],
    ["all", "Toutes"],
  ];

  useEffect(() => {
    setMobileFiltersOpen(false);
  }, [filter, query]);

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
        text="Vérifiez l’identité MonCash, le montant et les ventes libérées. L’équipe finance exécutera ensuite le transfert."
      >
        <span className="wallet-role-chip"><ShieldCheck /> Approbation uniquement</span>
      </WalletPageHeading>
      <WalletFeedback message={message} error={error} />
      <section className="wallet-metric-grid wallet-desk-metrics">
        <WalletMetric icon={Clock3} label="À examiner" value={data.stats.pending_amount} note={`${data.stats.pending_count || 0} demande(s)`} tone="gold" />
        <WalletMetric icon={ShieldCheck} label="Transmises" value={data.stats.approved_amount} note="À la finance" tone="blue" />
        <WalletMetric icon={CheckCircle2} label="Déjà payées" value={data.stats.paid_amount} note="Historique confirmé" tone="green" />
      </section>
      <section className={`payout-desk-toolbar ${mobileFiltersOpen ? "mobile-open" : ""}`}>
        <label className="payout-desk-toolbar-search">
          <Search />
          <span>
            <small>Recherche</small>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Boutique, demande ou MonCash"
            />
          </span>
        </label>
        <button
          type="button"
          className="payout-desk-toolbar-trigger"
          aria-label="Ouvrir les filtres"
          onClick={() => setMobileFiltersOpen((current) => !current)}
        >
          <MoreHorizontal />
        </button>
        <div className="payout-desk-toolbar-panel">
          <label className="payout-desk-toolbar-select" aria-label="Filtrer les demandes administratives">
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              {payoutFilterOptions.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <nav>
            {payoutFilterOptions.map(([value, label]) => (
              <button className={filter === value ? "active" : ""} onClick={() => setFilter(value)} key={value}>
                {label}
              </button>
            ))}
          </nav>
        </div>
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
            <FinanceBreakdown request={selected} />
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
    "/finance/payout-requests",
  );
  const [selected, setSelected] = useState(null);
  const [reference, setReference] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ready");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [beneficiaryChecked, setBeneficiaryChecked] = useState(false);
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [providerBalance, setProviderBalance] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const provider = data.provider || {};
  const payoutFilterOptions = [
    ["ready", "À traiter"],
    ["pending", "En attente finance"],
    ["approved", "Approuvée"],
    ["processing", "Transfert en cours"],
    ["verification_required", "À vérifier"],
    ["paid", "Payée"],
    ["failed", "Échec du transfert"],
    ["rejected", "Refusée"],
    ["all", "Toutes"],
  ];
  const activeFilterLabel =
    filter === "ready"
      ? "À traiter"
      : filter === "all"
        ? "Toutes les demandes"
        : statusMeta[filter]?.label || filter;

  useEffect(() => {
    setMobileFiltersOpen(false);
  }, [filter, query]);

  const requests = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.requests.filter((request) => {
      const matchesStatus =
        filter === "all" ||
        (filter === "ready" &&
          ["pending", "approved", "processing", "verification_required"].includes(request.status)) ||
        request.status === filter;
      return matchesStatus && `${request.request_number} ${request.seller_name} ${request.moncash_number}`.toLowerCase().includes(normalized);
    });
  }, [data.requests, filter, query]);

  const review = async (decision) => {
    if (decision === "rejected" && failureReason.trim().length < 3) {
      setError("Ajoutez un motif clair avant le refus.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { data: response } = await api.patch(
        `/finance/payout-requests/${selected.id}/review`,
        {
          decision,
          note: decision === "rejected" ? failureReason.trim() : undefined,
        },
      );
      setMessage(response.message);
      setFailureReason("");
      setSelected(null);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Décision impossible.");
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (action, payload) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { data: response } = await api.patch(
        `/finance/payout-requests/${selected.id}/${action}`,
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

  const openRequest = (request) => {
    setBeneficiaryChecked(false);
    setTransferConfirmed(false);
    setSelected(request);
  };

  const refreshProvider = async () => {
    setBusy(true);
    setError("");
    try {
      const { data: response } = await api.get("/finance/moncash/status");
      setProviderBalance(response.balance);
      if (response.message) setError(response.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "MonCash est momentanément indisponible.");
    } finally {
      setBusy(false);
    }
  };

  const runMonCashAction = async (action) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { data: response } = await api.post(
        `/finance/payout-requests/${selected.id}/${action}`,
      );
      setMessage(response.message);
      if (action === "beneficiary-check") {
        setBeneficiaryChecked(true);
      } else {
        setSelected(null);
        await load();
      }
    } catch (requestError) {
      const response = requestError.response?.data;
      setError(response?.message || "Action MonCash impossible.");
      if (response?.requiresReconciliation) await load();
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
        text="Contrôlez le bénéficiaire, envoyez le paiement par l’API MonCash et réconciliez chaque opération sans risque de doublon."
      >
        <span className="wallet-role-chip manager"><Landmark /> Exécution finance</span>
      </WalletPageHeading>
      <WalletFeedback message={message} error={error} />
      <section className={`moncash-provider-strip ${provider.enabled ? "online" : "standby"}`}>
        <span><Landmark /></span>
        <div>
          <small>Passerelle MonCash · {provider.mode || "sandbox"}</small>
          <b>{provider.enabled ? "API activée" : "Préparée, mais désactivée"}</b>
          <p>
            {provider.enabled
              ? "Les virements sont exécutés depuis VinnHT avec contrôle anti-doublon."
              : "Aucun virement réel ne peut partir tant que MONCASH_ENABLED reste à false."}
          </p>
        </div>
        {provider.enabled && (
          <button type="button" disabled={busy} onClick={refreshProvider}>
            <RefreshCw />
            {providerBalance === null ? "Vérifier le solde" : money(providerBalance)}
          </button>
        )}
      </section>
      <section className="wallet-metric-grid wallet-desk-metrics">
        <WalletMetric icon={Clock3} label="À valider" value={data.stats.pending_amount} note={`${data.stats.pending_count || 0} demande(s)`} tone="gold" />
        <WalletMetric icon={PlayCircle} label="Prêtes" value={data.stats.approved_amount} note={`${data.stats.approved_count || 0} transfert(s)`} tone="blue" />
        <WalletMetric icon={RefreshCw} label="En traitement" value={data.stats.processing_amount} note="Pris en charge" tone="gold" />
        <WalletMetric icon={AlertTriangle} label="À revoir" value={data.stats.failed_amount} note={`${data.stats.failed_count || 0} incident(s)`} tone="rose" />
        <WalletMetric icon={CheckCircle2} label="Transféré" value={data.stats.paid_amount} note="Références enregistrées" tone="green" />
      </section>
      <section className={`payout-desk-toolbar ${mobileFiltersOpen ? "mobile-open" : ""}`}>
        <label className="payout-desk-toolbar-search">
          <Search />
          <span>
            <small>Recherche</small>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Boutique, demande ou MonCash"
            />
          </span>
        </label>
        <button
          type="button"
          className="payout-desk-toolbar-trigger"
          aria-label="Ouvrir les filtres"
          onClick={() => setMobileFiltersOpen((current) => !current)}
        >
          <MoreHorizontal />
        </button>
        <div className="payout-desk-toolbar-panel">
          <label className="payout-desk-toolbar-select" aria-label="Filtrer les demandes finance">
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              {payoutFilterOptions.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <nav>
            {payoutFilterOptions.map(([value, label]) => (
              <button className={filter === value ? "active" : ""} onClick={() => setFilter(value)} key={value}>
                {label}
              </button>
            ))}
          </nav>
        </div>
      </section>
      <section className="finance-mobile-summary">
        <span>
          <small>Filtre actif</small>
          <b>{activeFilterLabel}</b>
        </span>
        <span>
          <small>Demandes visibles</small>
          <b>{requests.length}</b>
        </span>
      </section>
      <section className="payout-desk-grid">
        {requests.map((request) => (
          <PayoutDeskCard
            request={request}
            onOpen={openRequest}
            actionLabel={
              request.status === "pending"
                ? "Valider"
                : request.status === "approved"
                  ? "Prendre en charge"
                  : "Ouvrir le suivi"
            }
            key={request.id}
          />
        ))}
        {!requests.length && <div className="wallet-empty desk"><Landmark /><h3>Aucun transfert dans cette file</h3><p>Les demandes vendeurs validables ou en cours apparaîtront ici.</p></div>}
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
              <span><small>Validé par</small><b>{selected.reviewed_by_name || (selected.status === "pending" ? "En attente" : "Finance VinnHT")}</b></span>
            </div>
            <FinanceBreakdown request={selected} />
            {selected.seller_note && <blockquote>{selected.seller_note}</blockquote>}
            {selected.status === "pending" && (
              <div className="manager-transfer-actions">
                <div className="wallet-modal-notice">
                  <ShieldCheck />
                  <p>Vérifiez le titulaire MonCash et le montant demandé. La somme reste réservée dans le wallet vendeur tant que la décision n’est pas prise.</p>
                </div>
                <label>
                  Motif en cas de refus
                  <textarea
                    rows="2"
                    value={failureReason}
                    onChange={(event) => setFailureReason(event.target.value)}
                    placeholder="Optionnel si vous validez, requis si vous refusez."
                  />
                </label>
                <div className="manager-transfer-actions-row">
                  <button className="danger" disabled={busy} onClick={() => review("rejected")}>
                    <X /> Refuser
                  </button>
                  <button disabled={busy} onClick={() => review("approved")}>
                    <ShieldCheck /> Valider la demande
                  </button>
                </div>
              </div>
            )}
            {selected.status === "approved" && (
              <div className="manager-transfer-actions">
                <div className="wallet-modal-notice">
                  <ShieldCheck />
                  <p>La validation administrative est terminée. Cette demande peut maintenant être verrouillée sur votre compte finance avant le transfert.</p>
                </div>
                <button className="manager-start-transfer" disabled={busy} onClick={() => runAction("processing")}>
                  <PlayCircle /> Prendre en charge ce transfert
                </button>
              </div>
            )}
            {selected.status === "processing" && provider.enabled && provider.configured && (
              <div className="manager-transfer-actions moncash-api-actions">
                <div className="wallet-modal-notice">
                  <ShieldCheck />
                  <p>VinnHT vérifiera le bénéficiaire et le solde Prefunded avant l’envoi. Le PIN MonCash ne doit jamais être demandé.</p>
                </div>
                {selected.provider_transfer_reference && (
                  <p className="wallet-reference">Référence sécurisée en cours : {selected.provider_transfer_reference}</p>
                )}
                <button
                  className={beneficiaryChecked ? "moncash-check-success" : "moncash-check-button"}
                  type="button"
                  disabled={busy || beneficiaryChecked}
                  onClick={() => runMonCashAction("beneficiary-check")}
                >
                  {beneficiaryChecked ? <CheckCircle2 /> : <ShieldCheck />}
                  {beneficiaryChecked ? "Bénéficiaire contrôlé" : "Vérifier le bénéficiaire"}
                </button>
                <label className="moncash-transfer-consent">
                  <input
                    type="checkbox"
                    checked={transferConfirmed}
                    onChange={(event) => setTransferConfirmed(event.target.checked)}
                  />
                  <span>
                    <b>Je confirme ce virement de {money(selected.amount)}</b>
                    <small>Vers {selected.moncash_number}, au nom de {selected.moncash_account_name}.</small>
                  </span>
                </label>
                <button
                  className="moncash-send-button"
                  type="button"
                  disabled={busy || !beneficiaryChecked || !transferConfirmed}
                  onClick={() => runMonCashAction("transfer")}
                >
                  <Send /> {busy ? "Traitement sécurisé..." : "Envoyer avec MonCash"}
                </button>
              </div>
            )}
            {selected.status === "processing" && (!provider.enabled || !provider.configured) && provider.manualFallback && (
              <div className="manager-transfer-actions">
                <div className="wallet-modal-notice"><ShieldCheck /><p>Mode manuel temporaire. Vérifiez le transfert dans le portail MonCash avant d’enregistrer sa référence.</p></div>
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
            {selected.status === "verification_required" && (
              <div className="manager-transfer-actions moncash-reconcile-box">
                <div className="wallet-modal-notice">
                  <AlertTriangle />
                  <p>La réponse du transfert était incertaine. Ne renvoyez jamais l’argent avant d’avoir interrogé MonCash avec la même référence.</p>
                </div>
                {selected.provider_transfer_reference && (
                  <p className="wallet-reference">Référence sécurisée : {selected.provider_transfer_reference}</p>
                )}
                <button type="button" disabled={busy} onClick={() => runMonCashAction("reconcile")}>
                  <RefreshCw /> {busy ? "Vérification..." : "Réconcilier avec MonCash"}
                </button>
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

export function FinanceReportContent({ api }) {
  const [report, setReport] = useState(null);
  const today = new Date();
  const defaultMonthlyDate = new Date(
    today.getFullYear(),
    today.getDate() >= 30 ? today.getMonth() : today.getMonth() - 1,
    1,
  );
  const defaultMonthlyKey = `${defaultMonthlyDate.getFullYear()}-${String(
    defaultMonthlyDate.getMonth() + 1,
  ).padStart(2, "0")}`;
  const [monthlyKey, setMonthlyKey] = useState(defaultMonthlyKey);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [monthlyDownloading, setMonthlyDownloading] = useState(false);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [monthlyLoading, setMonthlyLoading] = useState(true);

  useEffect(() => {
    setWeeklyLoading(true);
    api
      .get("/admin/weekly-report")
      .then(({ data }) => setReport(data))
      .catch((requestError) =>
        setError(requestError.response?.data?.message || "Rapport financier indisponible."),
      )
      .finally(() => setWeeklyLoading(false));
  }, [api]);

  useEffect(() => {
    setMonthlyLoading(true);
    api
      .get("/finance/monthly-transfers", { params: { month: monthlyKey } })
      .then(({ data }) => setMonthlyReport(data))
      .catch((requestError) =>
        setError(requestError.response?.data?.message || "Rapport mensuel indisponible."),
      )
      .finally(() => setMonthlyLoading(false));
  }, [api, monthlyKey]);

  const download = async () => {
    setDownloading(true);
    setError("");
    try {
      const response = await api.get("/admin/weekly-report.pdf", {
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `rapport-vinnht-${report?.period?.end || "hebdomadaire"}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Téléchargement impossible.");
    } finally {
      setDownloading(false);
    }
  };

  const downloadMonthly = async () => {
    setMonthlyDownloading(true);
    setError("");
    try {
      const response = await api.get("/finance/monthly-transfers.docx", {
        params: { month: monthlyKey },
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `virements-vinnht-${monthlyKey}.docx`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Téléchargement Word impossible.");
    } finally {
      setMonthlyDownloading(false);
    }
  };

  const totals = report?.totals || {};
  const monthlyAvailable = Boolean(monthlyReport?.period?.available);
  const weeklyHasData = Boolean(report?.merchants?.length);

  return (
    <div className="wallet-flow finance-report-flow">
      <WalletPageHeading
        eyebrow="Contrôle financier"
        title="Rapports financiers"
        text="Consultez la synthèse hebdomadaire des ventes et archivez chaque mois les virements vendeurs dans un registre Word."
      >
        <button className="wallet-refresh" disabled={!report || downloading} onClick={download}>
          <Download /> {downloading ? "Génération..." : "PDF hebdomadaire"}
        </button>
      </WalletPageHeading>
      <WalletFeedback error={error} />
      <section className="wallet-panel finance-monthly-panel">
        <header>
          <div>
            <span><Download /></span>
            <div>
              <small>Archive mensuelle</small>
              <h3>Registre Word des virements vendeurs</h3>
            </div>
          </div>
          <span className={`finance-report-status ${monthlyAvailable ? "ready" : "pending"}`}>
            {monthlyLoading
              ? "Chargement..."
              : monthlyAvailable
                ? "Prêt à télécharger"
                : "Disponible le 30"}
          </span>
          <div className="finance-monthly-actions">
            <input
              type="month"
              value={monthlyKey}
              max={`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`}
              onChange={(event) => setMonthlyKey(event.target.value)}
              aria-label="Mois du rapport"
            />
            <button
              className="wallet-refresh"
              disabled={!monthlyReport?.period?.available || monthlyDownloading}
              onClick={downloadMonthly}
            >
              <Download /> {monthlyDownloading ? "Génération..." : "Télécharger le Word"}
            </button>
          </div>
        </header>
        {monthlyLoading ? (
          <div className="wallet-empty compact">Préparation du registre mensuel...</div>
        ) : (
          <>
            <div className="finance-monthly-summary">
              <span><small>Virements</small><b>{monthlyReport?.totals?.transfers || 0}</b></span>
              <span><small>Boutiques payées</small><b>{monthlyReport?.totals?.shops || 0}</b></span>
              <span><small>Total transféré</small><b>{money(monthlyReport?.totals?.amount)}</b></span>
            </div>
            <p>
              {monthlyReport?.period?.available
                ? `Le registre de ${monthlyReport.period.label} est prêt au téléchargement.`
                : "Le registre du mois courant devient disponible automatiquement à partir du 30."}
            </p>
          </>
        )}
        <div className="finance-report-notes">
          <article>
            <small>Usage</small>
            <p>Le PDF sert au suivi hebdomadaire des ventes et le Word archive les virements déjà exécutés.</p>
          </article>
          <article>
            <small>Rappel</small>
            <p>Une demande payée ne sort du wallet vendeur qu’après confirmation du transfert côté finance.</p>
          </article>
        </div>
      </section>
      <div className="finance-weekly-heading">
        <div>
          <small>Synthèse hebdomadaire</small>
          <h2>Activité des marchands</h2>
        </div>
        {report?.period && (
          <span>{shortDate(report.period.start)} – {shortDate(report.period.end)}</span>
        )}
      </div>
      {weeklyLoading ? (
        <WalletLoading />
      ) : (
        <>
          <section className="wallet-metric-grid finance-report-metrics">
            <WalletMetric icon={Store} label="Marchands" value={totals.merchants} note="Actifs cette semaine" tone="blue" suffix="" />
            <WalletMetric icon={ReceiptText} label="Commandes" value={totals.orders} note="Commandes encaissées" tone="gold" suffix="" />
            <WalletMetric icon={CircleDollarSign} label="Ventes globales" value={totals.grossSales} note="Volume brut" tone="green" />
            <WalletMetric icon={Wallet} label="Net vendeurs" value={totals.netSales} note="Avant demandes de transfert" tone="blue" />
          </section>
          <section className="wallet-panel finance-merchant-panel">
            <header>
              <div>
                <span><ReceiptText /></span>
                <div>
                  <small>Détail contrôlable</small>
                  <h3>Marchands de la période</h3>
                </div>
              </div>
              {report?.period && <b>{shortDate(report.period.start)} – {shortDate(report.period.end)}</b>}
            </header>
            <div className="finance-merchant-list">
              {(report?.merchants || []).map((merchant) => (
                <article key={merchant.seller_id}>
                  <span><Store /></span>
                  <div>
                    <b>{merchant.merchant_name}</b>
                    <small>{merchant.order_count} commande(s) · {merchant.item_count || 0} article(s)</small>
                  </div>
                  <div className="finance-merchant-amounts">
                    <small>{money(merchant.gross_sales)} brut</small>
                    <strong>{money(merchant.net_sales)}</strong>
                  </div>
                </article>
              ))}
              {report && !weeklyHasData && (
                <div className="wallet-empty">
                  Aucune vente encaissée sur cette période.
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}


