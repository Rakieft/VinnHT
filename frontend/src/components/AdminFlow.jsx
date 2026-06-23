import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Download,
  Edit3,
  FileText,
  Mail,
  MessageCircle,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Store,
  TrendingUp,
  Trash2,
  Truck,
  UserRoundCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import ProfilePhotoManager from "./ProfilePhotoManager.jsx";
import ProfileLogoutCard from "./ProfileLogoutCard.jsx";

const money = (value) => `${Number(value || 0).toLocaleString("fr-HT")} HTG`;
const shortDate = (value) =>
  value ? new Intl.DateTimeFormat("fr-HT", { dateStyle: "medium" }).format(new Date(value)) : "—";
const saturdayFor = (value = new Date()) => {
  const date = value instanceof Date ? new Date(value) : new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + ((6 - date.getDay() + 7) % 7));
  return date.toISOString().slice(0, 10);
};

const statusLabel = {
  active: "Actif",
  suspended: "Suspendu",
  pending: "En attente",
  paid: "Payé",
  failed: "Échoué",
  refunded: "Remboursé",
  processing: "Traitement",
  assigned: "Assignée",
  picked_up: "Récupérée",
  in_transit: "En livraison",
  unassigned: "Non assignée",
  delivered: "Livrée",
  approved: "Approuvée",
  rejected: "Refusée",
  cancelled: "Annulée",
  active_product: "Actif",
  inactive: "Inactif",
  draft: "Brouillon",
};

function AdminHeading({ eyebrow, title, text, children }) {
  return (
    <header className="admin-heading">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {children}
    </header>
  );
}

function Status({ value }) {
  return <span className={`admin-status ${value}`}>{statusLabel[value] || value || "—"}</span>;
}

