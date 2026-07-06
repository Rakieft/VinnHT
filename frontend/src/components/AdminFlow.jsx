import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/admin-flow.css";
import {
  AlertTriangle,
  Apple,
  ArrowRight,
  Baby,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Boxes,
  Camera,
  Car,
  ChefHat,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Download,
  Dumbbell,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Gamepad2,
  Gem,
  Gift,
  Hammer,
  HeartPulse,
  ImageIcon,
  Laptop,
  Mail,
  MapPin,
  MessageCircle,
  Music,
  Package,
  PawPrint,
  Phone,
  Plane,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sofa,
  Sparkles,
  Store,
  TrendingUp,
  Trash2,
  Truck,
  UserPlus,
  Users,
  Wallet,
  Wheat,
  X,
} from "lucide-react";
import ProfilePhotoManager from "./ProfilePhotoManager.jsx";
import MobileProfileActions from "./MobileProfileActions.jsx";
import AccountSecuritySettings from "./AccountSecuritySettings.jsx";
import { assetUrl } from "../config/runtime.js";
import { productAttributeEntries } from "../config/productAttributes.js";

const money = (value) => `${Number(value || 0).toLocaleString("fr-HT")} HTG`;
const staffRoleOptions = [
  { value: "manager", label: "Manager opérations" },
  { value: "support", label: "Agent support" },
  { value: "finance", label: "Responsable finance" },
];
const shortDate = (value) =>
  value ? new Intl.DateTimeFormat("fr-HT", { dateStyle: "medium" }).format(new Date(value)) : "—";
const saturdayFor = (value = new Date()) => {
  const date = value instanceof Date ? new Date(value) : new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + ((6 - date.getDay() + 7) % 7));
  return date.toISOString().slice(0, 10);
};
const percentageChange = (current, previous) => {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);

  if (!previousValue) return currentValue ? 100 : 0;
  return Math.round(((currentValue - previousValue) / previousValue) * 100);
};

const categoryIconOptions = [
  { value: "shopping-basket", label: "Supermarché", icon: ShoppingBasket },
  { value: "apple", label: "Alimentation", icon: Apple },
  { value: "smartphone", label: "Électronique", icon: Smartphone },
  { value: "laptop", label: "Informatique", icon: Laptop },
  { value: "gamepad", label: "Jeux & consoles", icon: Gamepad2 },
  { value: "camera", label: "Photo & vidéo", icon: Camera },
  { value: "shirt", label: "Mode", icon: Shirt },
  { value: "gem", label: "Bijoux", icon: Gem },
  { value: "gift", label: "Cadeaux", icon: Gift },
  { value: "sofa", label: "Maison & meubles", icon: Sofa },
  { value: "hammer", label: "Outils", icon: Hammer },
  { value: "car", label: "Véhicules", icon: Car },
  { value: "building", label: "Immobilier", icon: Building2 },
  { value: "briefcase", label: "Services", icon: BriefcaseBusiness },
  { value: "book-open", label: "Éducation", icon: BookOpen },
  { value: "heart-pulse", label: "Santé", icon: HeartPulse },
  { value: "dumbbell", label: "Sport", icon: Dumbbell },
  { value: "music", label: "Musique", icon: Music },
  { value: "plane", label: "Voyage", icon: Plane },
  { value: "chef-hat", label: "Restaurants", icon: ChefHat },
  { value: "wheat", label: "Agriculture", icon: Wheat },
  { value: "paw-print", label: "Animaux", icon: PawPrint },
  { value: "baby", label: "Bébé & enfants", icon: Baby },
  { value: "sparkles", label: "Beauté & soins", icon: Sparkles },
  { value: "boxes", label: "Autres", icon: Boxes },
];

const categoryIconAliases = {
  "layout-grid": Boxes,
  basket: ShoppingBasket,
  cart: ShoppingBasket,
  phone: Smartphone,
  fashion: Shirt,
  home: Sofa,
  vehicle: Car,
  realty: Building2,
  service: BriefcaseBusiness,
  badge: BriefcaseBusiness,
  agriculture: Wheat,
  sprout: Wheat,
  animals: PawPrint,
  beauty: Sparkles,
  computer: Laptop,
  food: Apple,
  jewelry: Gem,
  tools: Hammer,
  education: BookOpen,
  health: HeartPulse,
  sport: Dumbbell,
  travel: Plane,
  restaurant: ChefHat,
  kids: Baby,
};

const inferCategoryIcon = (value = "") => {
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (/supermarche|alimentation|boisson/.test(normalized)) return "shopping-basket";
  if (/electronique|telephone|mobile/.test(normalized)) return "smartphone";
  if (/informatique|ordinateur|laptop/.test(normalized)) return "laptop";
  if (/jeu|console|gaming/.test(normalized)) return "gamepad";
  if (/photo|camera|video/.test(normalized)) return "camera";
  if (/mode|vetement|chaussure/.test(normalized)) return "shirt";
  if (/bijou|montre|luxe/.test(normalized)) return "gem";
  if (/cadeau|fete/.test(normalized)) return "gift";
  if (/maison|meuble|decoration/.test(normalized)) return "sofa";
  if (/outil|construction|bricolage/.test(normalized)) return "hammer";
  if (/vehicule|voiture|moto/.test(normalized)) return "car";
  if (/immobilier|terrain|maison-a-vendre/.test(normalized)) return "building";
  if (/service|emploi|travail/.test(normalized)) return "briefcase";
  if (/education|ecole|universite|livre/.test(normalized)) return "book-open";
  if (/sante|pharmacie|medical/.test(normalized)) return "heart-pulse";
  if (/sport|fitness|gym/.test(normalized)) return "dumbbell";
  if (/musique|instrument/.test(normalized)) return "music";
  if (/voyage|tourisme|hotel/.test(normalized)) return "plane";
  if (/restaurant|repas|cuisine/.test(normalized)) return "chef-hat";
  if (/agriculture|ferme|recolte/.test(normalized)) return "wheat";
  if (/animaux|animal/.test(normalized)) return "paw-print";
  if (/bebe|enfant|jouet/.test(normalized)) return "baby";
  if (/beaute|soin|cosmetique/.test(normalized)) return "sparkles";
  return "boxes";
};

const CategoryIcon = ({ category, size }) => {
  const selected = categoryIconOptions.find((option) => option.value === category.icon);
  const Icon =
    selected?.icon ||
    categoryIconAliases[category.icon] ||
    categoryIconOptions.find(
      (option) => option.value === inferCategoryIcon(`${category.name} ${category.slug}`),
    )?.icon ||
    Boxes;

  return <Icon size={size} />;
};

