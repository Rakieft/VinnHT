import React, { useEffect, useMemo, useState } from "react";
import CountUp from "react-countup";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  CircleUserRound,
  Clock3,
  CreditCard,
  Edit3,
  Eye,
  Flame,
  Headphones,
  Heart,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  Tag,
  Trash2,
  Truck,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Link } from "react-router-dom";
import ProfilePhotoManager from "./ProfilePhotoManager.jsx";
import MobileProfileActions from "./MobileProfileActions.jsx";
import AccountSecuritySettings from "./AccountSecuritySettings.jsx";
import { apiOrigin } from "../config/runtime.js";
import "../styles/client-space.css";

const imageSource = (url) =>
  url?.startsWith("/uploads") ? `${apiOrigin}${url}` : url;
const clientActivityOptions = [
  ["school", "Écolier / Écolière"],
  ["university", "Étudiant / Étudiante"],
  ["employee", "Employé / Employée"],
  ["entrepreneur", "Entrepreneur / Commerçant"],
  ["self_employed", "Travailleur indépendant"],
  ["unemployed", "Sans activité actuellement"],
  ["other", "Autre situation"],
];
const clientActivityLabel = (status) =>
  clientActivityOptions.find(([value]) => value === status)?.[1] || "Autre situation";
const orderImageSource = (url) => imageSource(url) || "/vinnht-logo.png";
const useOrderImageFallback = (event) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = "/vinnht-logo.png";
};
const clientProductPrice = (product) => {
  const activeOffer =
    product.is_featured &&
    Number(product.promotional_price) > 0 &&
    Number(product.promotional_price) < Number(product.price) &&
    (!product.offer_ends_at || new Date(product.offer_ends_at) > new Date());

  return activeOffer ? Number(product.promotional_price) : Number(product.price);
};
const clientProductOfferIsActive = (product) =>
  Boolean(
    product?.is_featured &&
      Number(product.promotional_price) > 0 &&
      Number(product.promotional_price) < Number(product.price) &&
      (!product.offer_ends_at || new Date(product.offer_ends_at) > new Date()),
  );
const clientProductPackSizes = (product) =>
  String(product?.pack_sizes || "")
    .split(",")
    .map((packSize) => Number(packSize))
    .filter((packSize) => Number.isFinite(packSize) && packSize > 1);

const clientProductOfferHasExpired = (product) =>
  Boolean(
    product?.is_featured &&
      Number(product.promotional_price) > 0 &&
      Number(product.promotional_price) < Number(product.price) &&
      product.offer_ends_at &&
      new Date(product.offer_ends_at) <= new Date(),
  );

const products = [
  {
    id: 101,
    name: "Casque audio premium",
    price: 7850,
    city: "Pétion-Ville",
    category_name: "Électronique",
    seller_name: "Tech Ayiti",
    image_url:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30eauto=format&fit=crop&w=900&q=80",
  },
  {
    id: 102,
    name: "Fauteuil contemporain",
    price: 18900,
    city: "Delmas",
    category_name: "Maison & Meubles",
    seller_name: "Kay Design",
    image_url:
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374cauto=format&fit=crop&w=900&q=80",
  },
  {
    id: 103,
    name: "Sac artisanal haïtien",
    price: 4200,
    city: "Jacmel",
    category_name: "Mode",
    seller_name: "Kreyol Chic",
    image_url:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 104,
    name: "Smartphone reconditionné",
    price: 24500,
    city: "Cap-Haïtien",
    category_name: "Électronique",
    seller_name: "Mobile Plus",
    image_url:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 105,
    name: "Panier fraîcheur peyi",
    price: 2450,
    city: "Port-au-Prince",
    category_name: "Supermarché",
    seller_name: "Marché Lakay",
    image_url:
      "https://images.unsplash.com/photo-1542838132-92c53300491eauto=format&fit=crop&w=900&q=80",
  },
  {
    id: 106,
    name: "Montre minimaliste",
    price: 9800,
    city: "Delmas",
    category_name: "Mode",
    seller_name: "Urban Store",
    image_url:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30auto=format&fit=crop&w=900&q=80",
  },
];

const orders = [
  {
    id: "#VHT-458",
    date: "8 juin 2026",
    items: 3,
    total: 18450,
    status: "En livraison",
    seller: "Marché Lakay",
    image: products[4].image_url,
  },
  {
    id: "#VHT-451",
    date: "3 juin 2026",
    items: 1,
    total: 7850,
    status: "Livrée",
    seller: "Tech Ayiti",
    image: products[0].image_url,
  },
  {
    id: "#VHT-443",
    date: "28 mai 2026",
    items: 2,
    total: 23100,
    status: "Préparation",
    seller: "Kay Design",
    image: products[1].image_url,
  },
  {
    id: "#VHT-439",
    date: "22 mai 2026",
    items: 1,
    total: 4200,
    status: "Annulée",
    seller: "Kreyol Chic",
    image: products[2].image_url,
  },
];

const activities = [
  [CheckCircle2, "Commande #458 livrée", "Aujourd’hui, 10:24", "success"],
  [Heart, "Produit ajouté aux favoris", "Hier, 18:40", "gold"],
  [Store, "Demande vendeur envoyée", "2 juin 2026", "blue"],
  [CreditCard, "Paiement confirmé", "28 mai 2026", "success"],
];

const shops = [
  ["Tech Ayiti", "Électronique", "4.9", "TA"],
  ["Marché Lakay", "Supermarché", "4.8", "ML"],
  ["Kreyol Chic", "Mode & artisanat", "4.9", "KC"],
  ["Kay Design", "Maison & meubles", "4.7", "KD"],
];