export function AdminDashboardContent({ api }) {
  const [data, setData] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [reportEnding, setReportEnding] = useState(saturdayFor);
  const [loading, setLoading] = useState(true);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [{ data: response }, { data: report }] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/weekly-report", { params: { ending: reportEnding } }),
      ]);
      setData(response);
      setWeeklyReport(report);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Impossible de charger les données administratives."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [reportEnding]);

  const downloadWeeklyReport = async () => {
    setDownloadingReport(true);
    setError("");
    try {
      const { data: pdf } = await api.get("/admin/weekly-report.pdf", {
        params: { ending: reportEnding },
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `rapport-vinnht-${weeklyReport.period.start}-au-${weeklyReport.period.end}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Impossible de télécharger le rapport PDF."
      );
    } finally {
      setDownloadingReport(false);
    }
  };

  const stats = data?.stats || {};
  const recentAudit = data?.recentAudit || [];
  const cards = [
    [Users, "Utilisateurs", stats.users, `${stats.users_today || 0} nouveau(x) aujourd’hui`],
    [Store, "Vendeurs", stats.sellers, "Comptes disposant de l’espace vendeur"],
    [Boxes, "Produits actifs", stats.active_products, "Catalogue actuellement visible"],
    [Package, "Commandes", stats.orders, `${stats.orders_today || 0} aujourd’hui`],
    [CircleDollarSign, "Volume payé", stats.paid_volume, `${money(stats.paid_today)} aujourd’hui`, true],
    [Truck, "Livraisons actives", stats.active_deliveries, "À suivre par l’équipe"],
  ];
  const alerts = [
    {
      icon: ShieldCheck,
      label: "Demandes vendeurs",
      value: stats.pending_seller_requests || 0,
      text: "demandes attendent une décision",
      link: "/supervisor/seller-requests",
      tone: "gold",
    },
    {
      icon: CreditCard,
      label: "Paiements à vérifier",
      value: Number(stats.pending_payments || 0) + Number(stats.failed_payments || 0),
      text: `${stats.failed_payments || 0} paiement(s) échoué(s)`,
      link: "/admin/payments",
      tone: "red",
    },
    {
      icon: Truck,
      label: "Livraisons sans livreur",
      value: stats.unassigned_deliveries || 0,
      text: `${stats.failed_deliveries || 0} échec(s) signalé(s)`,
      link: "/manager/deliveries",
      tone: "blue",
    },
    {
      icon: Boxes,
      label: "Produits épuisés",
      value: stats.out_of_stock_products || 0,
      text: "produits actifs invisibles aux clients",
      link: "/admin/products",
      tone: "navy",
    },
    {
      icon: Wallet,
      label: "Payouts en attente",
      value: stats.pending_payouts || 0,
      text: "montants à surveiller avant paiement vendeur",
      link: "/admin/payments",
      tone: "gold",
    },
  ];
  const quickLinks = [
    [Users, "Gérer les utilisateurs", "/admin/users"],
    [Boxes, "Contrôler les produits", "/admin/products"],
    [FileText, "Rapport hebdomadaire", "#weekly-report"],
    [CreditCard, "Vérifier les paiements", "/admin/payments"],
    [Wallet, "Règlements vendeurs", "/admin/payments"],
    [Truck, "Coordonner les livraisons", "/manager/deliveries"],
  ];
  const maxDailySale = Math.max(
    1,
    ...(data.dailySales || []).map((item) => Number(item.total || 0))
  );
  const auditLabel = {
    "user.status.update": "Statut utilisateur modifié",
    "user.roles.update": "Rôles utilisateur modifiés",
    "category.create": "Catégorie créée",
    "category.update": "Catégorie modifiée",
    "product.status.update": "Statut produit modifié",
  };

  return (
    <div className="admin-flow">
      <AdminHeading
        eyebrow="Centre de contrôle en temps réel"
        title="Administration VinnHT"
        text="Identifiez les priorités, surveillez la marketplace et accédez rapidement aux opérations."
      >
        <button onClick={load} disabled={loading}>
          <RefreshCw className={loading ? "spinning" : ""} />
          {loading ? "Actualisation..." : "Actualiser"}
        </button>
      </AdminHeading>
      {error && <div className="admin-error">{error}</div>}
      <section className="admin-metric-grid">
        {cards.map(([Icon, label, value, detail, currency]) => (
          <article key={label}>
            <span>
              <Icon />
            </span>
            <small>{label}</small>
            <strong>{currency ? money(value) : Number(value || 0).toLocaleString("fr-HT")}</strong>
            <p>{detail}</p>
          </article>
        ))}
      </section>

      <section className="admin-priority-section">
        <header>
          <div>
            <AlertTriangle />
            <span>Priorités opérationnelles</span>
          </div>
          <small>Les éléments nécessitant une attention rapide</small>
        </header>
        <div className="admin-alert-grid">
          {alerts.map(({ icon: Icon, label, value, text, link, tone }) => (
            <Link className={`admin-alert ${tone}`} to={link} key={label}>
              <span>
                <Icon />
              </span>
              <div>
                <small>{label}</small>
                <strong>{Number(value).toLocaleString("fr-HT")}</strong>
                <p>{text}</p>
              </div>
              <ArrowRight />
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-quick-links">
        {quickLinks.map(([Icon, label, link]) => (
          <Link to={link} key={label}>
            <Icon />
            <span>{label}</span>
            <ArrowRight />
          </Link>
        ))}
      </section>

      <div className="admin-dashboard-columns">
        <section className="admin-panel admin-sales-panel">
          <header>
            <div>
              <TrendingUp />
              <span>
                <b>Volume payé sur 7 jours</b>
                <small>Encaissements confirmés</small>
              </span>
            </div>
            <strong>{money(stats.paid_volume)}</strong>
          </header>
          <div className="admin-sales-chart">
            {(data.dailySales || []).map((item) => (
              <article key={item.sale_date}>
                <span>
                  <i
                    style={{
                      height: `${Math.max(8, (Number(item.total) / maxDailySale) * 100)}%`,
                    }}
                  />
                </span>
                <small>
                  {new Intl.DateTimeFormat("fr-HT", { weekday: "short" }).format(
                    new Date(item.sale_date)
                  )}
                </small>
                <b>{money(item.total)}</b>
              </article>
            ))}
            {!data.dailySales.length && (
              <div className="admin-empty">Aucun paiement confirmé durant les sept derniers jours.</div>
            )}
          </div>
        </section>

        <section className="admin-panel admin-health-panel">
          <header>
            <div>
              <CheckCircle2 />
              <span>
                <b>Santé des opérations</b>
                <small>Paiements et livraisons par statut</small>
              </span>
            </div>
          </header>
          <div className="admin-health-groups">
            <div>
              <h3>Paiements</h3>
              {(data.paymentHealth || []).map((item) => (
                <p key={item.status}>
                  <Status value={item.status} />
                  <b>{item.total}</b>
                  <small>{money(item.amount)}</small>
                </p>
              ))}
            </div>
            <div>
              <h3>Livraisons</h3>
              {(data.deliveryHealth || []).map((item) => (
                <p key={item.status}>
                  <Status value={item.status} />
                  <b>{item.total}</b>
                </p>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="admin-dashboard-columns admin-dashboard-bottom">
        <section className="admin-panel admin-weekly-report" id="weekly-report">
          <header>
            <div>
              <FileText />
              <span>
                <b>Rapport hebdomadaire des marchands</b>
                <small>Rapport officiel généré pour chaque samedi</small>
              </span>
            </div>
            <label>
              Samedi du rapport
              <input
                type="date"
                value={reportEnding}
                onChange={(event) => setReportEnding(saturdayFor(event.target.value))}
              />
            </label>
          </header>
          <div className="admin-report-period">
            <span>
              <small>Période couverte</small>
              <b>
                {shortDate(weeklyReport.period.start)} au {shortDate(weeklyReport.period.end)}
              </b>
            </span>
            <p>
              Le PDF contient tous les marchands ayant réalisé une vente payée, leurs commandes,
              les produits vendus, les quantités et les montants.
            </p>
          </div>
          <div className="admin-report-metrics">
            {[
              ["Marchands", weeklyReport.totals.merchants || 0],
              ["Commandes marchands", weeklyReport.totals.orders || 0],
              ["Ventes globales", money(weeklyReport.totals.grossSales)],
              ["Commission VinnHT", money(weeklyReport.totals.commission)],
              ["Net vendeurs", money(weeklyReport.totals.netSales)],
            ].map(([label, value]) => (
              <article key={label}>
                <small>{label}</small>
                <b>{value}</b>
              </article>
            ))}
          </div>
          <button
            className="admin-download-report"
            disabled={!weeklyReport || downloadingReport}
            onClick={downloadWeeklyReport}
          >
            <Download />
              {downloadingReport ? "Generation du PDF..." : "Telecharger le rapport PDF"}
          </button>
        </section>

        <section className="admin-panel admin-audit-panel">
          <header>
            <div>
              <ShieldCheck />
              <span>
                <b>Journal de sécurité</b>
                <small>Dernières actions administratives</small>
              </span>
            </div>
          </header>
          <div>
            {recentAudit.map((item) => (
              <article key={item.id}>
                <span>
                  {item.action.includes("user") ? <UserPlus /> : <Clock3 />}
                </span>
                <p>
                  <b>{auditLabel[item.action] || item.action}</b>
                  <small>
                    {item.actor_name || "Système"} · {shortDate(item.created_at)}
                  </small>
                </p>
              </article>
            ))}
            {data && !recentAudit.length && (
              <div className="admin-empty">Aucune action administrative enregistrée.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export function AdminUsersContent({ api, currentUser }) {
  const roles = ["client", "seller", "delivery", "supervisor", "manager", "admin"];
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyUser, setBusyUser] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "supervisor",
  });
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [sponsorship, setSponsorship] = useState({
    amount: "",
    startsAt: new Date().toISOString().slice(0, 10),
    endsAt: "",
  });

  const load = () =>
    Promise.all([
      api.get("/admin/users", {
        params: {
          q: query.trim().length >= 2 ? query.trim() : undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
        },
      }),
      api.get("/admin/seller-sponsorships"),
    ])
      .then(([userResponse, campaignResponse]) => {
        setUsers(userResponse.data);
        setCampaigns(campaignResponse.data);
      })
      .catch(() => setError("Impossible de charger les utilisateurs."));
  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [query, statusFilter]);

  const visible = users;
  const userStats = {
    sellers: users.filter((user) => user.roles.includes("seller")).length,
    activeSellers: users.filter(
      (user) => user.roles.includes("seller") && user.status === "active"
    ).length,
    suspendedSellers: users.filter(
      (user) => user.roles.includes("seller") && user.status === "suspended"
    ).length,
  };

  const updateStatus = async (user) => {
    const nextStatus = user.status === "active" ? "suspended" : "active";
    const action = nextStatus === "suspended" ? "suspendre" : "réactiver";
    if (!window.confirm(`Confirmer : ${action} le compte de ${user.name} `)) return;
    setBusyUser(user.id);
    setMessage("");
    setError("");
    try {
      const { data } = await api.patch(`/admin/users/${user.id}/status`, {
        status: nextStatus,
      });
      setMessage(data.message);
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de modifier ce compte.");
    } finally {
      setBusyUser(null);
    }
  };

  const createStaff = async (event) => {
    event.preventDefault();
    setCreatingStaff(true);
    setMessage("");
    setError("");
    try {
      const { data } = await api.post("/admin/staff", staffForm);
      setMessage(data.message);
      setStaffForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "supervisor",
      });
      setQuery(staffForm.email);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de créer ce compte.");
    } finally {
      setCreatingStaff(false);
    }
  };

  const toggleRole = async (user, role) => {
    const nextRoles = user.roles.includes(role)
       ? user.roles.filter((value) => value !== role)
      : [...user.roles, role];
    if (!nextRoles.length) return;
    setBusyUser(user.id);
    setMessage("");
    setError("");
    try {
      const { data } = await api.patch(`/admin/users/${user.id}/roles`, {
        roles: nextRoles,
      });
      setMessage(data.message);
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de modifier les rôles.");
    } finally {
      setBusyUser(null);
    }
  };

  const campaignFor = (userId) => campaigns.find((campaign) => Number(campaign.seller_id) === Number(userId));
  const campaignIsActive = (campaign) =>
    campaign.sponsorship_status === "active" &&
    new Date(campaign.sponsorship_ends_at) > new Date();
  const openCampaign = (user) => {
    const campaign = campaignFor(user.id);
    const end = new Date();
    end.setDate(end.getDate() + 30);
    setSelectedSeller({ ...user, campaign });
    setSponsorship({
      amount: campaign.sponsorship_amount || "",
      startsAt: new Date().toISOString().slice(0, 10),
      endsAt: end.toISOString().slice(0, 10),
    });
  };
  const saveCampaign = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post(`/admin/sellers/${selectedSeller.id}/sponsorship`, sponsorship);
      setMessage(data.message);
      setSelectedSeller(null);
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible d’activer cette campagne.");
    }
  };
  const cancelCampaign = async (user) => {
    const { data } = await api.patch(`/admin/sellers/${user.id}/sponsorship/cancel`);
    setMessage(data.message);
    load();
  };

  return (
    <div className="admin-flow">
      <AdminHeading
        eyebrow="Utilisateurs opérationnels"
        title="Vendeurs et équipe VinnHT"
        text="Créez les managers et superviseurs, puis suivez les vendeurs validés."
      >
        <button onClick={load}>
          <RefreshCw /> Actualiser
        </button>
      </AdminHeading>
      {message && <div className="admin-message">{message}</div>}
      {error && <div className="admin-error">{error}</div>}
      <form className="admin-staff-create-form" onSubmit={createStaff}>
        <header>
          <span><UserPlus /></span>
          <div>
            <small>Équipe opérationnelle</small>
            <h2>Créer un manager ou superviseur</h2>
            <p>Le compte sera actif immédiatement avec le rôle sélectionné.</p>
          </div>
        </header>
        <label>
          Nom complet
          <input required minLength="2" value={staffForm.name} onChange={(event) => setStaffForm({ ...staffForm, name: event.target.value })} />
        </label>
        <label>
          Adresse email
          <input required type="email" value={staffForm.email} onChange={(event) => setStaffForm({ ...staffForm, email: event.target.value })} />
        </label>
        <label>
          Téléphone
          <input value={staffForm.phone} onChange={(event) => setStaffForm({ ...staffForm, phone: event.target.value })} />
        </label>
        <label>
          Rôle
          <select value={staffForm.role} onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value })}>
            <option value="supervisor">Superviseur</option>
            <option value="manager">Manager</option>
          </select>
        </label>
        <label className="full">
          Mot de passe initial
          <input required minLength="10" type="password" value={staffForm.password} onChange={(event) => setStaffForm({ ...staffForm, password: event.target.value })} />
        </label>
        <button disabled={creatingStaff}>
          <UserPlus /> {creatingStaff ? "Creation..." : "Creer le compte"}
        </button>
      </form>
      {query.trim().length < 2 && (
        <section className="admin-user-summary">
          {[
            [Store, "Vendeurs affichés", userStats.sellers],
            [CheckCircle2, "Vendeurs actifs", userStats.activeSellers],
            [AlertTriangle, "Vendeurs suspendus", userStats.suspendedSellers],
          ].map(([Icon, label, value]) => (
            <article key={label}>
              <Icon />
              <span><small>{label}</small><b>{value}</b></span>
            </article>
          ))}
        </section>
      )}
      <section className="admin-filter-bar">
        <label className="admin-search">
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un client, vendeur, email ou téléphone"
          />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="suspended">Suspendus</option>
        </select>
      </section>
      <div className="admin-results-count">
        {query.trim().length >= 2
           ? `${visible.length} compte(s) trouvé(s) pour votre recherche`
          : `${visible.length} vendeur(s) affiché(s)`}
      </div>
      <section className="admin-user-grid">
        {visible.map((user) => {
          const campaign = campaignFor(user.id);
          const sponsored = campaignIsActive(campaign);
          return (
          <article className={`${user.status === "suspended" ? "suspended" : ""} ${sponsored ? "sponsored" : ""}`} key={user.id}>
            <header>
              <span><UserRoundCheck /></span>
              <div>
                <b>{user.name}</b>
                <small><Mail /> {user.email}</small>
                {user.phone && <small><Phone /> {user.phone}</small>}
              </div>
              <Status value={user.status} />
            </header>
            <div className="admin-user-meta">
              <span>Compte #{user.id}</span>
              <span>Créé le {shortDate(user.created_at)}</span>
              {user.id === currentUser.id && <b>Votre compte</b>}
            </div>
            {user.roles.includes("seller") && (
              <section className="admin-user-campaign">
                <TrendingUp />
                <span>
                  <small>{sponsored ? "Visibilite prioritaire active" : "Classement naturel"}</small>
                  <b>{sponsored ? money(campaign.sponsorship_amount) : "Aucune campagne active"}</b>
                  {sponsored && <small>Jusqu'au {shortDate(campaign.sponsorship_ends_at)}</small>}
                </span>
                <button
                  className={sponsored ? "danger" : ""}
                  onClick={() => sponsored ? cancelCampaign(user) : openCampaign(user)}
                >
                  {sponsored ? "Arreter" : "Promouvoir"}
                </button>
              </section>
            )}
            <small className="admin-role-title">Cliquer sur un rôle pour l’ajouter ou le retirer</small>
            <div className="admin-role-list">
              {roles.map((role) => (
                <button
                  className={user.roles.includes(role) ? "active" : ""}
                  disabled={busyUser === user.id || (user.id === currentUser.id && role === "admin")}
                  onClick={() => toggleRole(user, role)}
                  key={role}
                >
                  {role}
                </button>
              ))}
            </div>
            <footer>
              <small>{user.roles.length} rôle(s) actif(s)</small>
              <button
                disabled={busyUser === user.id || user.id === currentUser.id}
                onClick={() => updateStatus(user)}
              >
                {user.status === "active" ? "Suspendre" : "Réactiver"}
              </button>
            </footer>
          </article>
          );
        })}
      </section>
      {!visible.length && (
        <div className="admin-empty">
          {query.trim().length === 1
             ? "Saisissez au moins deux caractères pour rechercher un client."
            : "Aucun compte ne correspond à votre recherche."}
        </div>
      )}
      {selectedSeller && (
        <form className="admin-sponsor-form" onSubmit={saveCampaign}>
          <header><TrendingUp /><div><small>Campagne vendeur payée</small><h2>Promouvoir {selectedSeller.name}</h2><p>Tous les produits actifs et pertinents de cette boutique passeront avant les résultats naturels.</p></div><button type="button" onClick={() => setSelectedSeller(null)}>×</button></header>
          <label>Montant payé (HTG)<input required type="number" min="0" value={sponsorship.amount} onChange={(event) => setSponsorship({ ...sponsorship, amount: event.target.value })} /></label>
          <label>Date de début<input required type="date" value={sponsorship.startsAt} onChange={(event) => setSponsorship({ ...sponsorship, startsAt: event.target.value })} /></label>
          <label>Date de fin<input required type="date" value={sponsorship.endsAt} onChange={(event) => setSponsorship({ ...sponsorship, endsAt: event.target.value })} /></label>
          <button>Confirmer le paiement et activer</button>
        </form>
      )}
    </div>
  );
}

export function AdminCategoriesContent({ api }) {
  const empty = { name: "", slug: "", icon: "layout-grid" };
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () =>
    api
      .get("/admin/categories")
      .then(({ data }) => setCategories(data))
      .catch(() => setError("Impossible de charger les catégories."));
  useEffect(() => { load(); }, []);
  const visible = categories.filter((category) =>
    `${category.name} ${category.slug}`.toLowerCase().includes(query.toLowerCase())
  );
  const totals = categories.reduce(
    (summary, category) => ({
      products: summary.products + Number(category.product_count || 0),
      active: summary.active + Number(category.active_product_count || 0),
      outOfStock: summary.outOfStock + Number(category.out_of_stock_count || 0),
    }),
    { products: 0, active: 0, outOfStock: 0 },
  );

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const endpoint = editing ? `/admin/categories/${editing}` : "/admin/categories";
      const response = editing ? await api.patch(endpoint, form) : await api.post(endpoint, form);
      setMessage(response.data.message);
      setForm(empty);
      setEditing(null);
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible d’enregistrer cette catégorie.");
    } finally {
      setBusy(false);
    }
  };
  const edit = (category) => {
    setEditing(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      icon: category.icon || "layout-grid",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const remove = async (category) => {
    if (Number(category.product_count) > 0) return;
    if (!window.confirm(`Supprimer définitivement la catégorie vide « ${category.name} » `)) return;
    setError("");
    setMessage("");
    try {
      const { data } = await api.delete(`/admin/categories/${category.id}`);
      setMessage(data.message);
      if (editing === category.id) {
        setEditing(null);
        setForm(empty);
      }
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de supprimer cette catégorie.");
    }
  };

  return (
    <div className="admin-flow">
      <AdminHeading
        eyebrow="Organisation du marché"
        title="Catégories et rayons"
        text="Organisez le catalogue sans perdre les produits déjà publiés par les vendeurs."
      >
        <button onClick={() => { setEditing(null); setForm(empty); }}>
          <Plus /> Nouvelle catégorie
        </button>
      </AdminHeading>
      {message && <div className="admin-message">{message}</div>}
      {error && <div className="admin-error">{error}</div>}
      <section className="admin-category-summary">
        {[
          [Boxes, "Rayons", categories.length],
          [Package, "Produits associes", totals.products],
          [CheckCircle2, "Produits actifs", totals.active],
          [AlertTriangle, "Produits epuises", totals.outOfStock],
        ].map(([Icon, label, value]) => (
          <article key={label}>
            <Icon />
            <span><small>{label}</small><b>{value}</b></span>
          </article>
        ))}
      </section>
      <div className="admin-category-layout">
        <form className="admin-panel admin-category-form" onSubmit={submit}>
          <header>
            <span><Edit3 /></span>
            <div>
              <small>{editing ? "Modification" : "Nouveau rayon"}</small>
                <h2>{editing ? "Modifier la categorie" : "Creer une categorie"}</h2>
            </div>
          </header>
          <label>
            Nom visible
            <input
              required
              value={form.name}
              onChange={(event) => {
                const name = event.target.value;
                setForm({
                  ...form,
                  name,
                  slug: editing
                     ? form.slug
                    : name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                });
              }}
              placeholder="Ex. Informatique"
            />
          </label>
          <label>
            Slug URL
            <input
              required
              pattern="[a-z0-9-]+"
              value={form.slug}
              onChange={(event) =>
                setForm({
                  ...form,
                  slug: event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                })
              }
            />
          </label>
          <label>
            Nom de l’icône
            <input
              value={form.icon}
              onChange={(event) => setForm({ ...form, icon: event.target.value })}
              placeholder="layout-grid"
            />
          </label>
          <div className="admin-category-form-actions">
            {editing && (
              <button
                type="button"
                className="secondary"
                onClick={() => { setEditing(null); setForm(empty); }}
              >
                Annuler
              </button>
            )}
            <button type="submit" disabled={busy}>
              {busy ? "Enregistrement..." : editing ? "Enregistrer" : "Créer le rayon"}
            </button>
          </div>
        </form>
        <div className="admin-category-browser">
          <label className="admin-search">
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un rayon"
            />
          </label>
          <section className="admin-category-grid">
            {visible.map((category) => (
              <article className={editing === category.id ? "selected" : ""} key={category.id}>
                <header>
                  <span><Boxes /></span>
                  <div><b>{category.name}</b><small>/{category.slug}</small></div>
                </header>
                <div className="admin-category-metrics">
                  <span><b>{category.product_count}</b><small>produits</small></span>
                  <span><b>{category.active_product_count || 0}</b><small>actifs</small></span>
                  <span><b>{category.total_stock || 0}</b><small>en stock</small></span>
                </div>
                <footer>
                  <button onClick={() => edit(category)}><Edit3 /> Modifier</button>
                  <button
                    className="danger"
                    disabled={Number(category.product_count) > 0}
                      title={
                      Number(category.product_count) > 0
                         ? "Déplacez les produits avant de supprimer cette catégorie."
                        : "Supprimer cette catégorie vide"
                    }
                    onClick={() => remove(category)}
                  >
                    <Trash2 /> Supprimer
                  </button>
                </footer>
              </article>
            ))}
          </section>
          {!visible.length && <div className="admin-empty">Aucune catégorie trouvée.</div>}
        </div>
      </div>
    </div>
  );
}

export function AdminProductsContent({ api }) {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = () =>
    api.get("/admin/products")
      .then(({ data }) => setProducts(data))
      .catch(() => setError("Impossible de charger les produits."));
  useEffect(() => { load(); }, []);
  const visible = products.filter((product) => {
    const searchMatch = `${product.name} ${product.seller_name} ${product.category_name}`
      .toLowerCase()
      .includes(query.toLowerCase());
    return searchMatch && (statusFilter === "all" || product.status === statusFilter);
  });
  const updateStatus = async (product) => {
    const status = product.status === "active" ? "inactive" : "active";
    const { data } = await api.patch(`/admin/products/${product.id}/status`, { status });
    setMessage(data.message);
    load();
  };
  return (
    <div className="admin-flow">
      <AdminHeading
        eyebrow="Catalogue marketplace"
        title="Produits"
        text="Contrôlez les produits, leurs stocks et leur disponibilité dans la marketplace."
      />
      {message && <div className="admin-message">{message}</div>}
      {error && <div className="admin-error">{error}</div>}
      <section className="admin-category-summary">
        {[
          [Boxes, "Produits", products.length],
          [CheckCircle2, "Actifs", products.filter((p) => p.status === "active").length],
          [AlertTriangle, "Stock épuisé", products.filter((p) => Number(p.stock) === 0).length],
          [Store, "Vendeurs", new Set(products.map((product) => product.seller_id)).size],
        ].map(([Icon, label, value]) => (
          <article key={label}><Icon /><span><small>{label}</small><b>{value}</b></span></article>
        ))}
      </section>
      <section className="admin-filter-bar">
        <label className="admin-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Produit, vendeur ou catégorie" /></label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
          <option value="draft">Brouillons</option>
        </select>
      </section>
      <section className="admin-product-grid">
        {visible.map((product) => {
          return (
            <article key={product.id}>
              <div className="admin-product-image">
                {product.image_url ? <img src={product.image_url} alt={product.name} /> : <Boxes />}
              </div>
              <header><div><small>{product.category_name}</small><h3>{product.name}</h3><p>{product.seller_name}</p></div><Status value={product.status} /></header>
              <div className="admin-product-numbers">
                <span><small>Prix</small><b>{money(product.price)}</b></span>
                <span><small>Stock</small><b>{product.stock}</b></span>
              </div>
              <footer>
                <button onClick={() => updateStatus(product)}>{product.status === "active" ? "Desactiver" : "Activer"}</button>
              </footer>
            </article>
          );
        })}
      </section>
    </div>
  );
}

export function AdminPaymentsContent({ api }) {
  const [center, setCenter] = useState({ stats: {}, batches: [] });
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reportEnding, setReportEnding] = useState(saturdayFor);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const load = () =>
    api.get("/admin/payment-center").then(({ data }) => setCenter(data || { stats: {}, batches: [] }));
  useEffect(() => { load(); }, []);
  const prepare = async () => {
    const { data } = await api.post("/admin/payout-batches/prepare", {});
    setMessage(data.message);
    load();
  };
  const paymentStats = center?.stats || {};
  const payoutBatches = center?.batches || [];

  const openBatch = async (batch) => {
    const { data } = await api.get(`/admin/payout-batches/${batch.id}`);
    setSelectedBatch(data);
  };
  const markPaid = async () => {
    if (!window.confirm("Confirmer que tous les vendeurs de ce lot ont réellement été payés ")) return;
    const { data } = await api.patch(`/admin/payout-batches/${selectedBatch.batch.id}/paid`);
    setMessage(data.message);
    setSelectedBatch(null);
    load();
  };
  const downloadWeeklyReport = async () => {
    setDownloadingReport(true);
    setError("");
    try {
      const { data: pdf } = await api.get("/admin/weekly-report.pdf", {
        params: { ending: reportEnding },
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `rapport-vinnht-semaine-du-${reportEnding}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Impossible de télécharger le rapport PDF."
      );
    } finally {
      setDownloadingReport(false);
    }
  };
  return (
    <div className="admin-flow">
      <AdminHeading eyebrow="Centre financier" title="Paiements et règlements vendeurs" text="Surveillez les encaissements clients et préparez chaque dimanche les montants dus aux vendeurs.">
        <div className="admin-payment-actions">
          <label>
            Samedi du rapport
            <input
              type="date"
              value={reportEnding}
              onChange={(event) => setReportEnding(saturdayFor(event.target.value))}
            />
          </label>
          <button onClick={downloadWeeklyReport} disabled={downloadingReport}>
            <Download />
              {downloadingReport ? "Generation du PDF..." : "Telecharger le rapport PDF"}
          </button>
          <button onClick={prepare}><RefreshCw /> Préparer le lot du dimanche</button>
        </div>
      </AdminHeading>
      {message && <div className="admin-message">{message}</div>}
      {error && <div className="admin-error">{error}</div>}
      <section className="admin-category-summary">
        {[
          [CircleDollarSign, "Total encaissé", money(paymentStats.collected)],
          [Clock3, "Paiements clients en attente", paymentStats.pending_count || 0],
          [AlertTriangle, "Paiements échoués", paymentStats.failed_count || 0],
          [Wallet, "Montant dû vendeurs", money(paymentStats.seller_due)],
        ].map(([Icon, label, value]) => <article key={label}><Icon /><span><small>{label}</small><b>{value}</b></span></article>)}
      </section>
      <section className="admin-panel admin-payout-batches">
        <header><div><Wallet /><span><b>Lots hebdomadaires vendeurs</b><small>Préparés le dimanche selon les ventes finalisées</small></span></div></header>
        <div>
          {payoutBatches.map((batch) => (
            <button onClick={() => openBatch(batch)} key={batch.id}>
              <span><small>Semaine</small><b>{shortDate(batch.period_start)} au {shortDate(batch.period_end)}</b></span>
              <span><small>Vendeurs</small><b>{batch.seller_count}</b></span>
              <span><small>Montant</small><b>{money(batch.total_amount)}</b></span>
              <Status value={batch.status} />
              <ArrowRight />
            </button>
          ))}
          {!payoutBatches.length && <div className="admin-empty">Aucun lot hebdomadaire prepare.</div>}
        </div>
      </section>
      {selectedBatch && (
        <section className="admin-batch-detail">
          <header><div><Wallet /><span><small>Paiement du dimanche</small><h2>{shortDate(selectedBatch.batch.period_start)} au {shortDate(selectedBatch.batch.period_end)}</h2></span></div><button onClick={() => setSelectedBatch(null)}>×</button></header>
          <div>{selectedBatch.items.map((item) => <article key={item.id}><span><b>{item.seller_name}</b><small>{item.email} · {item.sale_count} vente(s)</small></span><strong>{money(item.amount)}</strong><Status value={item.status} /></article>)}</div>
          {selectedBatch.batch.status !== "paid" && <button className="admin-download-report" onClick={markPaid}><CheckCircle2 /> Confirmer que tous les vendeurs ont été payés</button>}
        </section>
      )}
    </div>
  );
}