const statusLabel = {
  new: "Nouveau",
  in_progress: "En traitement",
  resolved: "Résolu",
  active: "Actif",
  suspended: "Suspendu",
  pending: "En attente",
  confirmed: "Confirmée",
  paid: "Payé",
  failed: "Échoué",
  refunded: "Remboursé",
  processing: "Traitement",
  shipped: "Expédiée",
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

export function AdminDashboardContent({ api, user }) {
  const [data, setData] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [reportEnding, setReportEnding] = useState(saturdayFor);
  const [chartRange, setChartRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [{ data: response }, { data: report }] = await Promise.all([
        api.get("/admin/dashboard", { params: { range: chartRange } }),
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
  }, [reportEnding, chartRange]);

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
  const dailySales = data?.dailySales || [];
  const paymentHealth = data?.paymentHealth || [];
  const orderHealth = data?.orderHealth || [];
  const topShops = data?.topShops || [];
  const deliveryHealth = data?.deliveryHealth || [];
  const reportPeriod = weeklyReport?.period || {
    start: reportEnding,
    end: reportEnding,
  };
  const reportTotals = weeklyReport?.totals || {};
  const ordersTrend = percentageChange(stats.orders_week, stats.orders_previous_week);
  const salesTrend = percentageChange(stats.paid_week, stats.paid_previous_week);
  const cards = [
    {
      icon: Store,
      label: "Vendeurs actifs",
      value: stats.sellers,
      detail: "Boutiques autorisées sur VinnHT",
    },
    {
      icon: Boxes,
      label: "Produits publiés",
      value: stats.active_products,
      detail: `${stats.out_of_stock_products || 0} actuellement épuisé(s)`,
    },
    {
      icon: Package,
      label: "Commandes cette semaine",
      value: stats.orders_week,
      detail: `${ordersTrend >= 0 ? "+" : ""}${ordersTrend}% vs semaine précédente`,
      trend: ordersTrend,
    },
    {
      icon: CircleDollarSign,
      label: "Volume total des ventes",
      value: stats.paid_volume,
      detail: `${salesTrend >= 0 ? "+" : ""}${salesTrend}% cette semaine`,
      trend: salesTrend,
      currency: true,
    },
    {
      icon: CreditCard,
      label: "Paiements à vérifier",
      value: Number(stats.pending_payments || 0) + Number(stats.failed_payments || 0),
      detail: `${stats.failed_payments || 0} paiement(s) en échec`,
      attention: true,
    },
    {
      icon: Truck,
      label: "Livraisons en cours",
      value: stats.active_deliveries,
      detail: `${stats.unassigned_deliveries || 0} sans livreur`,
    },
  ];
  const alerts = [
    {
      icon: ShieldCheck,
      label: "Demandes vendeurs",
      value: stats.pending_seller_requests || 0,
      text: "demandes attendent une décision",
      link: "/manager/seller-requests",
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
      icon: Users,
      label: "Comptes suspendus",
      value: stats.suspended_users || 0,
      text: "comptes actuellement restreints",
      link: "/admin/users",
      tone: "red",
    },
  ];
  const quickLinks = [
    [Users, "Gérer les utilisateurs", "/admin/users"],
    [Boxes, "Contrôler les produits", "/admin/products"],
    [CreditCard, "Vérifier les paiements", "/admin/payments"],
    [FileText, "Rapport hebdomadaire", "#weekly-report"],
    [FileText, "Suivre la progression", "/admin#weekly-report"],
    [Store, "Suivre les boutiques", "/admin/users"],
    [Truck, "Coordonner les livraisons", "/manager/deliveries"],
  ];
  const maxDailySale = Math.max(
    1,
    ...dailySales.map((item) => Number(item.total || 0))
  );
  const orderTotal = orderHealth.reduce((total, item) => total + Number(item.total || 0), 0);
  const currentDate = new Intl.DateTimeFormat("fr-HT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const chartLabel = (value) =>
    new Intl.DateTimeFormat("fr-HT", chartRange === "12m"
      ? { month: "short" }
      : { day: "2-digit", month: "short" }).format(new Date(`${String(value).slice(0, 10)}T12:00:00`));

  return (
    <div className="admin-flow">
      <AdminHeading
        eyebrow="Centre de pilotage VinnHT"
        title={`Bonjour, ${user?.name || "Administrateur"}`}
        text={`Vue consolidée de la marketplace · ${currentDate}`}
      >
        <div className="admin-heading-actions">
          <button className="secondary" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? "spinning" : ""} />
            {loading ? "Actualisation..." : "Actualiser"}
          </button>
          <button onClick={downloadWeeklyReport} disabled={!weeklyReport || downloadingReport}>
            <Download />
            {downloadingReport ? "Génération..." : "Télécharger le rapport"}
          </button>
        </div>
      </AdminHeading>
      {error && <div className="admin-error">{error}</div>}
      <section className="admin-metric-grid">
        {cards.map(({ icon: Icon, label, value, detail, currency, trend, attention }) => (
          <article className={attention ? "attention" : ""} key={label}>
            <span>
              <Icon />
            </span>
            <small>{label}</small>
            <strong>{currency ? money(value) : Number(value || 0).toLocaleString("fr-HT")}</strong>
            <p className={trend < 0 ? "negative" : trend > 0 ? "positive" : ""}>{detail}</p>
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
            <div className="admin-chart-controls">
              {[
                ["7d", "7 jours"],
                ["30d", "30 jours"],
                ["12m", "Cette année"],
              ].map(([value, label]) => (
                <button
                  className={chartRange === value ? "active" : ""}
                  onClick={() => setChartRange(value)}
                  key={value}
                >
                  {label}
                </button>
              ))}
            </div>
          </header>
          <div className="admin-sales-chart">
            {dailySales.map((item) => (
              <article key={item.sale_date}>
                <span>
                  <i
                    style={{
                      height: `${Math.max(8, (Number(item.total) / maxDailySale) * 100)}%`,
                    }}
                  />
                </span>
                <small>{chartLabel(item.sale_date)}</small>
                <b>{money(item.total)}</b>
              </article>
            ))}
            {!dailySales.length && (
              <div className="admin-empty">Aucun paiement confirmé durant les sept derniers jours.</div>
            )}
          </div>
        </section>

        <section className="admin-panel admin-order-progress">
          <header>
            <div>
              <Package />
              <span>
                <b>Suivi des commandes</b>
                <small>{orderTotal} commande(s) enregistrée(s)</small>
              </span>
            </div>
          </header>
          <div>
            {orderHealth.map((item) => {
              const percentage = orderTotal
                ? Math.round((Number(item.total) / orderTotal) * 100)
                : 0;
              return (
                <article key={item.status}>
                  <p>
                    <Status value={item.status} />
                    <b>{item.total}</b>
                    <small>{percentage}%</small>
                  </p>
                  <span><i style={{ width: `${percentage}%` }} /></span>
                </article>
              );
            })}
            {!orderHealth.length && <div className="admin-empty">Aucune commande enregistrée.</div>}
          </div>
        </section>
      </div>

      <div className="admin-dashboard-columns admin-commerce-columns">
        <section className="admin-panel admin-top-shops">
          <header>
            <div>
              <Store />
              <span>
                <b>Boutiques de la semaine</b>
                <small>Classement basé sur les ventes réellement enregistrées</small>
              </span>
            </div>
            <Link to="/admin/users">Voir les vendeurs <ArrowRight /></Link>
          </header>
          <div>
            {topShops.map((shop, index) => (
              <article key={shop.seller_id}>
                <strong>#{index + 1}</strong>
                <span className="admin-shop-logo">
                  {shop.shop_logo_url ? (
                    <img src={assetUrl(shop.shop_logo_url)} alt="" />
                  ) : (
                    <Store />
                  )}
                </span>
                <p>
                  <b>{shop.shop_name}</b>
                  <small>{shop.sponsored ? "Campagne de visibilité active" : "Visibilité standard"}</small>
                </p>
                <span><b>{shop.orders}</b><small>commandes</small></span>
                <span><b>{shop.products_sold}</b><small>articles</small></span>
                <span><b>{money(shop.sales)}</b><small>ventes</small></span>
              </article>
            ))}
            {!topShops.length && <div className="admin-empty">Aucune vente boutique cette semaine.</div>}
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
              {paymentHealth.map((item) => (
                <p key={item.status}>
                  <Status value={item.status} />
                  <b>{item.total}</b>
                  <small>{money(item.amount)}</small>
                </p>
              ))}
            </div>
            <div>
              <h3>Livraisons</h3>
              {deliveryHealth.map((item) => (
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
                {shortDate(reportPeriod.start)} au {shortDate(reportPeriod.end)}
              </b>
            </span>
            <p>
              Le PDF contient tous les marchands ayant réalisé une vente payée, leurs commandes,
              les produits vendus, les quantités et les montants.
            </p>
          </div>
          <div className="admin-report-metrics">
            {[
              ["Marchands", reportTotals.merchants || 0],
              ["Commandes marchands", reportTotals.orders || 0],
              ["Ventes globales", money(reportTotals.grossSales)],
              ["Commission VinnHT", money(reportTotals.commission)],
              ["Net vendeurs", money(reportTotals.netSales)],
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

      </div>
    </div>
  );
}

export function AdminUsersContent({ api, currentUser }) {
  const [sellers, setSellers] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [catalogFilter, setCatalogFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyUser, setBusyUser] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellerDetail, setSellerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "manager",
  });
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [sponsorship, setSponsorship] = useState({
    amount: "",
    paymentReference: "",
    adminNote: "",
    startsAt: new Date().toISOString().slice(0, 10),
    endsAt: "",
  });

  const load = () => {
    setError("");
    return api
      .get("/admin/sellers", {
        params: {
          q: query.trim() || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          visibility: visibilityFilter === "all" ? undefined : visibilityFilter,
          catalog: catalogFilter === "all" ? undefined : catalogFilter,
          page: pagination.page,
          limit: 12,
        },
      })
      .then(({ data }) => {
        setSellers(data.items || []);
        setSummary(data.summary || {});
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
      })
      .catch((requestError) =>
        setError(requestError.response?.data?.message || "Impossible de charger les vendeurs.")
      );
  };

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [query, statusFilter, visibilityFilter, catalogFilter, pagination.page]);

  const resetPage = (setter) => (event) => {
    setter(event.target.value);
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const updateStatus = async (seller) => {
    const nextStatus = seller.status === "active" ? "suspended" : "active";
    const action = nextStatus === "suspended" ? "suspendre" : "réactiver";
    if (!window.confirm(`Confirmer : ${action} la boutique ${seller.shop_name} ?`)) return;
    setBusyUser(seller.id);
    setMessage("");
    setError("");
    try {
      const { data } = await api.patch(`/admin/users/${seller.id}/status`, {
        status: nextStatus,
      });
      setMessage(data.message);
      load();
      if (sellerDetail?.seller?.id === seller.id) {
        setSellerDetail((current) => ({
          ...current,
          seller: { ...current.seller, status: nextStatus },
        }));
      }
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
        role: "manager",
      });
      setShowStaffForm(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de créer ce compte.");
    } finally {
      setCreatingStaff(false);
    }
  };

  const openSellerDetail = async (seller) => {
    setDetailLoading(true);
    setSellerDetail({ seller, products: [], campaigns: [], auditHistory: [] });
    try {
      const { data } = await api.get(`/admin/sellers/${seller.id}`);
      setSellerDetail(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible d’ouvrir cette boutique.");
      setSellerDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const openCampaign = (seller) => {
    const end = new Date();
    end.setDate(end.getDate() + 30);
    setSelectedSeller(seller);
    setSponsorship({
      amount: seller.sponsorship_amount || "",
      paymentReference: "",
      adminNote: "",
      startsAt: new Date().toISOString().slice(0, 10),
      endsAt: end.toISOString().slice(0, 10),
    });
  };
  const saveCampaign = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
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
    if (!window.confirm(`Arrêter la visibilité payée de ${user.shop_name} ?`)) return;
    const { data } = await api.patch(`/admin/sellers/${user.id}/sponsorship/cancel`);
    setMessage(data.message);
    load();
  };

  return (
    <div className="admin-flow">
      <AdminHeading
        eyebrow="Réseau marchand"
        title="Vendeurs VinnHT"
        text="Contrôlez les boutiques, leur catalogue, leur réputation et leur visibilité."
      >
        <div className="admin-heading-actions">
          <button className="secondary" onClick={() => setShowStaffForm((current) => !current)}>
            <UserPlus /> {showStaffForm ? "Fermer" : "Créer un membre"}
          </button>
          <button onClick={load}><RefreshCw /> Actualiser</button>
        </div>
      </AdminHeading>
      {message && <div className="admin-message">{message}</div>}
      {error && <div className="admin-error">{error}</div>}
      {showStaffForm && <form className="admin-staff-create-form" onSubmit={createStaff}>
        <header>
          <span><UserPlus /></span>
          <div>
            <small>Équipe opérationnelle</small>
            <h2>Créer un compte équipe</h2>
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
            {staffRoleOptions.map((role) => (
              <option value={role.value} key={role.value}>{role.label}</option>
            ))}
          </select>
        </label>
        <label className="full">
          Mot de passe initial
          <input required minLength="10" type="password" value={staffForm.password} onChange={(event) => setStaffForm({ ...staffForm, password: event.target.value })} />
        </label>
        <button disabled={creatingStaff}>
          <UserPlus /> {creatingStaff ? "Création..." : "Créer le compte"}
        </button>
      </form>}
      <section className="admin-user-summary">
        {[
          [Store, "Vendeurs", summary.sellers],
          [CheckCircle2, "Actifs", summary.active_sellers],
          [AlertTriangle, "Suspendus", summary.suspended_sellers],
          [TrendingUp, "Sponsorisé(s)", summary.sponsored_sellers],
          [Boxes, "Sans produit", summary.sellers_without_products],
        ].map(([Icon, label, value]) => (
          <article key={label}>
            <Icon />
            <span><small>{label}</small><b>{Number(value || 0).toLocaleString("fr-HT")}</b></span>
          </article>
        ))}
      </section>
      <section className="admin-seller-filters">
        <label className="admin-search">
          <Search />
          <input
            value={query}
            onChange={resetPage(setQuery)}
            placeholder="Boutique, propriétaire, téléphone, email ou catégorie"
          />
        </label>
        <select value={statusFilter} onChange={resetPage(setStatusFilter)}>
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="suspended">Suspendus</option>
        </select>
        <select value={visibilityFilter} onChange={resetPage(setVisibilityFilter)}>
          <option value="all">Toute visibilité</option>
          <option value="sponsored">Sponsorisés</option>
          <option value="standard">Classement naturel</option>
        </select>
        <select value={catalogFilter} onChange={resetPage(setCatalogFilter)}>
          <option value="all">Tous les catalogues</option>
          <option value="with_products">Avec produits</option>
          <option value="without_products">Sans produit</option>
        </select>
      </section>
      <div className="admin-results-count">
        {pagination.total} vendeur(s) correspondant aux filtres
      </div>
      <section className="admin-seller-grid">
        {sellers.map((seller) => (
          <article className={`${seller.status === "suspended" ? "suspended" : ""} ${seller.sponsored ? "sponsored" : ""}`} key={seller.id}>
            <header>
              <span className="admin-seller-logo">
                {seller.shop_logo_url ? (
                  <img src={assetUrl(seller.shop_logo_url)} alt={`Logo ${seller.shop_name}`} />
                ) : (
                  <Store />
                )}
              </span>
              <div>
                <small>{seller.category || "Boutique VinnHT"}</small>
                <h3>{seller.shop_name}</h3>
                <p>{seller.owner_name}</p>
              </div>
              <Status value={seller.status} />
            </header>
            <div className="admin-seller-contact">
              <span><Mail /> {seller.email}</span>
              <span><Phone /> {seller.whatsapp || seller.phone || "Non renseigné"}</span>
              <span><MapPin /> {seller.pickup_address || "Adresse non renseignée"}</span>
            </div>
            <div className="admin-seller-metrics">
              <span><b>{seller.active_product_count || 0}</b><small>produits actifs</small></span>
              <span><b>{seller.order_count || 0}</b><small>commandes</small></span>
              <span><b>{money(seller.sales_volume)}</b><small>volume ventes</small></span>
              <span><b>{Number(seller.rating || 0).toFixed(1)}</b><small>{seller.review_count || 0} avis</small></span>
            </div>
            <div className="admin-sponsor-mini">
              <TrendingUp />
              <span>
                <b>{seller.sponsored ? "Visibilité payée active" : "Classement naturel"}</b>
                <small>
                  {seller.sponsored
                    ? `Jusqu'au ${shortDate(seller.sponsorship_ends_at)}`
                    : seller.sponsorship_status
                      ? `Dernier statut : ${seller.sponsorship_status}`
                      : "Aucune campagne validée"}
                </small>
              </span>
              {seller.sponsorship_payment_reference && (
                <em>Réf. {seller.sponsorship_payment_reference}</em>
              )}
            </div>
            <footer>
              <button className="secondary" onClick={() => openSellerDetail(seller)}>
                <Eye /> Voir la fiche
              </button>
              <Link to={`/shops/${seller.id}`} target="_blank"><ExternalLink /> Boutique</Link>
              <button
                className={seller.sponsored ? "gold" : ""}
                onClick={() => seller.sponsored ? cancelCampaign(seller) : openCampaign(seller)}
              >
                <TrendingUp /> {seller.sponsored ? "Arrêter promo" : "Promouvoir"}
              </button>
            </footer>
          </article>
        ))}
      </section>
      {!sellers.length && <div className="admin-empty">Aucun vendeur ne correspond aux filtres.</div>}
      {pagination.pages > 1 && (
        <nav className="admin-pagination" aria-label="Pagination vendeurs">
          <button
            disabled={pagination.page <= 1}
            onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}
          >
            <ChevronLeft /> Précédent
          </button>
          <span>Page {pagination.page} sur {pagination.pages}</span>
          <button
            disabled={pagination.page >= pagination.pages}
            onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
          >
            Suivant <ChevronRight />
          </button>
        </nav>
      )}
      {selectedSeller && (
        <form className="admin-sponsor-form" onSubmit={saveCampaign}>
          <header><TrendingUp /><div><small>Campagne vendeur payée</small><h2>Promouvoir {selectedSeller.shop_name}</h2><p>Seul l’admin peut valider une visibilité après confirmation du paiement. Tous les produits actifs de cette boutique passeront avant les résultats naturels.</p></div><button type="button" onClick={() => setSelectedSeller(null)}>×</button></header>
          <label>Montant payé (HTG)<input required type="number" min="1" value={sponsorship.amount} onChange={(event) => setSponsorship({ ...sponsorship, amount: event.target.value })} /></label>
          <label>Référence paiement<input required minLength="3" value={sponsorship.paymentReference} onChange={(event) => setSponsorship({ ...sponsorship, paymentReference: event.target.value })} placeholder="Ex. MonCash-458921" /></label>
          <label>Date de début<input required type="date" value={sponsorship.startsAt} onChange={(event) => setSponsorship({ ...sponsorship, startsAt: event.target.value })} /></label>
          <label>Date de fin<input required type="date" value={sponsorship.endsAt} onChange={(event) => setSponsorship({ ...sponsorship, endsAt: event.target.value })} /></label>
          <label className="full">Note admin<textarea rows="3" value={sponsorship.adminNote} onChange={(event) => setSponsorship({ ...sponsorship, adminNote: event.target.value })} placeholder="Ex. Paiement vérifié sur le compte VinnHT." /></label>
          <button>Valider le paiement et promouvoir</button>
        </form>
      )}
      {sellerDetail && (
        <aside className="admin-detail-drawer" aria-label="Fiche vendeur">
          <header>
            <div>
              <span className="admin-seller-logo">
                {sellerDetail.seller.shop_logo_url ? (
                  <img src={assetUrl(sellerDetail.seller.shop_logo_url)} alt="" />
                ) : <Store />}
              </span>
              <div><small>Fiche vendeur</small><h2>{sellerDetail.seller.shop_name}</h2></div>
            </div>
            <button onClick={() => setSellerDetail(null)} aria-label="Fermer"><X /></button>
          </header>
          {detailLoading ? (
            <div className="admin-empty">Chargement de la boutique...</div>
          ) : (
            <div className="admin-detail-content">
              <section className="admin-detail-identity">
                <Status value={sellerDetail.seller.status} />
                <p>{sellerDetail.seller.description || "Aucune description fournie."}</p>
                <span><b>Propriétaire</b>{sellerDetail.seller.owner_name}</span>
                <span><b>Email</b>{sellerDetail.seller.email}</span>
                <span><b>WhatsApp</b>{sellerDetail.seller.whatsapp || sellerDetail.seller.phone || "Non renseigné"}</span>
                <span><b>Adresse</b>{sellerDetail.seller.pickup_address || "Non renseignée"}</span>
                <span><b>Ouverture</b>{sellerDetail.seller.opening_hours || "Non renseignée"}</span>
              </section>
              <section className="admin-detail-metrics">
                <span><b>{sellerDetail.seller.active_product_count}</b><small>produits actifs</small></span>
                <span><b>{sellerDetail.seller.order_count}</b><small>commandes</small></span>
                <span><b>{money(sellerDetail.seller.sales_volume)}</b><small>ventes</small></span>
                <span><b>{Number(sellerDetail.seller.rating || 0).toFixed(1)}</b><small>note</small></span>
              </section>
              <section>
                <h3>Produits récents</h3>
                <div className="admin-detail-list">
                  {sellerDetail.products.map((product) => (
                    <article key={product.id}>
                      <span>{product.image_url ? <img src={assetUrl(product.image_url)} alt="" /> : <Boxes />}</span>
                      <p><b>{product.name}</b><small>{product.category_name} · {product.stock} en stock</small></p>
                      <Status value={product.status} />
                    </article>
                  ))}
                  {!sellerDetail.products.length && <div className="admin-empty">Aucun produit.</div>}
                </div>
              </section>
              <section>
                <h3>Campagnes de visibilité</h3>
                <div className="admin-detail-history">
                  {sellerDetail.campaigns.map((campaign) => (
                    <p key={campaign.id}>
                      <b>{money(campaign.amount)} · {campaign.status}</b>
                      <small>
                        {shortDate(campaign.starts_at)} - {shortDate(campaign.ends_at)}
                        {campaign.payment_reference ? ` · Réf. ${campaign.payment_reference}` : ""}
                        {campaign.approved_by_name ? ` · Validée par ${campaign.approved_by_name}` : ""}
                      </small>
                      {campaign.admin_note && <small>{campaign.admin_note}</small>}
                    </p>
                  ))}
                  {!sellerDetail.campaigns.length && <small>Aucune campagne enregistrée.</small>}
                </div>
              </section>
              <section>
                <h3>Historique administratif</h3>
                <div className="admin-detail-history">
                  {sellerDetail.auditHistory.map((item) => (
                    <p key={item.id}><b>{item.action}</b><small>{item.actor_name || "Système"} · {shortDate(item.created_at)}</small></p>
                  ))}
                  {!sellerDetail.auditHistory.length && <small>Aucune action enregistrée.</small>}
                </div>
              </section>
              <footer>
                <a href={`mailto:${sellerDetail.seller.email}`}><Mail /> Contacter</a>
                <button
                  className="danger"
                  disabled={busyUser === sellerDetail.seller.id || sellerDetail.seller.id === currentUser?.id}
                  onClick={() => updateStatus(sellerDetail.seller)}
                >
                  {sellerDetail.seller.status === "active" ? "Suspendre" : "Réactiver"}
                </button>
              </footer>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

export function AdminCategoriesContent({ api }) {
  const empty = { name: "", slug: "", icon: "boxes" };
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
      icon: categoryIconOptions.some((option) => option.value === category.icon)
        ? category.icon
        : inferCategoryIcon(`${category.name} ${category.slug}`),
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
          [Package, "Produits associés", totals.products],
          [CheckCircle2, "Produits actifs", totals.active],
          [AlertTriangle, "Produits épuisés", totals.outOfStock],
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
              <h2>{editing ? "Modifier la catégorie" : "Créer une catégorie"}</h2>
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
                  icon: editing ? form.icon : inferCategoryIcon(name),
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
          <section className="admin-category-icon-library" aria-label="Bibliothèque d’icônes">
            <div>
              <small>Bibliothèque d’icônes</small>
              <b>Choisissez le symbole du rayon</b>
            </div>
            <div className="admin-category-icon-grid">
              {categoryIconOptions.map(({ value, label, icon: Icon }) => (
                <button
                  type="button"
                  className={form.icon === value ? "active" : ""}
                  key={value}
                  onClick={() => setForm({ ...form, icon: value })}
                  title={label}
                  aria-label={`Utiliser l’icône ${label}`}
                >
                  <Icon />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </section>
          <div className="admin-category-icon-preview">
            <span><CategoryIcon category={form} /></span>
            <div>
              <small>Aperçu de l’icône</small>
              <b>{categoryIconOptions.find((option) => option.value === form.icon)?.label || "Autres"}</b>
            </div>
          </div>
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
                  <span><CategoryIcon category={category} /></span>
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
  const [summary, setSummary] = useState({});
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [promotionFilter, setPromotionFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = () => {
    setError("");
    return api
      .get("/admin/products", {
        params: {
          q: query.trim() || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          stock: stockFilter === "all" ? undefined : stockFilter,
          promotion: promotionFilter === "active" ? "active" : undefined,
          department: departmentFilter === "all" ? undefined : departmentFilter,
          categoryId: categoryFilter === "all" ? undefined : categoryFilter,
          page: pagination.page,
          limit: 16,
        },
      })
      .then(({ data }) => {
        setProducts(data.items || []);
        setSummary(data.summary || {});
        setCategories(data.categories || []);
        setDepartments(data.departments || []);
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
        setSelectedIds([]);
      })
      .catch((requestError) =>
        setError(requestError.response?.data?.message || "Impossible de charger les produits.")
      );
  };
  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [
    query,
    statusFilter,
    stockFilter,
    promotionFilter,
    departmentFilter,
    categoryFilter,
    pagination.page,
  ]);

  const resetPage = (setter) => (event) => {
    setter(event.target.value);
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const updateStatus = async (product) => {
    setBusy(true);
    setError("");
    const status = product.status === "active" ? "inactive" : "active";
    try {
      const { data } = await api.patch(`/admin/products/${product.id}/status`, { status });
      setMessage(data.message);
      await load();
      if (selectedProduct?.product?.id === product.id) {
        setSelectedProduct((current) => ({
          ...current,
          product: { ...current.product, status },
        }));
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de modifier ce produit.");
    } finally {
      setBusy(false);
    }
  };

  const updateSelected = async (status) => {
    if (!selectedIds.length) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.patch("/admin/products/status", {
        ids: selectedIds,
        status,
      });
      setMessage(data.message);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de traiter la sélection.");
    } finally {
      setBusy(false);
    }
  };

  const openProduct = async (product) => {
    setDetailLoading(true);
    setSelectedProduct({ product, images: [], auditHistory: [] });
    try {
      const { data } = await api.get(`/admin/products/${product.id}`);
      setSelectedProduct(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible d’ouvrir ce produit.");
      setSelectedProduct(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleSelected = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  };

  const promotionIsActive = (product) =>
    product.is_featured &&
    Number(product.promotional_price) > 0 &&
    Number(product.promotional_price) < Number(product.price) &&
    (!product.offer_ends_at || new Date(product.offer_ends_at) > new Date());

  return (
    <div className="admin-flow">
      <AdminHeading
        eyebrow="Catalogue marketplace"
        title="Produits"
        text="Modérez le catalogue, surveillez les stocks et contrôlez la visibilité des produits."
      >
        <button onClick={load}><RefreshCw /> Actualiser</button>
      </AdminHeading>
      {message && <div className="admin-message">{message}</div>}
      {error && <div className="admin-error">{error}</div>}
      <section className="admin-category-summary">
        {[
          [Boxes, "Produits", summary.products],
          [CheckCircle2, "Actifs", summary.active_products],
          [AlertTriangle, "Stock faible", summary.low_stock],
          [Package, "Épuisés", summary.out_of_stock],
          [Store, "Vendeurs", summary.sellers],
        ].map(([Icon, label, value]) => (
          <article key={label}><Icon /><span><small>{label}</small><b>{Number(value || 0).toLocaleString("fr-HT")}</b></span></article>
        ))}
      </section>
      <section className="admin-product-filters">
        <label className="admin-search">
          <Search />
          <input value={query} onChange={resetPage(setQuery)} placeholder="Produit, boutique, catégorie, ville ou département" />
        </label>
        <select value={statusFilter} onChange={resetPage(setStatusFilter)}>
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
          <option value="draft">Brouillons</option>
        </select>
        <select value={stockFilter} onChange={resetPage(setStockFilter)}>
          <option value="all">Tous les stocks</option>
          <option value="available">Disponible</option>
          <option value="low">Stock faible</option>
          <option value="out">Épuisé</option>
        </select>
        <select value={categoryFilter} onChange={resetPage(setCategoryFilter)}>
          <option value="all">Toutes catégories</option>
          {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
        </select>
        <select value={departmentFilter} onChange={resetPage(setDepartmentFilter)}>
          <option value="all">Tous départements</option>
          {departments.map((department) => <option value={department} key={department}>{department}</option>)}
        </select>
        <select value={promotionFilter} onChange={resetPage(setPromotionFilter)}>
          <option value="all">Tous les produits</option>
          <option value="active">En promotion</option>
        </select>
      </section>
      <div className="admin-products-toolbar">
        <span>{pagination.total} produit(s) correspondant aux filtres</span>
        {selectedIds.length > 0 && (
          <div>
            <b>{selectedIds.length} sélectionné(s)</b>
            <button disabled={busy} onClick={() => updateSelected("active")}>Activer</button>
            <button className="danger" disabled={busy} onClick={() => updateSelected("inactive")}>Désactiver</button>
          </div>
        )}
      </div>
      <section className="admin-product-grid">
        {products.map((product) => {
          const promoted = promotionIsActive(product);
          const outOfStock = Number(product.stock || 0) <= 0;
          return (
            <article
              className={[
                selectedIds.includes(product.id) ? "selected" : "",
                promoted ? "promoted" : "",
                outOfStock ? "out-of-stock" : "",
              ].filter(Boolean).join(" ")}
              key={product.id}
            >
              <label className="admin-product-select">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(product.id)}
                  onChange={() => toggleSelected(product.id)}
                />
                <span />
              </label>
              <div className="admin-product-image">
                {product.image_url ? (
                  <img
                    src={assetUrl(product.image_url)}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <ImageIcon />
                )}
                <span className="admin-product-category">{product.category_name}</span>
                {promoted && <b><Sparkles /> Offre active</b>}
              </div>
              <div className="admin-product-card-body">
                <header>
                  <div>
                    <h3>{product.name}</h3>
                    <p className="admin-product-seller">
                      <span>
                        {product.seller_logo_url ? (
                          <img src={assetUrl(product.seller_logo_url)} alt="" />
                        ) : (
                          <Store />
                        )}
                      </span>
                      <b>{product.seller_name}</b>
                    </p>
                  </div>
                  <Status value={product.status} />
                </header>
                <p className="admin-product-location">
                  <MapPin /> {product.city || "Haïti"}, {product.department || "Non précisé"}
                </p>
              </div>
              <div className="admin-product-numbers">
                <span>
                  <small>{promoted ? "Prix offre" : "Prix"}</small>
                  <b>{money(promoted ? product.promotional_price : product.price)}</b>
                  {promoted && <em>{money(product.price)}</em>}
                </span>
                <span className={Number(product.stock) <= 5 ? "warning" : ""}>
                  <small>Stock</small>
                  <b>{outOfStock ? "Épuisé" : product.stock}</b>
                </span>
              </div>
              <footer>
                <button className="secondary" onClick={() => openProduct(product)}><Eye /> Aperçu</button>
                <Link to={`/products/${product.id}`} target="_blank"><ExternalLink /> Public</Link>
                <button disabled={busy} onClick={() => updateStatus(product)}>{product.status === "active" ? "Désactiver" : "Activer"}</button>
              </footer>
            </article>
          );
        })}
      </section>
      {!products.length && <div className="admin-empty">Aucun produit ne correspond aux filtres.</div>}
      {pagination.pages > 1 && (
        <nav className="admin-pagination" aria-label="Pagination produits">
          <button
            disabled={pagination.page <= 1}
            onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}
          >
            <ChevronLeft /> Précédent
          </button>
          <span>Page {pagination.page} sur {pagination.pages}</span>
          <button
            disabled={pagination.page >= pagination.pages}
            onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
          >
            Suivant <ChevronRight />
          </button>
        </nav>
      )}
      {selectedProduct && (
        <aside className="admin-detail-drawer" aria-label="Aperçu produit">
          <header>
            <div>
              <span className="admin-seller-logo"><Package /></span>
              <div><small>Contrôle catalogue</small><h2>{selectedProduct.product.name}</h2></div>
            </div>
            <button onClick={() => setSelectedProduct(null)} aria-label="Fermer"><X /></button>
          </header>
          {detailLoading ? (
            <div className="admin-empty">Chargement du produit...</div>
          ) : (
            <div className="admin-detail-content">
              <div className="admin-product-preview-image">
                {selectedProduct.product.image_url ? (
                  <img src={assetUrl(selectedProduct.product.image_url)} alt="" />
                ) : <ImageIcon />}
              </div>
              <section className="admin-detail-identity">
                <Status value={selectedProduct.product.status} />
                <p>{selectedProduct.product.description || "Aucune description fournie."}</p>
                <span><b>Boutique</b>{selectedProduct.product.seller_name}</span>
                <span><b>Catégorie</b>{selectedProduct.product.category_name}</span>
                <span><b>Localisation</b>{selectedProduct.product.city || "Haïti"}, {selectedProduct.product.department || "Non précisé"}</span>
                <span><b>Prix</b>{money(selectedProduct.product.price)}</span>
                <span><b>Stock</b>{selectedProduct.product.stock}</span>
                {productAttributeEntries(selectedProduct.product).map((attribute) => (
                  <span key={attribute.key}>
                    <b>{attribute.label}</b>
                    {attribute.value}
                  </span>
                ))}
              </section>
              {selectedProduct.images.length > 1 && (
                <section>
                  <h3>Galerie</h3>
                  <div className="admin-product-preview-gallery">
                    {selectedProduct.images.map((image) => (
                      <img src={assetUrl(image.image_url)} alt="" key={image.id} />
                    ))}
                  </div>
                </section>
              )}
              <section>
                <h3>Historique de modération</h3>
                <div className="admin-detail-history">
                  {selectedProduct.auditHistory.map((item) => (
                    <p key={item.id}><b>{item.action}</b><small>{item.actor_name || "Système"} · {shortDate(item.created_at)}</small></p>
                  ))}
                  {!selectedProduct.auditHistory.length && <small>Aucune action enregistrée.</small>}
                </div>
              </section>
              <footer>
                <Link to={`/products/${selectedProduct.product.id}`} target="_blank"><ExternalLink /> Voir la fiche publique</Link>
                <button className={selectedProduct.product.status === "active" ? "danger" : ""} onClick={() => updateStatus(selectedProduct.product)}>
                  {selectedProduct.product.status === "active" ? "Désactiver" : "Activer"}
                </button>
              </footer>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

export function AdminPaymentsContent({ api }) {
  const [payments, setPayments] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [center, setCenter] = useState({ stats: {}, paymentAccount: {} });
  const [activeTab, setActiveTab] = useState("proofs");
  const [statusFilter, setStatusFilter] = useState("review");
  const [query, setQuery] = useState("");
  const [rejectReasons, setRejectReasons] = useState({});
  const [payoutReferences, setPayoutReferences] = useState({});
  const [selectedProof, setSelectedProof] = useState(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const [{ data: paymentRows }, { data: payoutRows }, { data: centerData }] =
        await Promise.all([
          api.get("/admin/payments"),
          api.get("/admin/payouts"),
          api.get("/admin/payment-center"),
        ]);
      setPayments(paymentRows);
      setPayouts(payoutRows);
      setCenter(centerData);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Impossible de charger le centre de paiements.",
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  const validatePayment = async (payment) => {
    setBusy(`payment-${payment.order_id}`);
    setMessage("");
    setError("");
    try {
      const { data } = await api.patch(
        `/admin/payments/${payment.order_id}/validate`,
      );
      setMessage(data.message);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Validation impossible.");
    } finally {
      setBusy("");
    }
  };

  const rejectPayment = async (payment) => {
    const reason = String(rejectReasons[payment.id] || "").trim();
    if (reason.length < 8) {
      setError("Indiquez un motif de refus d’au moins 8 caractères.");
      return;
    }
    setBusy(`payment-${payment.order_id}`);
    setMessage("");
    setError("");
    try {
      const { data } = await api.patch(
        `/admin/payments/${payment.order_id}/reject`,
        { reason },
      );
      setMessage(data.message);
      setRejectReasons((current) => ({ ...current, [payment.id]: "" }));
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Refus impossible.");
    } finally {
      setBusy("");
    }
  };

  const markPayoutPaid = async (payout) => {
    const reference = String(payoutReferences[payout.id] || "").trim();
    if (reference.length < 3) {
      setError("Ajoutez la référence du transfert MonCash vendeur.");
      return;
    }
    setBusy(`payout-${payout.id}`);
    setMessage("");
    setError("");
    try {
      const { data } = await api.patch(`/admin/payouts/${payout.id}/paid`, {
        reference,
      });
      setMessage(data.message);
      setPayoutReferences((current) => ({ ...current, [payout.id]: "" }));
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Versement impossible.");
    } finally {
      setBusy("");
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const visiblePayments = payments.filter((payment) => {
    const matchesQuery = `${payment.order_number} ${payment.client_name} ${payment.seller_names}`
      .toLowerCase()
      .includes(normalizedQuery);
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "review"
          ? payment.proof_url && ["pending", "failed"].includes(payment.status)
          : payment.status === statusFilter;
    return matchesQuery && matchesStatus;
  });
  const visiblePayouts = payouts.filter((payout) =>
    `${payout.order_number} ${payout.seller_name}`
      .toLowerCase()
      .includes(normalizedQuery),
  );
  const stats = center.stats || {};

  return (
    <section className="admin-payments-page">
      <header className="admin-payments-hero">
        <div>
          <span>Paiement protégé VinnHT</span>
          <h1>Contrôlez les fonds sans perdre le fil.</h1>
          <p>
            VinnHT valide les paiements clients, bloque les parts vendeurs puis autorise
            leur versement uniquement après confirmation de réception.
          </p>
        </div>
        <aside>
          <ShieldCheck />
          <small>Compte MonCash VinnHT</small>
          <strong>{center.paymentAccount?.accountName || "VinnHT"}</strong>
          <b>{center.paymentAccount?.moncashNumber || "Numéro à configurer"}</b>
        </aside>
      </header>

      <div className="admin-payment-stats">
        {[
          [CreditCard, "Encaissé", stats.collected, "Paiements validés"],
          [ShieldCheck, "Fonds bloqués", stats.held_amount, "Réception attendue"],
          [Wallet, "À verser", stats.releasable_amount, "Réception confirmée"],
          [CheckCircle2, "Versé", stats.seller_paid, "Transferts terminés"],
        ].map(([Icon, label, value, note]) => (
          <article key={label}>
            <Icon />
            <small>{label}</small>
            <strong>{money(value)}</strong>
            <span>{note}</span>
          </article>
        ))}
      </div>

      {message && <div className="admin-feedback success">{message}</div>}
      {error && <div className="admin-feedback error">{error}</div>}

      <div className="admin-payment-toolbar">
        <nav>
          <button
            className={activeTab === "proofs" ? "active" : ""}
            onClick={() => setActiveTab("proofs")}
          >
            <CreditCard /> Preuves clients
          </button>
          <button
            className={activeTab === "payouts" ? "active" : ""}
            onClick={() => setActiveTab("payouts")}
          >
            <Wallet /> Versements vendeurs
          </button>
        </nav>
        <label>
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Commande, client ou boutique"
          />
        </label>
      </div>

      {activeTab === "proofs" ? (
        <>
          <div className="admin-payment-filters">
            {["review", "all", "pending", "paid", "failed"].map((status) => (
              <button
                className={statusFilter === status ? "active" : ""}
                onClick={() => setStatusFilter(status)}
                key={status}
              >
                {{
                  review: "À vérifier",
                  all: "Tous",
                  pending: "En attente",
                  paid: "Validés",
                  failed: "Refusés",
                }[status]}
              </button>
            ))}
          </div>
          <div className="admin-payment-list">
            {visiblePayments.map((payment) => (
              <article key={payment.id}>
                <header>
                  <div>
                    <small>{payment.order_number}</small>
                    <h3>{payment.client_name}</h3>
                    <p>{payment.seller_names || "Boutique VinnHT"}</p>
                  </div>
                  <Status value={payment.status} />
                </header>
                <div className="admin-payment-amount">
                  <span>Montant reçu</span>
                  <strong>{money(payment.amount)}</strong>
                  <small>{shortDate(payment.proof_submitted_at || payment.created_at)}</small>
                </div>
                {payment.proof_url ? (
                  <button
                    className="admin-proof-preview"
                    onClick={() => setSelectedProof(payment)}
                  >
                    <img src={assetUrl(payment.proof_url)} alt="Preuve MonCash" />
                    <span><Eye /> Examiner la preuve</span>
                  </button>
                ) : (
                  <div className="admin-proof-empty"><Clock3 /> Preuve client attendue</div>
                )}
                {payment.rejection_reason && (
                  <p className="admin-payment-rejection">
                    <AlertTriangle /> {payment.rejection_reason}
                  </p>
                )}
                {payment.proof_url && payment.status !== "paid" && (
                  <div className="admin-payment-review-actions">
                    <input
                      value={rejectReasons[payment.id] || ""}
                      onChange={(event) =>
                        setRejectReasons((current) => ({
                          ...current,
                          [payment.id]: event.target.value,
                        }))
                      }
                      placeholder="Motif uniquement si refus"
                    />
                    <button
                      className="reject"
                      disabled={busy === `payment-${payment.order_id}`}
                      onClick={() => rejectPayment(payment)}
                    >
                      <X /> Refuser
                    </button>
                    <button
                      disabled={busy === `payment-${payment.order_id}`}
                      onClick={() => validatePayment(payment)}
                    >
                      <CheckCircle2 /> Valider
                    </button>
                  </div>
                )}
              </article>
            ))}
            {!visiblePayments.length && (
              <div className="admin-payment-empty">
                <ShieldCheck />
                <h3>Aucun paiement dans cette file.</h3>
                <p>Les nouvelles preuves apparaîtront automatiquement ici.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="admin-payout-list">
          {visiblePayouts.map((payout) => (
            <article key={payout.id}>
              <header>
                <div>
                  <small>{payout.order_number}</small>
                  <h3>{payout.seller_name}</h3>
                </div>
                <Status value={payout.status} />
              </header>
              <strong>{money(payout.amount)}</strong>
              <p>MonCash vendeur : {payout.seller_moncash || "Non renseigné"}</p>
              <small>
                {payout.status === "pending"
                  ? "Fonds bloqués jusqu’à la confirmation client"
                  : payout.status === "processing"
                    ? "Fonds libérés : transfert autorisé"
                    : payout.status === "paid"
                      ? `Versé · ${payout.payment_reference || "référence enregistrée"}`
                      : "Versement suspendu"}
              </small>
              {payout.status === "processing" && (
                <div>
                  <input
                    value={payoutReferences[payout.id] || ""}
                    onChange={(event) =>
                      setPayoutReferences((current) => ({
                        ...current,
                        [payout.id]: event.target.value,
                      }))
                    }
                    placeholder="Référence transfert MonCash"
                  />
                  <button
                    disabled={busy === `payout-${payout.id}`}
                    onClick={() => markPayoutPaid(payout)}
                  >
                    <Send /> Confirmer le versement
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {selectedProof && (
        <div className="admin-proof-modal" role="presentation">
          <section role="dialog" aria-modal="true" aria-label="Preuve MonCash">
            <header>
              <div>
                <small>{selectedProof.order_number}</small>
                <h2>Preuve de {selectedProof.client_name}</h2>
              </div>
              <button onClick={() => setSelectedProof(null)} aria-label="Fermer">
                <X />
              </button>
            </header>
            <img src={assetUrl(selectedProof.proof_url)} alt="Preuve de paiement MonCash" />
            {selectedProof.proof_note && <p>{selectedProof.proof_note}</p>}
          </section>
        </div>
      )}
    </section>
  );
}

export function AdminProfileContent({
  api,
  user,
  updateUser,
  onLogout,
  accountLabel = "Administrateur",
  settingsPath = "/admin/settings",
}) {
  const [form, setForm] = useState({ name: user.name || "", phone: user.phone || "" });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [creatingManager, setCreatingManager] = useState(false);
  const [managerForm, setManagerForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "manager",
  });
  const canCreateManager = accountLabel.toLowerCase() === "administrateur";

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

  const createManager = async (event) => {
    event.preventDefault();
    setCreatingManager(true);
    setMessage("");
    try {
      const { data } = await api.post("/admin/staff", managerForm);
      setMessage(data.message);
      setManagerForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "manager",
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "Impossible de créer ce membre d’équipe.");
    } finally {
      setCreatingManager(false);
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
          <header><Settings /><span><small>Informations personnelles</small><h2>Profil {accountLabel.toLowerCase()}</h2></span></header>
          <label>Nom complet<input required minLength="2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Adresse email<input value={user.email || ""} disabled /></label>
          <label className="full">Téléphone<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
          {message && <div className="admin-message full">{message}</div>}
          <button className="admin-download-report full" disabled={saving}><CheckCircle2 /> {saving ? "Enregistrement..." : "Enregistrer le profil"}</button>
        </form>
      </section>
      {canCreateManager && (
        <form className="admin-manager-profile-create" onSubmit={createManager}>
          <header>
            <span><UserPlus /></span>
            <div>
              <small>Équipe VinnHT</small>
              <h2>Créer un profil d’équipe</h2>
              <p>Attribuez uniquement l’espace nécessaire : opérations, support ou finance.</p>
            </div>
          </header>
          <label>
            Nom complet
            <input
              required
              minLength="2"
              value={managerForm.name}
              onChange={(event) => setManagerForm({ ...managerForm, name: event.target.value })}
            />
          </label>
          <label>
            Adresse email
            <input
              required
              type="email"
              value={managerForm.email}
              onChange={(event) => setManagerForm({ ...managerForm, email: event.target.value })}
            />
          </label>
          <label>
            Téléphone
            <input
              value={managerForm.phone}
              onChange={(event) => setManagerForm({ ...managerForm, phone: event.target.value })}
            />
          </label>
          <label>
            Mot de passe initial
            <input
              required
              type="password"
              minLength="10"
              value={managerForm.password}
              onChange={(event) => setManagerForm({ ...managerForm, password: event.target.value })}
            />
          </label>
          <label>
            Espace de travail
            <select
              value={managerForm.role}
              onChange={(event) => setManagerForm({ ...managerForm, role: event.target.value })}
            >
              {staffRoleOptions.map((role) => (
                <option value={role.value} key={role.value}>{role.label}</option>
              ))}
            </select>
          </label>
          <div className="admin-manager-permissions">
            <ShieldCheck />
            <span>
              <b>Permissions limitées à cet espace</b>
              <small>Ce compte ne recevra pas les droits administrateur.</small>
            </span>
          </div>
          <button disabled={creatingManager}>
            <UserPlus />
            {creatingManager ? "Création du profil..." : "Créer le profil d’équipe"}
          </button>
        </form>
      )}
      <MobileProfileActions onLogout={onLogout} settingsPath={settingsPath} />
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
          [BarChart3, "Activité marketplace", "Recevoir les résumés sur l’évolution des commandes.", "weeklyReport"],
          [Truck, "Suivi des livraisons", "Être alerté des retards et échecs de livraison.", "securityAlerts"],
          [Store, "Suivi des vendeurs", "Recevoir les nouvelles demandes et alertes boutiques.", "sellerRequests"],
        ]
      : role === "delivery"
        ? [
            [Truck, "Nouvelles missions", "Recevoir une alerte lorsqu’une commande vous est assignée.", "sellerRequests"],
            [ShieldCheck, "Alertes de sécurité", "Être informé des actions sensibles liées à votre compte.", "securityAlerts"],
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
            [FileText, "Rapport hebdomadaire", "Recevoir le rappel du rapport officiel chaque samedi.", "weeklyReport"],
            [ShieldCheck, "Securite", "Etre informe des actions administratives sensibles.", "securityAlerts"],
          ];

  return (
    <div className="admin-flow">
      <AdminHeading
        eyebrow="Configuration"
        title={`Paramètres ${role}`}
        text={
          role === "delivery"
            ? "Choisissez les notifications utiles pour vos missions de livraison."
            : "Choisissez les alertes importantes pour superviser VinnHT efficacement."
        }
      />
      <section className="admin-settings-grid">
        {settings.map(([Icon, title, text, key]) => (
          <article key={key}>
            <span><Icon /></span>
            <div><h3>{title}</h3><p>{text}</p></div>
            <label><input type="checkbox" checked={preferences[key]} onChange={() => togglePreference(key)} /><i /></label>
          </article>
        ))}
      </section>
      <section className="admin-settings-note">
        <Bell />
        <div>
          <h2>Centre de notifications</h2>
          <p>Ces préférences contrôlent les alertes visibles dans votre espace VinnHT.</p>
        </div>
      </section>
      <AccountSecuritySettings api={api} onMessage={setMessage} />
      {message && <div className="admin-message">{message}</div>}
    </div>
  );
}

export function AdminContactRequestsContent({ api, onMobileConversationChange }) {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [thread, setThread] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileRequestOpen, setMobileRequestOpen] = useState(false);

  const load = () =>
    api
      .get("/admin/contact-requests")
      .then(({ data }) => setRequests(data))
      .catch((requestError) =>
        setError(requestError.response?.data?.message || "Impossible de charger le support.")
      );

  useEffect(() => {
    load();
  }, []);

  useEffect(
    () => () => onMobileConversationChange?.(false),
    [onMobileConversationChange],
  );

  const openRequest = async (request) => {
    setSelected(request);
    setMobileRequestOpen(true);
    onMobileConversationChange?.(true);
    setError("");
    try {
      const { data } = await api.get(`/support/requests/${request.id}/messages`);
      setThread(data.messages || []);
      setRequests((items) =>
        items.map((item) => (item.id === request.id ? { ...item, unread_count: 0 } : item))
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible d’ouvrir cette discussion.");
    }
  };

  const closeMobileRequest = () => {
    setMobileRequestOpen(false);
    onMobileConversationChange?.(false);
  };

  const updateStatus = async (id, status) => {
    const { data } = await api.patch(`/admin/contact-requests/${id}`, { status });
    setMessage(data.message);
    setSelected((current) => current?.id === id ? { ...current, status } : current);
    if (
      statusFilter !== "all" &&
      statusFilter !== "unread" &&
      statusFilter !== status
    ) {
      setSelected(null);
      setThread([]);
      closeMobileRequest();
    }
    load();
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !selected) return;
    setSending(true);
    setError("");
    try {
      const { data } = await api.post(`/support/requests/${selected.id}/messages`, {
        body: draft.trim(),
      });
      setMessage(data.message);
      setDraft("");
      await Promise.all([openRequest({ ...selected, status: "in_progress" }), load()]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible d’envoyer cette réponse.");
    } finally {
      setSending(false);
    }
  };

  const matchesStatusFilter = (request, filter = statusFilter) =>
    filter === "all" ||
    (filter === "unread"
      ? Number(request.unread_count || 0) > 0
      : request.status === filter);

  const visible = requests.filter((request) => {
    const matchesStatus = matchesStatusFilter(request);
    const matchesQuery = `${request.reference} ${request.name} ${request.email} ${request.phone || ""} ${request.subject}`
      .toLowerCase()
      .includes(query.toLowerCase());
    return matchesStatus && matchesQuery;
  });
  const counts = requests.reduce(
    (summary, request) => ({
      ...summary,
      [request.status]: Number(summary[request.status] || 0) + 1,
    }),
    {},
  );
  const unreadTotal = requests.reduce(
    (total, item) => total + Number(item.unread_count || 0),
    0,
  );
  const statusFilters = [
    [Boxes, "Tous", "all", requests.length],
    [MessageCircle, "Nouveaux", "new", counts.new],
    [Clock3, "En traitement", "in_progress", counts.in_progress],
    [CheckCircle2, "Résolus", "resolved", counts.resolved],
    [Bell, "Non lus", "unread", unreadTotal],
  ];
  const applyStatusFilter = (filter) => {
    setStatusFilter(filter);
    if (selected && !matchesStatusFilter(selected, filter)) {
      setSelected(null);
      setThread([]);
      closeMobileRequest();
    }
  };
  const initialsFor = (name) =>
    String(name || "Client")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  return (
    <div
      className={`admin-flow admin-support-dossiers ${
        mobileRequestOpen ? "mobile-request-open" : ""
      }`}
    >
      {message && <div className="admin-message">{message}</div>}
      {error && <div className="admin-error">{error}</div>}
      <nav className="admin-support-status-filters" aria-label="Filtrer les dossiers support">
        {statusFilters.map(([Icon, label, filter, value]) => (
          <button
            type="button"
            className={statusFilter === filter ? "active" : ""}
            aria-pressed={statusFilter === filter}
            onClick={() => applyStatusFilter(filter)}
            key={filter}
          >
            <Icon />
            <span><small>{label}</small><b>{Number(value || 0)}</b></span>
          </button>
        ))}
      </nav>
      <div className="admin-support-layout">
        <aside className="admin-support-list">
          <div className="admin-support-list-tools">
            <label className="admin-search">
              <Search />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un dossier"
              />
            </label>
            <div>
              <select
                value={statusFilter}
                onChange={(event) => applyStatusFilter(event.target.value)}
                aria-label="Statut des dossiers"
              >
                <option value="all">Tous les statuts</option>
                <option value="new">Nouveaux</option>
                <option value="in_progress">En traitement</option>
                <option value="resolved">Résolus</option>
                <option value="unread">Non lus</option>
              </select>
              <button type="button" onClick={load} aria-label="Actualiser les dossiers">
                <RefreshCw />
              </button>
            </div>
          </div>
          <div className="admin-support-list-scroll">
            {visible.map((request) => (
              <button
                className={`${selected?.id === request.id ? "active" : ""} ${request.unread_count ? "unread" : ""}`}
                onClick={() => openRequest(request)}
                key={request.id}
              >
                <span className="admin-support-avatar">{initialsFor(request.name)}</span>
                <p>
                  <b>{request.name}</b>
                  <strong>{request.subject}</strong>
                  <small>{request.phone || "Téléphone non renseigné"} · {request.reference}</small>
                  <small>{request.last_reply || request.message}</small>
                </p>
                <div>
                  <Status value={request.status} />
                  {request.unread_count > 0 && <i>{request.unread_count}</i>}
                </div>
              </button>
            ))}
            {!visible.length && <div className="admin-empty">Aucune demande ne correspond aux filtres.</div>}
          </div>
        </aside>
        <section className="admin-support-room">
          {selected ? (
            <>
              <header>
                <button
                  type="button"
                  className="admin-support-mobile-back"
                  onClick={closeMobileRequest}
                  aria-label="Retour aux dossiers support"
                >
                  <ChevronLeft />
                </button>
                <div>
                  <span className="admin-support-avatar large">
                    {initialsFor(selected.name)}
                  </span>
                  <p>
                    <small className="admin-support-reference">
                      {selected.reference} · {selected.category}
                    </small>
                    <b>{selected.name}</b>
                    <strong>{selected.subject}</strong>
                    <small className="admin-support-contact-line">
                      {selected.email} · {selected.phone || "Téléphone non renseigné"}
                    </small>
                  </p>
                </div>
                <Status value={selected.status} />
              </header>
              <div className="admin-support-history">
                {thread.map((item) => (
                  <article className={["admin", "support"].includes(item.sender_role) ? "admin" : "client"} key={item.id}>
                    <small>{item.sender_name || (["admin", "support"].includes(item.sender_role) ? "Support VinnHT" : selected.name)}</small>
                    <p>{item.body}</p>
                    <time>{new Date(item.created_at).toLocaleString("fr-HT")}</time>
                  </article>
                ))}
              </div>
              <form className="admin-support-reply-form" onSubmit={sendReply}>
                <div className="admin-support-status-actions">
                  <button type="button" onClick={() => updateStatus(selected.id, "in_progress")}>
                    <Clock3 /> En traitement
                  </button>
                  <button type="button" className="success" onClick={() => updateStatus(selected.id, "resolved")}>
                    <CheckCircle2 /> Résoudre
                  </button>
                </div>
                {selected.user_id ? (
                  <div className="admin-support-composer">
                    <textarea
                      required
                      rows="1"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Écrire une réponse..."
                    />
                    <button
                      className="send"
                      disabled={sending}
                      aria-label="Envoyer la réponse"
                    >
                      <Send />
                      <span>{sending ? "Envoi..." : "Répondre"}</span>
                    </button>
                  </div>
                ) : (
                  <div className="admin-support-public-notice">
                    <Mail />
                    <div>
                      <b>Demande publique</b>
                      <span>Ce client n’était pas connecté à VinnHT.</span>
                    </div>
                    <a
                      href={`mailto:${selected.email}?subject=${encodeURIComponent(
                        `Réponse VinnHT · ${selected.subject}`,
                      )}`}
                    >
                      Répondre par email
                    </a>
                  </div>
                )}
              </form>
            </>
          ) : (
            <div className="admin-empty">Sélectionnez une demande pour ouvrir la discussion.</div>
          )}
        </section>
      </div>
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
  const [error, setError] = useState("");
  const [range, setRange] = useState("30d");
  useEffect(() => {
    api
      .get("/admin/reports", { params: { range } })
      .then(({ data: response }) => setData(response || {}))
      .catch((requestError) => {
        setData({});
        setError(
          requestError.response?.data?.message ||
            "Impossible de charger les rapports pour le moment."
        );
      });
  }, [api, range]);
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
      <AdminHeading eyebrow={`Rapports ${role}`} title="Performance marketplace" text="Indicateurs opérationnels calculés directement depuis les données VinnHT.">
        <div className="admin-chart-controls">
          {[["7d", "7 jours"], ["30d", "30 jours"], ["90d", "90 jours"]].map(([value, label]) => (
            <button className={range === value ? "active" : ""} onClick={() => setRange(value)} key={value}>{label}</button>
          ))}
        </div>
      </AdminHeading>
      {error && <div className="admin-error">{error}</div>}
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
            <div className="admin-table-wrap"><table><thead><tr><th>Boutique</th><th>Produits actifs</th><th>Commandes</th><th>Ventes terminées</th></tr></thead><tbody>{(data?.sellerActivity || []).map((seller) => <tr key={seller.seller_id}><td>{seller.seller_name}</td><td>{seller.active_products}</td><td>{seller.orders}</td><td>{seller.completed_sales}</td></tr>)}</tbody></table></div>
          </section>
        )}
        <section className="admin-panel admin-health-list">
          <header><div><Truck /><span><b>Santé des livraisons</b><small>Répartition actuelle</small></span></div></header>
          <div>{(data?.deliveryHealth || []).map((item) => <p key={item.status}><Status value={item.status} /><b>{item.total}</b></p>)}</div>
        </section>
      </div>
      <section className="admin-panel manager-order-trend">
        <header><div><BarChart3 /><span><b>Commandes sur la période</b><small>Évolution quotidienne sans données financières</small></span></div></header>
        <div>
          {(data?.orderTrend || []).map((item) => (
            <article key={item.activity_date}>
              <span style={{ height: `${Math.max(8, Number(item.orders || 0) * 12)}px` }} />
              <small>{new Date(item.activity_date).toLocaleDateString("fr-HT", { day: "2-digit", month: "short" })}</small>
              <b>{item.orders}</b>
            </article>
          ))}
          {!data?.orderTrend?.length && <div className="admin-empty">Aucune commande sur cette période.</div>}
        </div>
      </section>
    </div>
  );
}

export function OperationsDashboardContent({ api, role, user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/admin/reports")
      .then(({ data: response }) => setData(response || {}))
      .catch((requestError) => {
        setData({});
        setError(
          requestError.response?.data?.message ||
            "Impossible de charger les données du manager pour le moment."
        );
      });
  }, [api]);
  const stats = data?.stats || {};
  const cards = [
    [Store, "Demandes vendeurs", stats.pending_requests],
    [Users, "Vendeurs", stats.sellers],
    [Package, "Commandes", stats.orders],
    [Truck, "Livraisons actives", stats.active_deliveries],
  ];
  return (
    <div className="admin-flow">
      <AdminHeading eyebrow="Pilotage strategique" title={`Bonjour, ${user?.name || role}`} text="Suivez l’activité des vendeurs, demandes, commandes et livraisons de VinnHT.">
        <Link to="/manager/seller-requests">Examiner les demandes <ArrowRight /></Link>
      </AdminHeading>
      {error && <div className="admin-error">{error}</div>}
      <section className="admin-metric-grid">{cards.map(([Icon, label, value, currency]) => <article key={label}><span><Icon /></span><small>{label}</small><strong>{currency ? money(value) : Number(value || 0).toLocaleString("fr-HT")}</strong><p>Donnée actuelle</p></article>)}</section>
      <div className="admin-dashboard-columns">
        <section className="admin-panel admin-health-list"><header><div><Store /><span><b>Demandes vendeurs</b><small>État des candidatures</small></span></div></header><div>{(data?.requestHealth || []).map((item) => <p key={item.status}><Status value={item.status} /><b>{item.total}</b></p>)}</div></section>
        <section className="admin-panel admin-health-list"><header><div><Truck /><span><b>Livraisons</b><small>Suivi opérationnel</small></span></div></header><div>{(data?.deliveryHealth || []).map((item) => <p key={item.status}><Status value={item.status} /><b>{item.total}</b></p>)}</div></section>
      </div>
      <div className="admin-dashboard-columns">
        <section className="admin-panel manager-priority-list">
          <header><div><AlertTriangle /><span><b>Commandes bloquées</b><small>Sans évolution depuis plus de 24 heures</small></span></div></header>
          <div>
            {(data?.blockedOrders || []).map((order) => (
              <article key={order.id}>
                <span><Package /></span>
                <p><b>{order.order_number}</b><small>{order.status} · {order.stalled_hours} h sans évolution</small></p>
              </article>
            ))}
            {!data?.blockedOrders?.length && <div className="admin-empty">Aucune commande bloquée.</div>}
          </div>
        </section>
        <section className="admin-panel manager-priority-list">
          <header><div><CheckCircle2 /><span><b>Vendeurs récemment approuvés</b><small>Dernières décisions du réseau</small></span></div></header>
          <div>
            {(data?.recentApproved || []).map((request) => (
              <article key={request.id}>
                <span><Store /></span>
                <p><b>{request.business_name}</b><small>{request.owner_name} · {shortDate(request.reviewed_at)}</small></p>
              </article>
            ))}
            {!data?.recentApproved?.length && <div className="admin-empty">Aucune approbation récente.</div>}
          </div>
        </section>
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
      settingsPath={`/${role.toLowerCase()}/settings`}
    />
  );
}

export function StaffSettingsContent({ api, role }) {
  return <AdminSettingsContent api={api} role={role} />;
}

export function SellersOverviewContent({ api }) {
  const [shops, setShops] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [activity, setActivity] = useState("all");
  useEffect(() => { api.get("/shops").then(({ data }) => setShops(data)); }, []);
  const categories = [...new Set(shops.map((shop) => shop.category).filter(Boolean))].sort();
  const visible = shops.filter((shop) => {
    const searchMatch = JSON.stringify(shop).toLowerCase().includes(query.toLowerCase());
    const categoryMatch = category === "all" || shop.category === category;
    const activityMatch =
      activity === "all" ||
      (activity === "with_products" && Number(shop.product_count) > 0) ||
      (activity === "without_products" && Number(shop.product_count) === 0);
    return searchMatch && categoryMatch && activityMatch;
  });
  return (
    <div className="admin-flow">
      <AdminHeading eyebrow="Réseau vendeurs" title="Boutiques actives" text="Analysez les boutiques, leur catalogue et leur réputation." />
      <section className="manager-seller-filters">
        <label className="admin-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Boutique, catégorie ou propriétaire" /></label>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">Toutes catégories</option>
          {categories.map((item) => <option value={item} key={item}>{item}</option>)}
        </select>
        <select value={activity} onChange={(event) => setActivity(event.target.value)}>
          <option value="all">Tous catalogues</option>
          <option value="with_products">Avec produits</option>
          <option value="without_products">Sans produit</option>
        </select>
      </section>
      <section className="admin-user-grid">
        {visible.map((shop) => (
          <article key={shop.seller_id}>
            <header>
              <span>{shop.shop_logo_url ? <img src={assetUrl(shop.shop_logo_url)} alt="" /> : <Boxes />}</span>
              <div><b>{shop.shop_name}</b><small>{shop.category || "Boutique VinnHT"}</small></div>
              <Status value="active" />
            </header>
            <div className="admin-shop-metrics">
              <span><b>{shop.product_count}</b><small>produits actifs</small></span>
              <span><b>{Number(shop.rating || 0).toFixed(1)}</b><small>note moyenne</small></span>
              <span><b>{shop.review_count}</b><small>avis vérifiés</small></span>
            </div>
            <footer>
              <Link to={`/shops/${shop.seller_id}`} target="_blank"><Eye /> Consulter la boutique</Link>
            </footer>
          </article>
        ))}
      </section>
      {!visible.length && <div className="admin-empty">Aucune boutique ne correspond aux filtres.</div>}
    </div>
  );
}