function SectionHeading({ eyebrow, title, action, to = "/categories" }) {
  return (
    <div className="client-section-heading">
      <div>
        {eyebrow && <span>{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {action && (
        <Link to={to}>
          {action}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

function ClientProductCard({
  product,
  onAdd,
  compact = false,
  favorite = false,
  onToggleFavorite,
}) {
  const activeOffer = clientProductOfferIsActive(product);
  const expiredOffer = favorite && clientProductOfferHasExpired(product);
  const packSizes = clientProductPackSizes(product);

  return (
    <motion.article
      className={`product-card client-catalog-product-card ${compact ? "compact" : ""}`}
      whileHover={{ y: -6 }}
    >
      <Link className="product-media" to={`/products/${product.id}`}>
        <img
          src={imageSource(product.image_url)}
          alt={product.name}
          loading="lazy"
          decoding="async"
        />
        {activeOffer ? (
          <span className="vinnht-offer-badge" aria-label="Offre spéciale VinnHT">
            <Sparkles size={13} />
            Offre
          </span>
        ) : expiredOffer ? (
          <span className="vinnht-expired-offer-badge">
            <Clock3 size={13} />
            Offre terminée
          </span>
        ) : (
          <span className="badge badge-gold">Tendance</span>
        )}
        {packSizes.length > 0 && (
          <span
            className="product-pack-card-badge"
            aria-label={`Disponible par lots de ${packSizes.join(", ")}`}
          >
            <Package size={13} />
            <b>Vente en lots</b>
            <small>{packSizes.join(" · ")}</small>
          </span>
        )}
      </Link>
      <button
        className={`product-favorite-button ${favorite ? "active" : ""}`}
        onClick={() => onToggleFavorite?.(product)}
        aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        <Heart size={18} fill={favorite ? "currentColor" : "none"} />
      </button>
      <div className="product-body">
        <div className="product-meta">
          <span>{product.category_name || "Produit"}</span>
          <span>
            <MapPin size={13} />
            {product.city || "Haïti"}
          </span>
        </div>
        <Link to={`/products/${product.id}`}>
          <h3>{product.name}</h3>
        </Link>
        <p>
          <ShieldCheck size={14} />
          Vendeur vérifié : {product.seller_name || product.shop_name || "Boutique VinnHT"}
        </p>
        <div className="product-bottom">
          <span className="product-card-price">
            {packSizes.length > 0 && <small>Prix à l’unité</small>}
            <strong>{clientProductPrice(product).toLocaleString("fr-HT")} HTG</strong>
          </span>
          <button className="round-btn" onClick={() => onAdd?.(product)} aria-label="Ajouter au panier">
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function ClientStats({ dashboard, seller }) {
  const safeDashboard = dashboard || {};
  const counts = safeDashboard.stats || {};
  const stats = [
    [Package, "Commandes totales", Number(counts.orders || 0), "Toutes vos commandes"],
    [Heart, "Produits favoris", Number(counts.favorites || 0), "Sélection personnelle"],
    [ShoppingCart, "Articles dans le panier", Number(counts.cart_items || 0), "Prêts à commander"],
    [Store, "Statut vendeur", null, seller ? "Vendeur approuve" : safeDashboard.sellerRequest?.status || "Client standard"],
  ];

  return (
    <div className="client-stats-grid">
      {stats.map(([Icon, label, count, note]) => (
        <motion.article className="client-stat-card" whileHover={{ y: -5 }} key={label}>
          <span>
            <Icon />
          </span>
          <div>
            <small>{label}</small>
            <strong>{count === null ? (seller ? "Vendeur" : "Client") : <CountUp end={count} duration={1.8} />}</strong>
            <p>{note}</p>
          </div>
        </motion.article>
      ))}
    </div>
  );
}

export function ClientDashboardContent({
  user,
  cartCount,
  onAdd,
  favorites = [],
  isFavorite,
  onToggleFavorite,
  productData = [],
  offerData = [],
  shopData = [],
  dashboardData,
}) {
  const prefersReducedMotion = useReducedMotion();
  const catalog = productData;
  const dashboard = dashboardData || {};
  const activeOrder = dashboard.activeOrder || null;
  const activityItems = dashboard.activity || [];
  const orderProgress = ["confirmed", "processing", "shipped", "delivered"];
  const currentProgress = activeOrder
     ? Math.max(
        activeOrder.payment_status === "paid" ? 0 : -1,
        orderProgress.indexOf(activeOrder.status),
        activeOrder.delivery_status === "in_transit" ? 2 : -1,
      )
    : -1;
  const activityIcon = (type = "") => {
    if (type.includes("payment")) return CreditCard;
    if (type.includes("seller")) return Store;
    if (type.includes("delivery")) return Truck;
    if (type.includes("favorite")) return Heart;
    return CheckCircle2;
  };

  return (
    <div className="client-space">
      <motion.section
        className="client-welcome-hero"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="client-welcome-copy">
          <span className="client-kicker">
            <Sparkles size={15} />
            Votre espace personnel
          </span>
          <h1>Bonjour, {user.name || "Client"}</h1>
          <p>
            Privilégiez les produits disponibles dans votre département et vérifiez la photo de
            profil ainsi que les informations de la boutique avant d’acheter.
          </p>
          <div className="client-hero-actions">
            <Link className="button primary" to="/products">
              Continuer mes achats
              <ArrowRight size={17} />
            </Link>
            <Link className="button outline" to="/categories">
              Explorer les rayons
            </Link>
          </div>
        </div>
        <div className="client-market-visual" aria-hidden="true">
          <motion.div
            className="market-orb"
            animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            <ShoppingBag />
          </motion.div>
          <motion.div
            className="floating-market-card card-one"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Package />
            <span>
              <b>Livraison suivie</b>
              Partout en Haïti
            </span>
          </motion.div>
          <motion.div
            className="floating-market-card card-two"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 4.6, repeat: Infinity }}
          >
            <ShieldCheck />
            <span>
              <b>Achat sécurisé</b>
              Vendeurs vérifiés
            </span>
          </motion.div>
        </div>
      </motion.section>

      <ClientStats dashboard={dashboard} seller={user.roles.includes("seller")} />

      <section className="client-dashboard-grid">
        <article className="client-panel recent-order-panel">
          <SectionHeading eyebrow="Commande active" title="Suivi de votre commande" />
          {activeOrder ? (
            <>
              <div className="recent-order-top">
                <img src={imageSource(activeOrder.image_url) || "/vinnht-logo.png"} alt="" />
                <div>
                  <span>{activeOrder.order_number}</span>
                  <h3>{activeOrder.seller_names || "Commande VinnHT"}</h3>
                  <p>{activeOrder.item_count} produit(s) · {new Date(activeOrder.created_at).toLocaleDateString("fr-HT")}</p>
                </div>
                <strong>{Number(activeOrder.total).toLocaleString("fr-HT")} HTG</strong>
              </div>
              <div className="client-order-progress">
                {["Payée", "Préparation", "En livraison", "Livrée"].map((step, index) => (
                  <div className={index <= currentProgress ? "done" : ""} key={step}>
                    <span>{index <= currentProgress ? <CheckCircle2 /> : index + 1}</span>
                    <small>{step}</small>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="client-api-notice">Aucune commande active actuellement.</div>
          )}
          <Link className="client-inline-action" to="/my-orders">
            Voir les détails
            <ChevronRight size={16} />
          </Link>
        </article>

        <article className="client-panel activity-panel">
          <SectionHeading eyebrow="Aujourd’hui" title="Activité récente" />
          <div className="client-activity-list">
            {activityItems.map((activity) => {
              const Icon = activityIcon(activity.type);
              return (
              <div key={`${activity.type}-${activity.created_at}`}>
                <span className="activity-icon blue">
                  <Icon />
                </span>
                <p>
                  <b>{activity.title}</b>
                  <small>{new Date(activity.created_at).toLocaleString("fr-HT")}</small>
                </p>
              </div>
            )})}
            {!activityItems.length && <div className="client-api-notice">Votre activité récente apparaîtra ici.</div>}
          </div>
        </article>
      </section>

      <section className="client-carousel-section">
        <SectionHeading
          eyebrow="Sélection intelligente"
          title="Recommandé pour vous"
          action="Tout explorer"
          to="/products"
        />
        <Swiper
          modules={[Autoplay, Pagination]}
          autoplay={{ delay: 4200, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          spaceBetween={18}
          breakpoints={{
            0: { slidesPerView: 2, spaceBetween: 10 },
            620: { slidesPerView: 2.2 },
            980: { slidesPerView: 3.2 },
            1320: { slidesPerView: 4.2 },
          }}
        >
          {catalog.map((product) => (
            <SwiperSlide key={product.id}>
              <ClientProductCard
                product={product}
                onAdd={onAdd}
                favorite={isFavorite?.(product.id)}
                onToggleFavorite={onToggleFavorite}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      <section className="client-promo-strip">
        <div className="client-promo-copy">
          <span>
            <Flame size={16} />
            Offres spéciales VinnHT
          </span>
          <h2>Les bonnes affaires ne durent pas longtemps.</h2>
          <p>
            Découvrez les promotions proposées par les boutiques VinnHT et profitez-en
            avant leur expiration.
          </p>
          <Link to="/products?offers=true">
            Découvrir les offres
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="promo-orbit-stage" aria-label="Produits actuellement en promotion">
          <div className="promo-orbit-core" aria-hidden="true">
            <img src="/vinnht-logo.png" alt="" />
            <Sparkles size={16} />
          </div>
          {offerData.length ? (
            <motion.div
              className="promo-product-orbit"
              animate={prefersReducedMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            >
              {offerData.slice(0, 6).map((offer, index, activeOffers) => {
                const angle = (360 / activeOffers.length) * index;

                return (
                  <span
                    className="promo-orbit-slot"
                    style={{ transform: `rotate(${angle}deg)` }}
                    key={offer.id}
                  >
                    <motion.span
                      className="promo-orbit-item"
                      animate={
                        prefersReducedMotion
                          ? { rotate: -angle }
                          : { rotate: [-angle, -angle - 360] }
                      }
                      transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                      whileHover={{ scale: 1.1 }}
                    >
                      <Link
                        to={`/products/${offer.id}`}
                        aria-label={`Voir l'offre ${offer.name}`}
                        title={offer.name}
                      >
                        <img
                          src={imageSource(offer.image_url) || "/vinnht-logo.png"}
                          alt={offer.name}
                          loading="lazy"
                          decoding="async"
                        />
                      </Link>
                    </motion.span>
                  </span>
                );
              })}
            </motion.div>
          ) : (
            <span className="promo-orbit-empty">De nouvelles offres arrivent bientôt.</span>
          )}
        </div>
      </section>

      <section className="client-carousel-section">
        <SectionHeading
          eyebrow="Votre sélection"
          title="Favoris récents"
          action="Voir mes favoris"
          to="/favorites"
        />
        <div className="client-favorites-row">
          {favorites.slice(0, 6).map((product) => (
            <ClientProductCard
              product={product}
              onAdd={onAdd}
              compact
              favorite={isFavorite?.(product.id)}
              onToggleFavorite={onToggleFavorite}
              key={product.id}
            />
          ))}
          {!favorites.length && <div className="client-api-notice">Ajoutez des produits à vos favoris pour les retrouver ici.</div>}
        </div>
      </section>

      {!user.roles.includes("seller") && (
        <section className="client-seller-banner">
          <div>
            <span>Votre prochaine étape</span>
            <h2>Transformez votre activité avec VinnHT</h2>
            <p>Commencez à vendre partout en Haïti.</p>
            <Link to="/become-seller">
              Devenir vendeur
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="seller-status-card">
            <Store />
            <span>Statut actuel</span>
            <strong>{dashboard.sellerRequest?.status || "Client standard"}</strong>
            <small>{dashboard.sellerRequest ? "Votre demande est suivie par VinnHT." : "Votre boutique peut commencer ici."}</small>
          </div>
        </section>
      )}

      <section className="client-carousel-section shops-section">
        <SectionHeading eyebrow="Boutiques vérifiées" title="Les boutiques à découvrir" />
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 3800, disableOnInteraction: false }}
          spaceBetween={16}
          breakpoints={{
            0: { slidesPerView: 1.2 },
            650: { slidesPerView: 2.2 },
            1100: { slidesPerView: 3.4 },
          }}
        >
          {shopData.map((shop) => {
            const realShop = true;
            const name = shop.shop_name;
            const category = shop.category || "Boutique VinnHT";
            const rating =
              Number(shop.review_count) > 0
                ? `${Number(shop.rating).toFixed(1)} (${shop.review_count})`
                : "Nouveau";
            const initials = name.slice(0, 2).toUpperCase();
            const path = `/shops/${shop.seller_id}`;
            return (
              <SwiperSlide key={name}>
                <article className="client-shop-card">
                  <span>
                    {realShop && shop.shop_logo_url ? (
                      <img src={imageSource(shop.shop_logo_url)} alt={`Logo ${name}`} />
                    ) : (
                      initials
                    )}
                  </span>
                  <div>
                    <small>Premium</small>
                    <h3>{name}</h3>
                    <p>{category}</p>
                    <b>
                      <Star size={14} />
                      {rating}
                    </b>
                  </div>
                  <Link to={path}>Visiter</Link>
                </article>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </section>

      <footer className="client-help-footer">
        <div>
          <Headphones />
          <span>
            <b>Besoin d’aide </b>
            Notre équipe est disponible pour vous accompagner.
          </span>
        </div>
        <nav>
          <Link to="/messages?support=1">Support</Link>
        </nav>
      </footer>
    </div>
  );
}

const orderStatusLabels = {
  pending: "En attente",
  confirmed: "Payée",
  processing: "Préparation",
  shipped: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export function ClientOrdersContent({
  ordersData = orders,
  loading = false,
  selectedOrder,
  onSelect,
  onCloseDetails,
  onSubmitPaymentProof,
  proofProcessing = false,
  proofError = "",
  proofSuccess = "",
  onConfirmReceipt,
  onConfirmPickup,
  receiptProcessing = false,
  receiptMessage = "",
  receiptError = "",
}) {
  const [filter, setFilter] = useState("Toutes");
  const [query, setQuery] = useState("");
  const filters = ["Toutes", "En attente", "En livraison", "Livrées", "Annulées"];
  const normalizedOrders = ordersData.map((order) => ({
    ...order,
    displayId: order.order_number || order.id,
    displayDate: order.created_at
       ? new Date(order.created_at).toLocaleDateString("fr-HT")
      : order.date,
    items: Number(order.item_count || order.items || 0),
    seller: order.seller_names || order.seller,
    image: order.image_url || order.image,
    displayStatus: orderStatusLabels[order.status] || order.status,
  }));
  const visible = normalizedOrders.filter((order) => {
    const statusMatch =
      filter === "Toutes" ||
      (filter === "Livrées" && order.displayStatus === "Livrée") ||
      (filter === "Annulées" && order.displayStatus === "Annulée") ||
      order.displayStatus === filter;
    return statusMatch && String(order.displayId).toLowerCase().includes(query.toLowerCase());
  });

  return (
    <ClientPageFrame
      eyebrow="Historique d’achats"
      title="Mes commandes"
      text="Suivez chaque achat, de la confirmation jusqu’à la livraison."
    >
      <div className="client-orders-toolbar">
        <div className="client-filter-tabs">
          {filters.map((item) => (
            <button
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
        <label>
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une commande"
          />
        </label>
      </div>
      <div className="client-orders-list">
        {loading && <div className="client-api-notice">Chargement de vos commandes...</div>}
        {visible.map((order) => (
          <motion.article className="client-order-card" whileHover={{ y: -4 }} key={order.id}>
            <img
              src={orderImageSource(order.image || products[0]?.image_url)}
              alt={`Produit de la commande ${order.displayId}`}
              onError={useOrderImageFallback}
            />
            <div className="order-main">
              <span>{order.displayId}</span>
              <h3>{order.seller || "Vendeurs VinnHT"}</h3>
              <p>
                <CalendarDays size={14} />
                {order.displayDate} · {order.items} produit(s)
              </p>
            </div>
            <strong>{Number(order.total).toLocaleString("fr-HT")} HTG</strong>
            <span
              className={`client-status status-${order.displayStatus
                .toLowerCase()
                .replaceAll(" ", "-")}`}
            >
              {order.displayStatus}
            </span>
            <button onClick={() => onSelect?.(order.id)}>
              <Eye size={16} />
              Voir détails
            </button>
          </motion.article>
        ))}
      </div>
      {selectedOrder && (
        <div
          className="client-order-detail-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onCloseDetails?.();
          }}
        >
          <ClientOrderDetail
            order={selectedOrder}
            onClose={onCloseDetails}
            onSubmitPaymentProof={onSubmitPaymentProof}
            proofProcessing={proofProcessing}
            proofError={proofError}
            proofSuccess={proofSuccess}
            onConfirmReceipt={onConfirmReceipt}
            onConfirmPickup={onConfirmPickup}
            receiptProcessing={receiptProcessing}
            receiptMessage={receiptMessage}
            receiptError={receiptError}
          />
        </div>
      )}
    </ClientPageFrame>
  );
}

function ClientOrderDetail({
  order,
  onClose,
  onSubmitPaymentProof,
  proofProcessing = false,
  proofError = "",
  proofSuccess = "",
  onConfirmReceipt,
  onConfirmPickup,
  receiptProcessing = false,
  receiptMessage = "",
  receiptError = "",
}) {
  const [proofFile, setProofFile] = useState(null);
  const [proofNote, setProofNote] = useState("");
  const [showPaymentProof, setShowPaymentProof] = useState(false);
  const [receiptToConfirm, setReceiptToConfirm] = useState(null);
  const [receiptAcknowledged, setReceiptAcknowledged] = useState(false);
  const steps = ["confirmed", "processing", "shipped", "delivered"];
  const currentIndex = steps.indexOf(order.status);
  const paymentInstructions = order.paymentInstructions || [];
  const pickupInstructions = paymentInstructions.filter(
    (instruction) =>
      (instruction.fulfillment_method || order.fulfillment_method) === "pickup",
  );
  const hasRejectedPayment = paymentInstructions.some(
    (instruction) => instruction.seller_payment_status === "failed"
  );
  const proofAlreadySent = Boolean(order.payment_proof_url || order.payment_reference) && !hasRejectedPayment;
  const paymentPaid = order.payment_status === "paid";
  const canSendProof = !paymentPaid && onSubmitPaymentProof;
  const displayStatus = orderStatusLabels[order.status] || order.status || "En attente";
  const fulfillmentLabel = order.fulfillment_method === "mixed"
    ? "Retrait et livraison"
    : order.fulfillment_method === "delivery"
      ? "Livraison"
      : "Retrait en boutique";
  const orderItems = Array.isArray(order.items) ? order.items : [];
  const deliveryPeople = Array.isArray(order.deliveryPeople) && order.deliveryPeople.length
    ? order.deliveryPeople
    : order.delivery_name
      ? [
          {
            assignment_id: "legacy-delivery",
            delivery_name: order.delivery_name,
            delivery_phone: order.delivery_phone,
            delivery_profile_image_url: order.delivery_profile_image_url,
            delivery_status: order.delivery_status,
          },
        ]
      : [];

  const submitProof = (event) => {
    event.preventDefault();
    if (!proofFile || !canSendProof) return;
    onSubmitPaymentProof(order.id, { file: proofFile, note: proofNote });
  };

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !receiptToConfirm) onClose?.();
    };

    document.body.classList.add("client-order-modal-open");
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.classList.remove("client-order-modal-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, receiptToConfirm]);

  return (
    <section
      className="client-order-detail"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-order-detail-title"
    >
      <header className="client-order-detail-header">
        <div>
          <span>Détails de la commande</span>
          <h2 id="client-order-detail-title">{order.order_number || `Commande #${order.id}`}</h2>
          <p>Retrouvez ici uniquement les informations importantes.</p>
        </div>
        <div className="client-order-detail-actions">
          <button type="button" onClick={onClose} aria-label="Fermer les détails">
            <X />
            <span>Fermer</span>
          </button>
        </div>
      </header>
      <div className="client-order-detail-overview">
        <article>
          <small>Statut actuel</small>
          <strong>{displayStatus}</strong>
        </article>
        <article>
          <small>Total payé</small>
          <strong>{Number(order.total || 0).toLocaleString("fr-HT")} HTG</strong>
        </article>
        <article>
          <small>Réception</small>
          <strong>{fulfillmentLabel}</strong>
        </article>
      </div>
      <div className="client-order-progress detail-progress">
        {["Payée", "Préparation", "En livraison", "Livrée"].map((label, index) => (
          <div className={currentIndex >= index ? "done" : ""} key={label}>
            <span>{currentIndex >= index ? <CheckCircle2 /> : index + 1}</span>
            <small>{label}</small>
          </div>
        ))}
      </div>
      <section className="client-order-payment-panel">
        <header>
          <div>
            <span>Paiement</span>
            <h3>{paymentPaid ? "Paiement confirmé" : hasRejectedPayment ? "Preuve à corriger" : proofAlreadySent ? "Preuve envoyée" : "Envoyer la preuve"}</h3>
            <p>
              Un seul paiement sur le compte MonCash VinnHT
              {paymentInstructions[0]?.moncash_number
                ? ` : ${paymentInstructions[0].moncash_number}`
                : "."}
            </p>
          </div>
          <b className={paymentPaid ? "paid" : hasRejectedPayment ? "failed" : proofAlreadySent ? "pending" : "waiting"}>
            {paymentPaid ? "Sécurisé" : hasRejectedPayment ? "Preuve refusée" : proofAlreadySent ? "Vérification VinnHT" : "Action requise"}
          </b>
        </header>
        <div className="client-order-moncash-grid">
          {paymentInstructions.map((instruction) => (
            <article key={instruction.seller_id || instruction.seller_name}>
              <small>{instruction.seller_name}</small>
              <strong>{Number(instruction.amount || 0).toLocaleString("fr-HT")} HTG</strong>
              <p>Part vendeur suivie par VinnHT</p>
              <span className={`client-seller-payment ${instruction.seller_payment_status || "pending"}`}>
                {instruction.seller_payment_status === "paid"
                  ? "Fonds sécurisés par VinnHT"
                  : instruction.seller_payment_status === "failed"
                    ? "Preuve refusée par VinnHT"
                    : instruction.seller_payment_status === "proof_submitted"
                      ? "Vérification administrative"
                      : "En attente"}
              </span>
              {instruction.payment_rejection_reason && (
                <em className="client-payment-rejection-reason">
                  Motif : {instruction.payment_rejection_reason}
                </em>
              )}
            </article>
          ))}
          {!paymentInstructions.length && (
            <article>
              <small>VinnHT</small>
              <strong>{Number(order.total || 0).toLocaleString("fr-HT")} HTG</strong>
              <p>Les instructions MonCash seront affichees ici.</p>
            </article>
          )}
        </div>
        {proofAlreadySent && (
          <div className="client-order-proof-status">
            <CheckCircle2 />
            <span>
              <b>Preuve deja envoyee</b>
              Reference : {order.payment_reference || "en verification"}
            </span>
            {order.payment_proof_url && (
              <button type="button" onClick={() => setShowPaymentProof((current) => !current)}>
                {showPaymentProof ? "Masquer la preuve" : "Voir la preuve"}
              </button>
            )}
          </div>
        )}
        {showPaymentProof && order.payment_proof_url && (
          <div className="client-payment-proof-preview">
            <img src={imageSource(order.payment_proof_url)} alt="Preuve de paiement MonCash" />
          </div>
        )}
        {hasRejectedPayment && (
          <div className="client-payment-feedback error">
            Une boutique a refuse la preuve. Corrigez le paiement ou envoyez une nouvelle preuve.
          </div>
        )}
        {canSendProof && (!proofAlreadySent || hasRejectedPayment) && (
          <form className="payment-proof-form order-payment-proof-form" onSubmit={submitProof}>
            <label>
              Capture ou photo MonCash
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(event) => setProofFile(event.target.files?.[0] || null)}
                required
              />
            </label>
            <label>
              Note optionnelle
              <input
                value={proofNote}
                onChange={(event) => setProofNote(event.target.value)}
                placeholder="Ex: paiement envoye a 3 vendeurs"
              />
            </label>
            <button type="submit" disabled={proofProcessing || !proofFile}>
              <Send size={16} />
              {proofProcessing ? "Envoi..." : "Envoyer la preuve"}
            </button>
          </form>
        )}
        {proofError && <div className="client-payment-feedback error">{proofError}</div>}
        {proofSuccess && <div className="client-payment-feedback success">{proofSuccess}</div>}
      </section>
      {Array.isArray(order.events) && order.events.length > 0 && (
        <section className="client-order-events">
          <header>
            <span>Historique</span>
            <h3>Actions importantes</h3>
          </header>
          {order.events.map((event) => (
            <article key={event.id}>
              <Clock3 />
              <div>
                <strong>{event.title}</strong>
                {event.message && <p>{event.message}</p>}
                <small>
                  {event.actor_name ? `${event.actor_name} - ` : ""}
                  {event.created_at ? new Date(event.created_at).toLocaleString("fr-HT") : ""}
                </small>
              </div>
            </article>
          ))}
        </section>
      )}
      {pickupInstructions.length > 0 && (
        <section className="client-pickup-trust">
          <header>
            <div>
              <span>Retrait gratuit</span>
              <h3>Récupérez vos articles auprès des boutiques</h3>
              <p>Attendez que chaque boutique marque sa partie comme prête avant de vous déplacer.</p>
            </div>
            <Store />
          </header>
          <div className="client-pickup-grid">
            {pickupInstructions.map((instruction) => (
              <article key={instruction.seller_sale_id}>
                <Store />
                <div>
                  <small>{instruction.seller_name}</small>
                  <h3>{instruction.pickup_address || "Adresse non renseignée"}</h3>
                  {instruction.opening_hours && <p>{instruction.opening_hours}</p>}
                  <b>
                    {instruction.pickup_client_confirmed_at
                      ? "Retrait confirmé"
                      : instruction.pickup_handed_over_at
                        ? "Remise déclarée · confirmez votre retrait"
                        : "En attente de remise par la boutique"}
                  </b>
                </div>
                {instruction.pickup_handed_over_at &&
                  !instruction.pickup_client_confirmed_at && (
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptAcknowledged(false);
                        setReceiptToConfirm({
                          receipt_type: "pickup",
                          seller_sale_id: instruction.seller_sale_id,
                          seller_name: instruction.seller_name,
                        });
                      }}
                    >
                      <CheckCircle2 /> Confirmer le retrait
                    </button>
                  )}
              </article>
            ))}
          </div>
          {receiptMessage && <div className="client-payment-feedback success">{receiptMessage}</div>}
          {receiptError && <div className="client-payment-feedback error">{receiptError}</div>}
        </section>
      )}
      {deliveryPeople.length > 0 && (
        <section className="client-delivery-trust">
          <header>
            <div>
              <span>Livraison sécurisée</span>
              <h3>
                {deliveryPeople.length > 1
                  ? "Les livreurs de votre commande"
                  : "Votre livreur VinnHT"}
              </h3>
              <p>Vérifiez son visage avant de remettre ou recevoir votre colis.</p>
            </div>
            <ShieldCheck />
          </header>
          <div className="client-delivery-grid">
            {deliveryPeople.map((person) => (
              <article
                className="client-delivery-person"
                key={person.assignment_id || person.delivery_user_id}
              >
                <span className="client-delivery-photo">
                  {person.delivery_profile_image_url ? (
                    <img
                      src={orderImageSource(person.delivery_profile_image_url)}
                      alt={`Photo de ${person.delivery_name}`}
                      onError={useOrderImageFallback}
                    />
                  ) : (
                    <UserRound />
                  )}
                </span>
                <div>
                  <small>{person.shop_name || "Livraison VinnHT"}</small>
                  <h3>{person.delivery_name}</h3>
                  <p>
                    <ShieldCheck /> Profil livreur vérifié
                  </p>
                  {person.delivery_status && (
                    <b className={`client-delivery-status ${person.delivery_status}`}>
                      {person.delivery_status === "assigned"
                        ? "Assigné"
                        : person.delivery_status === "picked_up"
                          ? "Colis récupéré"
                            : person.delivery_status === "in_transit"
                              ? "En route"
                              : person.delivery_status === "delivered"
                                ? person.client_confirmed_at
                                  ? "Réception confirmée"
                                  : "Signé · à confirmer"
                                : person.delivery_status}
                    </b>
                  )}
                </div>
                <div className="client-delivery-actions">
                  {person.delivery_phone && (
                    <a href={`tel:${person.delivery_phone}`}>
                      <Phone />
                      Appeler
                    </a>
                  )}
                  {person.delivery_status === "delivered" && !person.client_confirmed_at && (
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptAcknowledged(false);
                        setReceiptToConfirm({ ...person, receipt_type: "delivery" });
                      }}
                    >
                      <CheckCircle2 />
                      Confirmer la réception
                    </button>
                  )}
                  {person.client_confirmed_at && (
                    <span className="client-receipt-confirmed">
                      <ShieldCheck />
                      Confirmé depuis votre compte
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
          {receiptMessage && <div className="client-payment-feedback success">{receiptMessage}</div>}
          {receiptError && <div className="client-payment-feedback error">{receiptError}</div>}
        </section>
      )}
      {receiptToConfirm && (
        <div className="client-receipt-modal-backdrop" role="presentation">
          <section
            className="client-receipt-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-receipt-title"
          >
            <span><ShieldCheck /></span>
            <small>Paiement protégé VinnHT</small>
            <h2 id="client-receipt-title">
              {receiptToConfirm.receipt_type === "pickup"
                ? "Confirmez-vous avoir récupéré votre commande ?"
                : "Confirmez-vous avoir reçu cette livraison ?"}
            </h2>
            <p>
              {receiptToConfirm.receipt_type === "pickup"
                ? `La boutique ${receiptToConfirm.seller_name || "VinnHT"} indique vous avoir remis les articles. Confirmez uniquement si vous les avez réellement récupérés.`
                : "La signature a été enregistrée par le livreur. Cette seconde validation depuis votre compte confirme que le colis vous a bien été remis."}
            </p>
            <label>
              <input
                type="checkbox"
                checked={receiptAcknowledged}
                onChange={(event) => setReceiptAcknowledged(event.target.checked)}
              />
              {receiptToConfirm.receipt_type === "pickup"
                ? "Je confirme avoir récupéré mes articles auprès de la boutique."
                : "Je confirme avoir signé et reçu ma commande en main propre."}
            </label>
            <strong>
              Après cette confirmation, la vente pourra être finalisée pour le vendeur.
            </strong>
            <div>
              <button
                type="button"
                className="secondary"
                onClick={() => setReceiptToConfirm(null)}
                disabled={receiptProcessing}
              >
                Pas maintenant
              </button>
              <button
                type="button"
                disabled={!receiptAcknowledged || receiptProcessing}
                onClick={async () => {
                  const confirmed = receiptToConfirm.receipt_type === "pickup"
                    ? await onConfirmPickup?.(
                        order.id,
                        receiptToConfirm.seller_sale_id,
                      )
                    : await onConfirmReceipt?.(
                        order.id,
                        receiptToConfirm.assignment_id,
                      );
                  if (confirmed) setReceiptToConfirm(null);
                }}
              >
                <CheckCircle2 />
                {receiptProcessing ? "Confirmation..." : "Oui, je confirme"}
              </button>
            </div>
          </section>
        </div>
      )}
      <section className="client-order-items-section">
        <header>
          <div>
            <span>Articles</span>
            <h3>{orderItems.length} produit(s) dans cette commande</h3>
          </div>
          <Package />
        </header>
        <div className="order-detail-items">
        {orderItems.map((item) => (
          <article key={item.id}>
            <img
              src={orderImageSource(item.image_url || products[0]?.image_url)}
              alt={item.product_name}
              onError={useOrderImageFallback}
            />
            <div>
              <small>{item.seller_name}</small>
              <h3>{item.product_name}</h3>
              <p>
                {Number(item.pack_size || 1) === 1
                  ? `Quantité : ${item.quantity}`
                  : `${item.quantity} lot(s) de ${item.pack_size} · ${item.units_total} unités`}
              </p>
            </div>
            <strong>{Number(item.subtotal).toLocaleString("fr-HT")} HTG</strong>
          </article>
        ))}
        </div>
      </section>
    </section>
  );
}

export function ClientFavoritesContent({ onAdd, favorites = [], isFavorite, onToggleFavorite }) {
  return (
    <ClientPageFrame
      eyebrow="Votre sélection"
      title="Mes favoris"
      text="Gardez vos meilleures découvertes à portée de main."
    >
      <section className="favorites-showcase">
        <div>
          <span>
            <Heart fill="currentColor" />
          </span>
          <div>
            <small>Collection personnelle</small>
            <h2>{favorites.length} produit(s) sauvegardé(s)</h2>
            <p>Retrouvez ici les produits que vous souhaitez comparer ou acheter plus tard.</p>
          </div>
        </div>
        <Link to="/products">Découvrir d’autres produits</Link>
      </section>
      <div className="client-products-grid favorites-premium-grid">
        {favorites.map((product) => (
          <ClientProductCard
            product={product}
            onAdd={onAdd}
            favorite={isFavorite?.(product.id)}
            onToggleFavorite={onToggleFavorite}
            key={product.id}
          />
        ))}
      </div>
      {!favorites.length && (
        <section className="favorites-empty">
          <Heart />
          <h2>Votre liste de favoris est vide</h2>
          <p>Cliquez sur le cœur d’un produit pour le retrouver ici.</p>
          <Link to="/categories">Explorer les rayons</Link>
        </section>
      )}
    </ClientPageFrame>
  );
}

export function ClientCartContent({
  cart,
  remove,
  updateQuantity,
  priceNotice,
  onDismissPriceNotice,
}) {
  const displayCart = Array.isArray(cart) ? cart : [];
  const groups = useMemo(
    () =>
      displayCart.reduce((result, item) => {
        const seller = item.shop_name || item.seller_name || "Boutique VinnHT";
        result[seller] = [...(result[seller] || []), item];
        return result;
      }, {}),
    [displayCart]
  );
  const subtotal = displayCart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );

  return (
    <ClientPageFrame
      eyebrow="Prêt à commander"
      title="Mon panier"
      text="Vos articles sont organisés par boutique pour une commande plus claire."
    >
      {priceNotice?.changes?.length > 0 && (
        <section className="client-price-update-alert" role="status">
          <span>
            <AlertTriangle />
          </span>
          <div>
            <small>Prix actualisé</small>
            <h3>Une promotion de votre panier est terminée.</h3>
            <p>Vérifiez les nouveaux montants avant de poursuivre votre commande.</p>
            <div>
              {priceNotice.changes.map((change) => (
                <strong key={change.id}>
                  {change.name} : {Number(change.previousPrice).toLocaleString("fr-HT")} HTG
                  <ArrowRight />
                  {Number(change.currentPrice).toLocaleString("fr-HT")} HTG
                </strong>
              ))}
            </div>
          </div>
          <button type="button" onClick={onDismissPriceNotice} aria-label="Fermer l’avertissement">
            <X />
          </button>
        </section>
      )}
      <div className="client-cart-layout">
        <div className="client-cart-groups">
          {displayCart.length ? (
            Object.entries(groups).map(([seller, items]) => (
              <section className="client-cart-seller" key={seller}>
                <header>
                  <span>
                    <Store />
                  </span>
                  <div>
                    <small>Boutique verifiee</small>
                    <h3>{seller}</h3>
                  </div>
                  <ShieldCheck />
                </header>
                {items.map((item) => {
                  const quantity = Number(item.quantity || 1);
                  const price = Number(item.price || 0);
                  const packSize = Number(item.pack_size || 1);
                  const unitsTotal = quantity * packSize;
                  const stock = Math.max(
                    1,
                    Number(item.available_pack_count) ||
                      Math.floor(Number(item.stock || 1) / packSize),
                  );

                  return (
                    <article
                      className="client-cart-item"
                      key={`${item.id}:${packSize}`}
                    >
                      <img src={imageSource(item.image_url) || "/vinnht-logo.png"} alt={item.name} />
                      <div>
                        <small>{item.category_name || "Produit"}</small>
                        <h4>{item.name}</h4>
                        <p>{item.city || "Haiti"}</p>
                        <span className="client-cart-pack-label">
                          <Package size={13} />
                          {packSize === 1
                            ? "À l’unité"
                            : `Lot de ${packSize} · ${unitsTotal} unités au total`}
                        </span>
                      </div>
                      <label className="cart-quantity-control">
                        {packSize === 1 ? "Quantité" : "Nombre de lots"}
                        <input
                          type="number"
                          min="1"
                          max={stock}
                          value={quantity}
                          onChange={(event) =>
                            updateQuantity?.(
                              item.id,
                              event.target.value,
                              packSize,
                            )
                          }
                        />
                        <small>
                          Max. {stock} {packSize === 1 ? "unité(s)" : "lot(s)"}
                        </small>
                      </label>
                      <strong>{(price * quantity).toLocaleString("fr-HT")} HTG</strong>
                      <button
                        onClick={() => remove?.(item.id, packSize)}
                        aria-label={`Retirer ${item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </article>
                  );
                })}
              </section>
            ))
          ) : (
            <section className="client-cart-empty">
              <ShoppingCart />
              <h2>Votre panier est vide</h2>
              <p>Ajoutez des produits depuis le catalogue pour commencer votre commande.</p>
              <Link to="/products">Explorer le catalogue</Link>
            </section>
          )}
        </div>
        <aside className="client-cart-summary">
          <span>Résumé de commande</span>
          <h3>Votre total</h3>
          <section className="cart-reception-preview" aria-label="Options de réception disponibles">
            <div>
              <Store />
              <span>
                <b>Retrait</b>
                <small>Gratuit en boutique</small>
              </span>
            </div>
            <div>
              <Truck />
              <span>
                <b>Livraison</b>
                <small>500 HTG par boutique</small>
              </span>
            </div>
          </section>
          <div>
            <small>Sous-total</small>
            <b>{subtotal.toLocaleString("fr-HT")} HTG</b>
          </div>
          <div className="summary-total">
            <small>Total</small>
            <strong>{subtotal.toLocaleString("fr-HT")} HTG</strong>
          </div>
          {displayCart.length ? (
            <Link to="/checkout">
              Choisir la réception
              <ArrowRight size={17} />
            </Link>
          ) : (
            <button className="client-cart-disabled" disabled>
              Panier vide
            </button>
          )}
          <p>
            <ShieldCheck size={14} />
            Le choix se fait séparément pour chaque boutique à l’étape suivante.
          </p>
        </aside>
      </div>
    </ClientPageFrame>
  );
}

export function ClientCheckoutContent({
  cart,
  user,
  processing,
  result,
  paymentAccount,
  error,
  priceChanges = [],
  continueAfterPriceConfirmation = false,
  onSubmit,
  onConfirmPriceChanges,
  onCancelPriceChanges,
  onSubmitPaymentProof,
}) {
  const [form, setForm] = useState({
    fulfillmentChoices: {},
    address: "",
    city: "Port-au-Prince",
    phone: user?.phone || "",
  });
  const [proof, setProof] = useState(null);
  const [proofNote, setProofNote] = useState("");
  const total = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const sellerInstructions = useMemo(() => {
    const rows = new Map();
    for (const item of cart) {
      const seller = item.seller_name || "Boutique VinnHT";
      const sellerKey = String(item.seller_id || seller);
      const current = rows.get(sellerKey) || {
        seller_id: item.seller_id,
        seller_name: seller,
        moncash_number: item.seller_moncash || "",
        pickup_address: item.seller_pickup_address || "",
        delivery_zones: item.seller_delivery_zones || "",
        opening_hours: item.seller_opening_hours || "",
        has_delivery_driver: Boolean(Number(item.seller_has_delivery_driver || 0)),
        amount: 0,
        line_count: 0,
        unit_count: 0,
        products: [],
      };
      current.amount += Number(item.price || 0) * Number(item.quantity || 0);
      current.line_count += 1;
      current.unit_count += Number(item.quantity || 0) * Number(item.pack_size || 1);
      current.products.push({
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity || 0),
        pack_size: Number(item.pack_size || 1),
      });
      if (!current.moncash_number && item.seller_moncash) current.moncash_number = item.seller_moncash;
      rows.set(sellerKey, current);
    }
    return [...rows.values()];
  }, [cart]);
  const getSellerMethod = (seller) =>
    form.fulfillmentChoices[String(seller.seller_id)] || "pickup";
  const pickupSellers = sellerInstructions.filter(
    (seller) => getSellerMethod(seller) === "pickup",
  );
  const deliverySellers = sellerInstructions.filter(
    (seller) => getSellerMethod(seller) === "delivery",
  );
  const hasPickup = pickupSellers.length > 0;
  const hasDelivery = deliverySellers.length > 0;
  const deliveryFee = deliverySellers.length * 500;
  const orderTotal = total + deliveryFee;
  const fulfillmentChoicesValid =
    sellerInstructions.length > 0 &&
    sellerInstructions.every((seller) =>
      getSellerMethod(seller) === "pickup"
        ? Boolean(seller.pickup_address)
        : Boolean(seller.delivery_zones && seller.has_delivery_driver),
    );

  useEffect(() => {
    setForm((current) => {
      const choices = { ...current.fulfillmentChoices };
      let changed = false;

      for (const seller of sellerInstructions) {
        const key = String(seller.seller_id);
        if (!choices[key]) {
          choices[key] = seller.pickup_address
            ? "pickup"
            : seller.delivery_zones && seller.has_delivery_driver
              ? "delivery"
              : "pickup";
          changed = true;
        } else if (
          choices[key] === "delivery" &&
          (!seller.delivery_zones || !seller.has_delivery_driver)
        ) {
          choices[key] = "pickup";
          changed = true;
        }
      }

      return changed ? { ...current, fulfillmentChoices: choices } : current;
    });
  }, [sellerInstructions]);

  const [expandedSellerId, setExpandedSellerId] = useState(null);

  const selectSellerMethod = (sellerId, method) => {
    setForm((current) => ({
      ...current,
      fulfillmentChoices: {
        ...current.fulfillmentChoices,
        [String(sellerId)]: method,
      },
    }));
  };

  useEffect(() => {
    if (!sellerInstructions.length) {
      setExpandedSellerId(null);
      return;
    }
    setExpandedSellerId((current) =>
      sellerInstructions.some((seller) => Number(seller.seller_id) === Number(current))
        ? current
        : sellerInstructions[0].seller_id,
    );
  }, [sellerInstructions]);

  if (result) {
    const proofSent = Boolean(result.proofUrl || result.reference);
    return (
      <ClientPageFrame
        eyebrow="Commande creee"
        title="Payer VinnHT en toute sécurité"
        text="Effectuez un seul paiement sur le compte MonCash VinnHT, puis envoyez votre preuve."
      >
        <section className="checkout-result-card">
          <span>
            <CheckCircle2 />
          </span>
          <div>
            <small>Numero de commande</small>
            <h2>{result.orderNumber}</h2>
            <p>Total : {Number(result.total).toLocaleString("fr-HT")} HTG</p>
            <b className="checkout-fulfillment-result">
              {result.fulfillmentMethod === "mixed"
                ? `Retrait et livraison · ${Number(result.deliveryFee || 0).toLocaleString("fr-HT")} HTG de livraison`
                : result.fulfillmentMethod === "delivery"
                  ? `Livraison boutique · ${Number(result.deliveryFee || 0).toLocaleString("fr-HT")} HTG`
                  : "Retrait gratuit auprès de la boutique"}
            </b>
          </div>
          <div className="checkout-protected-account">
            <ShieldCheck />
            <div>
              <small>Compte MonCash protégé</small>
              <strong>{result.paymentAccount?.accountName || "VinnHT"}</strong>
              <b>
                {result.paymentAccount?.moncashNumber ||
                  paymentAccount?.moncashNumber ||
                  "Numéro en cours de configuration"}
              </b>
            </div>
            <span>{Number(result.total).toLocaleString("fr-HT")} HTG</span>
          </div>
          {proofSent && (
            <div className="payment-proof-success">
              <CheckCircle2 />
              <span>
                <b>Preuve envoyee</b>
                L’administration VinnHT vérifiera le paiement avant d’autoriser la préparation.
              </span>
            </div>
          )}
          {!proofSent && result.paymentStatus !== "paid" && (
            <form
              className="payment-proof-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (proof) onSubmitPaymentProof(result.id, { file: proof, note: proofNote });
              }}
            >
              <label>
                Preuve de paiement
                <input
                  required
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => setProof(event.target.files?.[0] || null)}
                />
              </label>
              <label>
                Note ou reference MonCash
                <input
                  value={proofNote}
                  onChange={(event) => setProofNote(event.target.value)}
                  placeholder="Transaction, numero, heure du paiement"
                />
              </label>
              <button disabled={processing || !proof} type="submit">
                <CreditCard />
                {processing ? "Envoi..." : "Envoyer la preuve"}
              </button>
            </form>
          )}
          <Link to="/my-orders">
            Suivre ma commande
            <ArrowRight />
          </Link>
        </section>
      </ClientPageFrame>
    );
  }

  return (
    <ClientPageFrame
      eyebrow="Paiement securise"
      title="Finaliser la commande"
      text="Vérifiez la réception choisie et le montant qui sera payé sur le compte VinnHT."
    >
      {priceChanges.length > 0 && (
        <div className="checkout-price-modal-backdrop" role="presentation">
          <section
            className="checkout-price-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-price-modal-title"
          >
            <span>
              <AlertTriangle />
            </span>
            <small>Votre panier a été actualisé</small>
            <h2 id="checkout-price-modal-title">Une promotion est terminée.</h2>
            <p>
              Le prix actuel du vendeur remplace automatiquement le prix promotionnel expiré.
              Confirmez le nouveau montant avant de continuer.
            </p>
            <div className="checkout-price-change-list">
              {priceChanges.map((change) => (
                <article key={change.id}>
                  <strong>{change.name}</strong>
                  <span>
                    <del>{Number(change.previousPrice).toLocaleString("fr-HT")} HTG</del>
                    <ArrowRight />
                    <b>{Number(change.currentPrice).toLocaleString("fr-HT")} HTG</b>
                  </span>
                </article>
              ))}
            </div>
            <div className="checkout-price-modal-actions">
              <button type="button" className="secondary" onClick={onCancelPriceChanges}>
                Revoir mon panier
              </button>
              <button type="button" onClick={onConfirmPriceChanges} disabled={processing}>
                <CheckCircle2 />
                {processing
                  ? "Vérification..."
                  : continueAfterPriceConfirmation
                    ? "Accepter et commander"
                    : "J’ai compris"}
              </button>
            </div>
          </section>
        </div>
      )}
      {error && <div className="client-api-error">{error}</div>}
      <section className="checkout-fulfillment-choice">
        <header>
          <span>Étape 1 · Réception</span>
          <h2>Choisissez comment chaque boutique vous remettra vos produits.</h2>
          <p>
            Sélectionnez l’option la plus simple pour vous. Vous pouvez mélanger retrait en boutique et livraison dans une seule commande.
          </p>
        </header>
        <div className="checkout-fulfillment-guides" aria-hidden="true">
          <article className="pickup-guide">
            <span><Store /></span>
            <div>
              <b>Retrait en boutique</b>
              <small>Vous passez récupérer vos articles à l’adresse indiquée par la boutique. Aucun frais ajouté.</small>
            </div>
          </article>
          <article className="delivery-guide">
            <span><Truck /></span>
            <div>
              <b>Livraison locale</b>
              <small>Le livreur de la boutique vous apporte la commande. 500 HTG sont ajoutés par boutique livrée.</small>
            </div>
          </article>
        </div>
        <div className="checkout-selection-summary" role="status">
          <span className="pickup">
            <Store />
            <b>{pickupSellers.length}</b>
            retrait{pickupSellers.length > 1 ? "s" : ""}
          </span>
          <span className="delivery">
            <Truck />
            <b>{deliverySellers.length}</b>
            livraison{deliverySellers.length > 1 ? "s" : ""}
          </span>
          <strong>
            Frais de livraison : {deliveryFee.toLocaleString("fr-HT")} HTG
          </strong>
        </div>
        <div className="checkout-shop-fulfillment-list">
          {sellerInstructions.map((seller) => {
            const selectedMethod = getSellerMethod(seller);
            const isExpanded = Number(expandedSellerId) === Number(seller.seller_id);
            return (
              <article className={`checkout-shop-fulfillment ${isExpanded ? "expanded" : "collapsed"}`} key={seller.seller_id}>
                <button
                  type="button"
                  className="checkout-shop-fulfillment-toggle"
                  onClick={() =>
                    setExpandedSellerId((current) =>
                      Number(current) === Number(seller.seller_id) ? null : seller.seller_id,
                    )
                  }
                  aria-expanded={isExpanded}
                >
                  <span><Store /></span>
                  <div>
                    <b>{seller.seller_name}</b>
                    <small>
                      {seller.amount.toLocaleString("fr-HT")} HTG · {seller.line_count} article{seller.line_count > 1 ? "s" : ""} · {seller.unit_count} unité{seller.unit_count > 1 ? "s" : ""}
                    </small>
                    <small className="checkout-shop-product-preview">
                      {seller.products
                        .slice(0, 3)
                        .map((product) =>
                          product.pack_size > 1
                            ? `${product.name} (${product.quantity} lot(s) de ${product.pack_size})`
                            : `${product.name} (${product.quantity})`,
                        )
                        .join(" · ")}
                      {seller.products.length > 3 ? ` · +${seller.products.length - 3} autre(s)` : ""}
                    </small>
                  </div>
                  <em className={`checkout-shop-choice-status ${selectedMethod}`}>
                    {selectedMethod === "delivery" ? "Choix actuel · Livraison" : "Choix actuel · Retrait"}
                  </em>
                  <i className={`checkout-shop-toggle-icon ${isExpanded ? "open" : ""}`}>
                    <ChevronDown />
                  </i>
                </button>
                {isExpanded && (
                  <div className="checkout-shop-fulfillment-options">
                    <button
                      type="button"
                      className={`pickup-option ${selectedMethod === "pickup" ? "active" : ""}`}
                      disabled={!seller.pickup_address}
                      onClick={() => selectSellerMethod(seller.seller_id, "pickup")}
                    >
                      <Store />
                      <span>
                        <b>Retrait en boutique</b>
                        <small>
                          {seller.pickup_address ? (
                            <>
                              Gratuit · retrait à{" "}
                              <span className="checkout-pickup-address-highlight">
                                {seller.pickup_address}
                              </span>
                            </>
                          ) : (
                            "Adresse de retrait indisponible"
                          )}
                        </small>
                      </span>
                      {selectedMethod === "pickup" && <CheckCircle2 />}
                    </button>
                    <button
                      type="button"
                      className={`delivery-option ${selectedMethod === "delivery" ? "active" : ""}`}
                      disabled={!seller.delivery_zones || !seller.has_delivery_driver}
                      onClick={() => selectSellerMethod(seller.seller_id, "delivery")}
                    >
                      <Truck />
                      <span>
                        <b>Livraison à votre adresse</b>
                        <small>
                          {!seller.delivery_zones
                            ? "Zone de livraison indisponible"
                            : !seller.has_delivery_driver
                              ? "Aucun livreur actif"
                              : "+ 500 HTG · livreur de la boutique"}
                        </small>
                      </span>
                      {selectedMethod === "delivery" && <CheckCircle2 />}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
      <form
        className="client-checkout-layout"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({
            ...form,
            fulfillmentChoices: Object.fromEntries(
              sellerInstructions.map((seller) => [
                String(seller.seller_id),
                getSellerMethod(seller),
              ]),
            ),
          });
        }}
      >
        <section className="checkout-address-card">
          <div className="checkout-step-heading">
            <span>Étape 2 · Vos informations</span>
            <h2>{hasDelivery ? "Où devons-nous livrer ?" : "Comment pouvons-nous vous joindre ?"}</h2>
            <p>
              {hasDelivery
                ? "Indiquez une seule adresse pour tous les articles livrés."
                : "Vérifiez votre téléphone avant de confirmer les retraits."}
            </p>
          </div>
          {hasDelivery && (
            <div className="checkout-delivery-address-fields">
              <label>
                Adresse complète
                <input
                  required
                  minLength="8"
                  value={form.address}
                  onChange={(event) => setForm({ ...form, address: event.target.value })}
                  placeholder="Rue, numéro, quartier"
                />
              </label>
              <label>
                Ville
                <input
                  required
                  value={form.city}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                />
              </label>
            </div>
          )}
          <label>
            Téléphone
            <input
              required
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="+509..."
            />
          </label>
          <div className="checkout-reception-plan">
            <header>
              <b>Récapitulatif de réception</b>
              <small>Vérifiez rapidement ce que vous récupérez et ce qui sera livré.</small>
            </header>
            {sellerInstructions.map((instruction) => {
              const method = getSellerMethod(instruction);
              return (
                <article
                  className={method}
                  key={instruction.seller_id || instruction.seller_name}
                >
                  <span>{method === "delivery" ? <Truck /> : <Store />}</span>
                  <div>
                    <b>{instruction.seller_name}</b>
                    <strong>
                      {method === "delivery" ? "La boutique vous livre · 500 HTG" : "Vous passez récupérer · Gratuit"}
                    </strong>
                    <small>
                      {method === "delivery"
                        ? `Zone couverte : ${instruction.delivery_zones || "non renseignée"}`
                        : `Adresse de retrait : ${instruction.pickup_address || "non renseignée"}`}
                    </small>
                    {method === "pickup" && instruction.opening_hours && (
                      <small>{instruction.opening_hours}</small>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <aside className="client-cart-summary checkout-summary">
          <span>Étape 3 · Résumé</span>
          <h3>{cart.length} article(s)</h3>
          {cart.map((item) => (
            <div key={`${item.id}:${item.pack_size || 1}`}>
              <small>
                {item.name} · {Number(item.pack_size || 1) === 1
                  ? `${item.quantity} unité(s)`
                  : `${item.quantity} lot(s) de ${item.pack_size}`}
              </small>
              <b>{(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString("fr-HT")} HTG</b>
            </div>
          ))}
          {hasDelivery && (
            <div>
              <small>Livraison ({deliverySellers.length} boutique(s) × 500 HTG)</small>
              <b>{deliveryFee.toLocaleString("fr-HT")} HTG</b>
            </div>
          )}
          <div className="summary-total">
            <small>Total</small>
            <strong>{orderTotal.toLocaleString("fr-HT")} HTG</strong>
          </div>
          <section className="checkout-summary-payment">
            <ShieldCheck />
            <span>
              <small>Paiement protégé</small>
              <b>{paymentAccount?.accountName || "VinnHT"}</b>
              <strong>
                {paymentAccount?.moncashNumber || "Numéro MonCash à configurer"}
              </strong>
            </span>
          </section>
          <button
            disabled={
              processing ||
              !cart.length ||
              !fulfillmentChoicesValid
            }
            type="submit"
          >
            {processing ? "Création en cours..." : "Confirmer la commande"}
            <ArrowRight />
          </button>
        </aside>
      </form>
    </ClientPageFrame>
  );
}

export function ClientMessagesContent() {
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [conversations, setConversations] = useState(() =>
    JSON.parse(
      null ||
        JSON.stringify([
          {
            name: "Tech Ayiti",
            initials: "TA",
            online: true,
            messages: [
              { type: "received", text: "Bonjour, merci d’avoir choisi notre boutique." },
              { type: "sent", text: "Ma commande sera-t-elle livrée aujourd’hui " },
              { type: "received", text: "Oui, elle sera confiée au livreur cet après-midi." },
            ],
          },
          {
            name: "Marché Lakay",
            initials: "ML",
            online: false,
            messages: [{ type: "received", text: "Merci pour votre achat." }],
          },
          {
            name: "Support VinnHT",
            initials: "VH",
            online: true,
            messages: [{ type: "received", text: "Comment pouvons-nous vous aider " }],
          },
        ])
    )
  );

  useEffect(() => {
    return undefined;
  }, [conversations]);

  const visibleConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(query.toLowerCase())
  );
  const current = conversations[active] || conversations[0];

  const sendMessage = (event) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setConversations((items) =>
      items.map((conversation, index) =>
        index === active
           ? {
              ...conversation,
              messages: [...conversation.messages, { type: "sent", text: draft.trim() }],
            }
          : conversation
      )
    );
    setDraft("");
  };

  return (
    <ClientPageFrame
      eyebrow="Communication"
      title="Messages"
      text="Discutez directement avec les boutiques et le support VinnHT."
    >
      <div className="client-messages-shell">
        <aside className="conversation-list">
          <label>
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher"
            />
          </label>
          {visibleConversations.map((conversation) => {
            const index = conversations.indexOf(conversation);
            const lastMessage = conversation.messages.at(-1).text;
            return (
              <button
                className={active === index ? "active" : ""}
                onClick={() => setActive(index)}
                key={conversation.name}
              >
                <span>{conversation.initials}</span>
                <p>
                  <b>{conversation.name}</b>
                  <small>{lastMessage}</small>
                </p>
                <time>{conversation.online ? "En ligne" : "Hors ligne"}</time>
              </button>
            );
          })}
        </aside>
        <section className="conversation-room">
          <header>
            <span>{current.initials}</span>
            <div>
              <h3>{current.name}</h3>
              <p>
                <i />
                {current.online ? "En ligne" : "Hors ligne"}
              </p>
            </div>
            <button>
              <CircleUserRound />
            </button>
          </header>
          <div className="message-history">
            {current.messages.map((message, index) => (
              <p className={message.type} key={`${message.text}-${index}`}>
                {message.text}
              </p>
            ))}
          </div>
          <form onSubmit={sendMessage}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Écrire un message..."
            />
            <button aria-label="Envoyer le message">
              <Send />
            </button>
          </form>
        </section>
      </div>
    </ClientPageFrame>
  );
}

export function ClientProfileContent({ api, user, updateUser, onLogout }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    activityStatus: user?.activity_status || "other",
    activityOrganization: user?.activity_organization || "",
    activityDetails: user?.activity_details || "",
  });
  const [message, setMessage] = useState("");

  const save = async (event) => {
    event.preventDefault();
    const data = new FormData();
    data.append("name", form.name);
    data.append("phone", form.phone);
    data.append("activityStatus", form.activityStatus);
    data.append("activityOrganization", form.activityOrganization);
    data.append("activityDetails", form.activityDetails);
    try {
      const { data: response } = await api.patch("/auth/profile", data);
      updateUser?.(response.user);
      setMessage(response.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Impossible de mettre le profil a jour.");
    }
  };

  return (
    <ClientPageFrame
      eyebrow="Informations personnelles"
      title="Mon profil"
      text="Gardez vos informations a jour pour faciliter vos achats et livraisons."
    >
      <div className="client-profile-grid">
        <aside className="client-profile-card">
          <ProfilePhotoManager
            api={api}
            user={user}
            updateUser={updateUser}
            onMessage={setMessage}
          />
          <h2>{user?.name || "Client VinnHT"}</h2>
          <p>{user?.email || "client@vinnht.ht"}</p>
          <b>{clientActivityLabel(user?.activity_status)}</b>
        </aside>
        <form className="client-profile-form" onSubmit={save}>
          <header>
            <div>
              <span>Profil client</span>
              <h2>Informations du compte</h2>
            </div>
            {message && <strong>{message}</strong>}
          </header>
          <div className="profile-form-grid">
            <label>
              Nom complet
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>
            <label>
              Adresse email
              <input value={user?.email || "client@vinnht.ht"} disabled />
            </label>
            <label>
              Telephone
              <input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </label>
            <label>
              Situation actuelle
              <select
                value={form.activityStatus}
                onChange={(event) =>
                  setForm({
                    ...form,
                    activityStatus: event.target.value,
                    activityOrganization: "",
                    activityDetails: "",
                  })
                }
              >
                {clientActivityOptions.map(([value, label]) => (
                  <option value={value} key={value}>{label}</option>
                ))}
              </select>
            </label>
            {["school", "university", "employee", "entrepreneur"].includes(
              form.activityStatus,
            ) && (
              <label>
                Établissement ou entreprise
                <input
                  required
                  value={form.activityOrganization}
                  onChange={(event) =>
                    setForm({ ...form, activityOrganization: event.target.value })
                  }
                />
              </label>
            )}
            {["self_employed", "other"].includes(form.activityStatus) && (
              <label>
                Précision
                <input
                  required
                  value={form.activityDetails}
                  onChange={(event) =>
                    setForm({ ...form, activityDetails: event.target.value })
                  }
                />
              </label>
            )}
            <label>
              Ville
              <input defaultValue="Port-au-Prince" />
            </label>
            <label className="full-field">
              Adresse de livraison
              <input defaultValue="Delmas 60, Port-au-Prince" />
            </label>
          </div>
          <button className="client-profile-save-button">
            <Edit3 /> Modifier profil
          </button>
          <MobileProfileActions onLogout={onLogout} settingsPath="/settings" />
        </form>
      </div>
    </ClientPageFrame>
  );
}

export function ClientSettingsContent({ api }) {
  const [securityMessage, setSecurityMessage] = useState("");
  const defaults = {
    orderUpdates: true,
    messages: true,
    profileVisibility: false,
  };
  const [preferences, setPreferences] = useState(defaults);
  const settings = [
    [Bell, "Suivi des commandes", "Recevoir les changements de statut.", "orderUpdates"],
    [MessageCircle, "Nouveaux messages", "Être alerté lorsqu’un vendeur répond.", "messages"],
    [
      ShieldCheck,
      "Profil public",
      "Afficher votre photo dans les avis publics laissés aux boutiques.",
      "profileVisibility",
    ],
  ];

  useEffect(() => {
    api.get("/preferences/client").then(({ data }) => setPreferences({ ...defaults, ...data }));
  }, []);

  const togglePreference = async (key) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    try {
      const { data } = await api.put("/preferences/client", { preferences: next });
      setSecurityMessage(data.message);
    } catch (error) {
      setPreferences(preferences);
      setSecurityMessage(error.response?.data?.message || "Impossible d’enregistrer ce paramètre.");
    }
  };

  return (
    <ClientPageFrame
      eyebrow="Préférences"
      title="Paramètres"
      text="Personnalisez votre expérience VinnHT simplement."
    >
      <div className="client-settings-grid">
        {settings.map(([Icon, title, text, key]) => (
          <motion.article whileHover={{ y: -4 }} key={title}>
            <span>
              <Icon />
            </span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
            <label className="client-toggle">
              <input
                type="checkbox"
                checked={preferences[key]}
                onChange={() => togglePreference(key)}
              />
              <i />
            </label>
          </motion.article>
        ))}
      </div>
      <AccountSecuritySettings api={api} onMessage={setSecurityMessage} />
      {securityMessage && <div className="client-api-notice">{securityMessage}</div>}
    </ClientPageFrame>
  );
}

function ClientPageFrame({ eyebrow, title, text, children }) {
  return (
    <div className="client-space client-page">
      <motion.header
        className="client-page-header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </motion.header>
      {children}
    </div>
  );
}