export function AdminProfileContent({
  api,
  user,
  updateUser,
  onLogout,
  accountLabel = "Administrateur",
}) {
  const [form, setForm] = useState({ name: user.name || "", phone: user.phone || "" });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("phone", form.phone);
      const { data: response } = await api.patch("/auth/profile", data);
      updateUser(response.user);
      setMessage(response.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Impossible de mettre le profil à jour.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-flow">
      <AdminHeading
        eyebrow={`Compte ${accountLabel}`}
        title="Mon profil"
        text={`Gérez les informations utilisées pour identifier votre compte ${accountLabel.toLowerCase()}.`}
      />
      <section className="admin-profile-layout">
        <aside className="admin-profile-card">
          <ProfilePhotoManager api={api} user={user} updateUser={updateUser} onMessage={setMessage} />
          <div><small>{accountLabel} VinnHT</small><h2>{user.name}</h2><p>{user.email}</p></div>
        </aside>
        <form className="admin-profile-form" onSubmit={save}>
          <header><Settings /><span><small>Informations personnelles</small><h2>Profil administrateur</h2></span></header>
          <label>Nom complet<input required minLength="2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Adresse email<input value={user.email || ""} disabled /></label>
          <label className="full">Téléphone<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
          {message && <div className="admin-message full">{message}</div>}
          <button className="admin-download-report full" disabled={saving}><CheckCircle2 /> {saving ? "Enregistrement..." : "Enregistrer le profil"}</button>
        </form>
      </section>
      <ProfileLogoutCard onLogout={onLogout} />
    </div>
  );
}

export function AdminSettingsContent({ api, role = "admin" }) {
  const defaults = {
    sellerRequests: true,
    paymentAlerts: true,
    weeklyReport: true,
    securityAlerts: true,
  };
  const [preferences, setPreferences] = useState(defaults);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get(`/preferences/${role}`).then(({ data }) => setPreferences({ ...defaults, ...data }));
  }, [role]);

  const togglePreference = async (key) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    try {
      const { data } = await api.put(`/preferences/${role}`, { preferences: next });
      setMessage(data.message);
    } catch (error) {
      setPreferences(preferences);
      setMessage(error.response?.data?.message || "Impossible d’enregistrer ce paramètre.");
    }
  };

  const settings =
    role === "manager"
      ? [
          [BarChart3, "Performance des ventes", "Recevoir les alertes sur l evolution des ventes.", "weeklyReport"],
          [Truck, "Suivi des livraisons", "Etre alerte des retards et echecs de livraison.", "securityAlerts"],
          [Store, "Performance vendeurs", "Suivre les boutiques necessitant une attention.", "sellerRequests"],
          [Package, "Activite des commandes", "Recevoir les resumes operationnels utiles.", "paymentAlerts"],
        ]
      : role === "superviseur"
        ? [
            [Store, "Demandes vendeurs", "Etre alerte a chaque nouvelle candidature.", "sellerRequests"],
            [ShieldCheck, "Decisions sensibles", "Recevoir les alertes de validation et refus.", "securityAlerts"],
            [FileText, "Rapport operationnel", "Recevoir un resume hebdomadaire.", "weeklyReport"],
            [Truck, "Incidents livraison", "Etre informe des echecs de livraison.", "paymentAlerts"],
          ]
        : [
            [Store, "Demandes vendeurs", "Etre alerte lorsqu un client demande a devenir vendeur.", "sellerRequests"],
            [Wallet, "Alertes financieres", "Recevoir les alertes de paiements et lots vendeurs.", "paymentAlerts"],
            [FileText, "Rapport hebdomadaire", "Recevoir le rappel du rapport officiel chaque samedi.", "weeklyReport"],
            [ShieldCheck, "Securite", "Etre informe des actions administratives sensibles.", "securityAlerts"],
          ];

  return (
    <div className="admin-flow">
      <AdminHeading eyebrow="Configuration" title={`Paramètres ${role}`} text="Choisissez les alertes importantes pour superviser VinnHT efficacement." />
      <section className="admin-settings-grid">
        {settings.map(([Icon, title, text, key]) => (
          <article key={key}>
            <span><Icon /></span>
            <div><h3>{title}</h3><p>{text}</p></div>
            <label><input type="checkbox" checked={preferences[key]} onChange={() => togglePreference(key)} /><i /></label>
          </article>
        ))}
      </section>
      <section className="admin-settings-note"><Bell /><div><h2>Centre de notifications</h2><p>Ces préférences contrôlent les alertes visibles dans votre espace administrateur.</p></div></section>
      {message && <div className="admin-message">{message}</div>}
    </div>
  );
}

export function AdminContactRequestsContent({ api }) {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");

  const load = () =>
    api.get("/admin/contact-requests").then(({ data }) => setRequests(data));

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    const { data } = await api.patch(`/admin/contact-requests/${id}`, { status });
    setMessage(data.message);
    load();
  };

  return (
    <div className="admin-flow">
      <AdminHeading
        eyebrow="Centre de support"
        title="Demandes Contact"
        text="Consultez et traitez les messages envoyés depuis la page Contact."
      />
      {message && <div className="admin-message">{message}</div>}
      <section className="admin-user-grid">
        {requests.map((request) => (
          <article key={request.id}>
            <header>
              <span><MessageCircle /></span>
              <div>
                <b>{request.subject}</b>
                <small>{request.name} · {request.email}</small>
                <small>{request.reference} ? {request.category}{request.order_number ? ` ? ${request.order_number}` : ""}</small>
              </div>
              <Status value={request.status} />
            </header>
            <p>{request.message}</p>
            <small>{shortDate(request.created_at)}</small>
            <div className="admin-user-actions">
              <button onClick={() => updateStatus(request.id, "in_progress")}>En traitement</button>
              <button onClick={() => updateStatus(request.id, "resolved")}>Résolue</button>
            </div>
          </article>
        ))}
        {!requests.length && <div className="admin-message">Aucune demande Contact actuellement.</div>}
      </section>
    </div>
  );
}

const resourceConfig = {
  products: {
    endpoint: "/admin/products",
    title: "Produits",
    text: "Supervisez le catalogue et retirez rapidement un produit problématique.",
    columns: ["Produit", "Vendeur", "Catégorie", "Stock", "Statut"],
    row: (item) => [item.name, item.seller_name, item.category_name, item.stock, <Status value={item.status} />],
  },
  payments: {
    endpoint: "/admin/payments",
    title: "Paiements",
    text: "Contrôlez les paiements enregistrés par la plateforme.",
    columns: ["Commande", "Client", "Montant", "Fournisseur", "Statut"],
    row: (item) => [item.order_number, item.client_name, money(item.amount), item.provider, <Status value={item.status} />],
  },
};

export function AdminResourceContent({ api, resource }) {
  const config = resourceConfig[resource];
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const load = () => api.get(config.endpoint).then(({ data }) => setItems(data));
  useEffect(() => { load(); }, [config.endpoint]);
  const visible = items.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()));
  const updateProductStatus = async (item) => {
    const status = item.status === "active" ? "inactive" : "active";
    const { data } = await api.patch(`/admin/products/${item.id}/status`, { status });
    setMessage(data.message);
    load();
  };

  return (
    <div className="admin-flow">
      <AdminHeading eyebrow="Back-office réel" title={config.title} text={config.text} />
      {message && <div className="admin-message">{message}</div>}
      <label className="admin-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Rechercher dans ${config.title.toLowerCase()}`} /></label>
      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table>
            <thead><tr>{config.columns.map((column) => <th key={column}>{column}</th>)}{resource === "products" && <th>Action</th>}</tr></thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id}>
                  {config.row(item).map((value, index) => <td key={`${item.id}-${index}`}>{value}</td>)}
                  {resource === "products" && (
                    <td>
                      <button className="admin-table-action" onClick={() => updateProductStatus(item)}>
                        {item.status === "active" ? "Desactiver" : "Activer"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function ReportsContent({ api, role }) {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/admin/reports").then(({ data: response }) => setData(response)); }, []);
  const stats = data?.stats || {};
  const cards = [
    [Users, "Vendeurs", stats.sellers],
    [Boxes, "Produits actifs", stats.products],
    [Package, "Commandes", stats.orders],
    [Truck, "Livraisons actives", stats.active_deliveries],
    [CheckCircle2, "Livraisons terminées", stats.delivered],
    [AlertTriangle, "Échecs de livraison", stats.failed_deliveries],
  ];
  return (
    <div className="admin-flow">
      <AdminHeading eyebrow={`Rapports ${role}`} title="Performance marketplace" text="Indicateurs calculés directement depuis les données VinnHT." />
      <section className="admin-metric-grid">
        {cards.map(([Icon, label, value, currency]) => (
          <article key={label}>
            <span><Icon /></span><small>{label}</small>
            <strong>{currency ? money(value) : Number(value || 0).toLocaleString("fr-HT")}</strong>
            <p>Donnée actuelle</p>
          </article>
        ))}
      </section>
      <div className="admin-dashboard-columns">
        {role === "manager" && (
          <section className="admin-panel">
            <header><div><Store /><span><b>Activité des vendeurs</b><small>Indicateurs opérationnels sans données financières</small></span></div></header>
            <div className="admin-table-wrap"><table><thead><tr><th>Boutique</th><th>Produits actifs</th><th>Commandes</th><th>Ventes terminées</th></tr></thead><tbody>{(data.sellerActivity || []).map((seller) => <tr key={seller.seller_id}><td>{seller.seller_name}</td><td>{seller.active_products}</td><td>{seller.orders}</td><td>{seller.completed_sales}</td></tr>)}</tbody></table></div>
          </section>
        )}
        <section className="admin-panel admin-health-list">
          <header><div><Truck /><span><b>Santé des livraisons</b><small>Répartition actuelle</small></span></div></header>
          <div>{(data.deliveryHealth || []).map((item) => <p key={item.status}><Status value={item.status} /><b>{item.total}</b></p>)}</div>
        </section>
      </div>
    </div>
  );
}

export function OperationsDashboardContent({ api, role, user }) {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/admin/reports").then(({ data: response }) => setData(response)); }, []);
  const stats = data?.stats || {};
  const supervisor = role === "supervisor";
  const cards = supervisor
     ? [[Store, "Demandes en attente", stats.pending_requests], [Users, "Vendeurs", stats.sellers], [Boxes, "Produits actifs", stats.products], [Truck, "Livraisons actives", stats.active_deliveries]]
    : [[Store, "Vendeurs", stats.sellers], [Boxes, "Produits actifs", stats.products], [Package, "Commandes", stats.orders], [Truck, "Livraisons actives", stats.active_deliveries]];
  return (
    <div className="admin-flow">
      <AdminHeading eyebrow={supervisor ? "Controle operationnel" : "Pilotage strategique"} title={`Bonjour, ${user.name || role}`} text={supervisor ? "Suivez les demandes vendeurs et la sante quotidienne du reseau." : "Suivez l?activite des vendeurs, commandes et livraisons de VinnHT."}>
        <Link to={supervisor ? "/supervisor/seller-requests" : "/manager/sales-reports"}>{supervisor ? "Examiner les demandes" : "Ouvrir les rapports"} <ArrowRight /></Link>
      </AdminHeading>
      <section className="admin-metric-grid">{cards.map(([Icon, label, value, currency]) => <article key={label}><span><Icon /></span><small>{label}</small><strong>{currency ? money(value) : Number(value || 0).toLocaleString("fr-HT")}</strong><p>Donnée actuelle</p></article>)}</section>
      <div className="admin-dashboard-columns">
        <section className="admin-panel admin-health-list"><header><div><Store /><span><b>Demandes vendeurs</b><small>État des candidatures</small></span></div></header><div>{(data.requestHealth || []).map((item) => <p key={item.status}><Status value={item.status} /><b>{item.total}</b></p>)}</div></section>
        <section className="admin-panel admin-health-list"><header><div><Truck /><span><b>Livraisons</b><small>Suivi opérationnel</small></span></div></header><div>{(data.deliveryHealth || []).map((item) => <p key={item.status}><Status value={item.status} /><b>{item.total}</b></p>)}</div></section>
      </div>
    </div>
  );
}

export function StaffProfileContent({ api, user, updateUser, onLogout, role }) {
  return (
    <AdminProfileContent
      api={api}
      user={user}
      updateUser={updateUser}
      onLogout={onLogout}
      accountLabel={role}
    />
  );
}

export function StaffSettingsContent({ api, role }) {
  return <AdminSettingsContent api={api} role={role} />;
}

export function SellersOverviewContent({ api }) {
  const [shops, setShops] = useState([]);
  const [query, setQuery] = useState("");
  useEffect(() => { api.get("/shops").then(({ data }) => setShops(data)); }, []);
  const visible = shops.filter((shop) => JSON.stringify(shop).toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="admin-flow">
      <AdminHeading eyebrow="Réseau vendeurs" title="Boutiques actives" text="Analysez les boutiques, leur catalogue et leur réputation." />
      <label className="admin-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une boutique" /></label>
      <section className="admin-user-grid">
        {visible.map((shop) => (
          <article key={shop.seller_id}>
            <header>
              <span><Boxes /></span>
              <div><b>{shop.shop_name}</b><small>{shop.category || "Boutique VinnHT"}</small></div>
              <Status value="active" />
            </header>
            <div className="admin-shop-metrics">
              <span><b>{shop.product_count}</b><small>produits actifs</small></span>
              <span><b>{Number(shop.rating || 0).toFixed(1)}</b><small>note moyenne</small></span>
              <span><b>{shop.review_count}</b><small>avis vérifiés</small></span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
