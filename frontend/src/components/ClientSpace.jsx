import React, { useEffect, useMemo, useState } from "react";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock3,
  CreditCard,
  Eye,
  Flame,
  Headphones,
  Heart,
  HelpCircle,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Package,
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
} from "lucide-react";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Link } from "react-router-dom";
import ProfilePhotoManager from "./ProfilePhotoManager.jsx";
import ProfileLogoutCard from "./ProfileLogoutCard.jsx";
import { apiOrigin } from "../config/runtime.js";

const imageSource = (url) =>
  url?.startsWith("/uploads") ? `${apiOrigin}${url}` : url;
const clientProductPrice = (product) => {
  const activeOffer =
    product?.is_featured &&
    Number(product?.promotional_price) > 0 &&
    Number(product.promotional_price) < Number(product.price) &&
    (!product.offer_ends_at || new Date(product.offer_ends_at) > new Date());

  return activeOffer ? Number(product.promotional_price) : Number(product.price);
};

const products = [
  {
    id: 101,
    name: "Casque audio premium",
    price: 7850,
    city: "Pétion-Ville",
    category_name: "Électronique",
    seller_name: "Tech Ayiti",
    image_url:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 102,
    name: "Fauteuil contemporain",
    price: 18900,
    city: "Delmas",
    category_name: "Maison & Meubles",
    seller_name: "Kay Design",
    image_url:
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 103,
    name: "Sac artisanal haïtien",
    price: 4200,
    city: "Jacmel",
    category_name: "Mode",
    seller_name: "Kreyol Chic",
    image_url:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 104,
    name: "Smartphone reconditionné",
    price: 24500,
    city: "Cap-Haïtien",
    category_name: "Électronique",
    seller_name: "Mobile Plus",
    image_url:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 105,
    name: "Panier fraîcheur peyi",
    price: 2450,
    city: "Port-au-Prince",
    category_name: "Supermarché",
    seller_name: "Marché Lakay",
    image_url:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 106,
    name: "Montre minimaliste",
    price: 9800,
    city: "Delmas",
    category_name: "Mode",
    seller_name: "Urban Store",
    image_url:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
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
  return (
    <motion.article
      className={`client-product-card ${compact ? "compact" : ""}`}
      whileHover={{ y: -6 }}
    >
      <div className="client-product-image">
        <img src={imageSource(product.image_url)} alt={product.name} />
        {product.is_featured && (
          <img
            className="client-best-price-ribbon"
            src="/best-price-ribbon.png"
            alt="Meilleur prix"
          />
        )}
        <button
          className={favorite ? "active" : ""}
          onClick={() => onToggleFavorite?.(product)}
          aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart size={17} fill={favorite ? "currentColor" : "none"} />
        </button>
        {!compact && !product.is_featured && <span>Nouveau</span>}
      </div>
      <div className="client-product-info">
        <small>
          <MapPin size={12} />
          {product.city}
        </small>
        <Link to={`/products/${product.id}`}>{product.name}</Link>
        <p>
          <ShieldCheck size={13} />
          {product.seller_name}
        </p>
        <div>
          <strong>{clientProductPrice(product).toLocaleString("fr-HT")} HTG</strong>
          <button onClick={() => onAdd?.(product)} aria-label="Ajouter au panier">
            <ShoppingCart size={17} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function ClientStats({ dashboard, seller }) {
  const counts = dashboard?.stats || {};
  const stats = [
    [Package, "Commandes totales", Number(counts.orders || 0), "Toutes vos commandes"],
    [Heart, "Produits favoris", Number(counts.favorites || 0), "Sélection personnelle"],
    [ShoppingCart, "Articles dans le panier", Number(counts.cart_items || 0), "Prêts à commander"],
    [Store, "Statut vendeur", null, seller ? "Vendeur approuvé" : dashboard?.sellerRequest?.status || "Client standard"],
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
  const catalog = productData;
  const activeOrder = dashboardData?.activeOrder;
  const activityItems = dashboardData?.activity || [];
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
          <h1>Bonjour, {user?.name || "Client"} 👋</h1>
          <p>Découvrez les meilleures offres du moment sur VinnHT.</p>
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

      <ClientStats dashboard={dashboardData} seller={user?.roles?.includes("seller")} />

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
        <div>
          <span>
            <Flame size={16} />
            Offres spéciales VinnHT
          </span>
          <h2>Des prix pensés pour votre quotidien.</h2>
          <p>Découvrez les réductions, nouveautés et produits populaires sélectionnés pour vous.</p>
          <Link to="/products?offers=true">
            Voir les offres
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="promo-badges">
          {offerData.length ? (
            offerData.slice(0, 3).map((offer) => (
              <motion.div whileHover={{ scale: 1.04 }} key={offer.id}>
                <Link to={`/products/${offer.id}`}>
                  <Tag />
                  <span>
                    <b>{offer.name}</b>
                    {Number(offer.promotional_price).toLocaleString("fr-HT")} HTG
                  </span>
                </Link>
              </motion.div>
            ))
          ) : <span>Aucune offre spéciale active actuellement.</span>}
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

      {!user?.roles?.includes("seller") && (
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
            <strong>{dashboardData?.sellerRequest?.status || "Client standard"}</strong>
            <small>{dashboardData?.sellerRequest ? "Votre demande est suivie par VinnHT." : "Votre boutique peut commencer ici."}</small>
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
            const rating = realShop
              ? Number(shop.review_count) > 0
                ? `${Number(shop.rating).toFixed(1)} (${shop.review_count})`
                : "Nouveau"
              : "";
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
            <b>Besoin d’aide ?</b>
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
            <img src={order.image || products[0].image_url} alt="" />
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
      {selectedOrder && <ClientOrderDetail order={selectedOrder} />}
    </ClientPageFrame>
  );
}

function ClientOrderDetail({ order }) {
  const steps = ["confirmed", "processing", "shipped", "delivered"];
  const currentIndex = steps.indexOf(order.status);

  return (
    <section className="client-order-detail">
      <header>
        <div>
          <span>Suivi détaillé</span>
          <h2>{order.order_number}</h2>
          <p>{order.delivery_address}</p>
        </div>
        <strong>{Number(order.total).toLocaleString("fr-HT")} HTG</strong>
      </header>
      <div className="client-order-progress detail-progress">
        {["Payée", "Préparation", "En livraison", "Livrée"].map((label, index) => (
          <div className={currentIndex >= index ? "done" : ""} key={label}>
            <span>{currentIndex >= index ? <CheckCircle2 /> : index + 1}</span>
            <small>{label}</small>
          </div>
        ))}
      </div>
      {order.delivery_name && (
        <article className="client-delivery-person">
          <span>
            {order.delivery_profile_image_url ? (
              <img
                src={`${apiOrigin}${order.delivery_profile_image_url}`}
                alt={`Photo de ${order.delivery_name}`}
              />
            ) : (
              <UserRound />
            )}
          </span>
          <div>
            <small>Votre livreur VinnHT</small>
            <h3>{order.delivery_name}</h3>
            <p>
              <ShieldCheck /> Profil livreur vérifié
            </p>
          </div>
          {order.delivery_phone && (
            <a href={`tel:${order.delivery_phone}`}>{order.delivery_phone}</a>
          )}
        </article>
      )}
      <div className="order-detail-items">
        {order.items?.map((item) => (
          <article key={item.id}>
            <img src={item.image_url || products[0].image_url} alt={item.product_name} />
            <div>
              <small>{item.seller_name}</small>
              <h3>{item.product_name}</h3>
              <p>Quantité : {item.quantity}</p>
            </div>
            <strong>{Number(item.subtotal).toLocaleString("fr-HT")} HTG</strong>
          </article>
        ))}
      </div>
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
          <div className="favorite-product-wrap" key={product.id}>
            <ClientProductCard
              product={product}
              onAdd={onAdd}
              favorite={isFavorite?.(product.id)}
              onToggleFavorite={onToggleFavorite}
            />
            <button className="remove-favorite" onClick={() => onToggleFavorite?.(product)}>
              <Trash2 size={15} />
              Supprimer des favoris
            </button>
          </div>
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

export function ClientCartContent({ cart, remove, updateQuantity }) {
  const displayCart = cart;
  const groups = useMemo(
    () =>
      displayCart.reduce((result, item) => {
        result[item.seller_name] = [...(result[item.seller_name] || []), item];
        return result;
      }, {}),
    [displayCart]
  );
  const subtotal = displayCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = displayCart.length ? 650 : 0;

  return (
    <ClientPageFrame
      eyebrow="Prêt à commander"
      title="Mon panier"
      text="Vos articles sont organisés par vendeur pour une commande plus claire."
    >
      <div className="client-cart-layout">
        <div className="client-cart-groups">
          {Object.entries(groups).map(([seller, items]) => (
            <section className="client-cart-seller" key={seller}>
              <header>
                <span>
                  <Store />
                </span>
                <div>
                  <small>Boutique vérifiée</small>
                  <h3>{seller}</h3>
                </div>
                <ShieldCheck />
              </header>
              {items.map((item) => (
                <article className="client-cart-item" key={item.id}>
                  <img src={item.image_url} alt={item.name} />
                  <div>
                    <small>{item.category_name}</small>
                    <h4>{item.name}</h4>
                    <p>{item.city}</p>
                  </div>
                  <label className="cart-quantity-control">
                    Qté
                    <input
                      type="number"
                      min="1"
                      max={Number(item.stock)}
                      value={item.quantity}
                      onChange={(event) => updateQuantity?.(item.id, event.target.value)}
                    />
                    <small>Max. {item.stock}</small>
                  </label>
                  <strong>{(item.price * item.quantity).toLocaleString("fr-HT")} HTG</strong>
                  <button onClick={() => remove?.(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </article>
              ))}
            </section>
          ))}
        </div>
        <aside className="client-cart-summary">
          <span>Résumé de commande</span>
          <h3>Votre total</h3>
          <div>
            <small>Sous-total</small>
            <b>{subtotal.toLocaleString("fr-HT")} HTG</b>
          </div>
          <div>
            <small>Livraison estimée</small>
            <b>{delivery.toLocaleString("fr-HT")} HTG</b>
          </div>
          <div className="summary-total">
            <small>Total</small>
            <strong>{(subtotal + delivery).toLocaleString("fr-HT")} HTG</strong>
          </div>
          <Link to="/checkout">
            Passer au paiement
            <ArrowRight size={17} />
          </Link>
          <p>
            <ShieldCheck size={14} />
            Paiement sécurisé et suivi VinnHT
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
  error,
  onSubmit,
  onSimulatePayment,
}) {
  const [form, setForm] = useState({
    address: "",
    city: "Port-au-Prince",
    phone: user?.phone || "",
  });
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (result) {
    return (
      <ClientPageFrame
        eyebrow="Commande créée"
        title="Finaliser le paiement"
        text="Votre commande est enregistrée. Confirmez maintenant le paiement simulé."
      >
        <section className="checkout-result-card">
          <span>
            <CheckCircle2 />
          </span>
          <div>
            <small>Numéro de commande</small>
            <h2>{result.orderNumber}</h2>
            <p>Total : {Number(result.total).toLocaleString("fr-HT")} HTG</p>
          </div>
          <button
            disabled={processing || result.paymentStatus === "paid"}
            onClick={() => onSimulatePayment(result.id, "paid")}
          >
            <CreditCard />
            {result.paymentStatus === "paid" ? "Paiement confirmé" : "Simuler le paiement"}
          </button>
          <button
            className="payment-fail-button"
            disabled={processing || result.paymentStatus === "paid"}
            onClick={() => onSimulatePayment(result.id, "failed")}
          >
            Simuler un échec
          </button>
          {result.paymentStatus === "paid" && (
            <Link to="/my-orders">
              Suivre ma commande
              <ArrowRight />
            </Link>
          )}
        </section>
      </ClientPageFrame>
    );
  }

  return (
    <ClientPageFrame
      eyebrow="Paiement sécurisé"
      title="Finaliser la commande"
      text="Vérifiez votre adresse et le résumé avant de créer la commande."
    >
      {error && <div className="client-api-error">{error}</div>}
      <form
        className="client-checkout-layout"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <section className="checkout-address-card">
          <div>
            <span>Livraison</span>
            <h2>Adresse de réception</h2>
          </div>
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
          <label>
            Téléphone
            <input
              required
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="+509..."
            />
          </label>
          <div className="checkout-payment-method">
            <CreditCard />
            <span>
              <b>Paiement simulé</b>
              Préparé pour l’intégration MonCash.
            </span>
            <ShieldCheck />
          </div>
        </section>
        <aside className="client-cart-summary checkout-summary">
          <span>Résumé</span>
          <h3>{cart.length} article(s)</h3>
          {cart.map((item) => (
            <div key={item.id}>
              <small>
                {item.name} × {item.quantity}
              </small>
              <b>{(item.price * item.quantity).toLocaleString("fr-HT")} HTG</b>
            </div>
          ))}
          <div className="summary-total">
            <small>Total</small>
            <strong>{total.toLocaleString("fr-HT")} HTG</strong>
          </div>
          <button disabled={processing || !cart.length} type="submit">
            {processing ? "Création en cours..." : "Créer la commande"}
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
      localStorage.getItem("vinnht_messages") ||
        JSON.stringify([
          {
            name: "Tech Ayiti",
            initials: "TA",
            online: true,
            messages: [
              { type: "received", text: "Bonjour, merci d’avoir choisi notre boutique." },
              { type: "sent", text: "Ma commande sera-t-elle livrée aujourd’hui ?" },
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
            messages: [{ type: "received", text: "Comment pouvons-nous vous aider ?" }],
          },
        ])
    )
  );

  useEffect(() => {
    localStorage.setItem("vinnht_messages", JSON.stringify(conversations));
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
            const lastMessage = conversation.messages.at(-1)?.text;
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
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(
    user?.profile_image_url ? `${apiOrigin}${user.profile_image_url}` : ""
  );
  const [message, setMessage] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const uploadPhoto = async (file) => {
    if (!file) return;
    setUploadingPhoto(true);
    setMessage("");
    try {
      const data = new FormData();
      data.append("profilePhoto", file);
      const { data: response } = await api.patch("/auth/profile", data);
      updateUser(response.user);
      setPreview(`${apiOrigin}${response.user.profile_image_url}?v=${Date.now()}`);
      setPhoto(null);
      setMessage("Photo de profil mise à jour.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Impossible d’enregistrer cette photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    const data = new FormData();
    data.append("name", form.name);
    data.append("phone", form.phone);
    if (photo) data.append("profilePhoto", photo);
    const { data: response } = await api.patch("/auth/profile", data);
    updateUser(response.user);
    setMessage(response.message);
  };

  return (
    <ClientPageFrame
      eyebrow="Informations personnelles"
      title="Mon profil"
      text="Gardez vos informations à jour pour faciliter vos achats et livraisons."
    >
      <div className="client-profile-grid">
        <aside className="client-profile-card">
          <div className="profile-photo-picker legacy-photo-picker">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setPhoto(file || null);
                if (file) setPreview(URL.createObjectURL(file));
                uploadPhoto(file);
              }}
            />
            <span>{preview ? <img src={preview} alt="Photo de profil" /> : <UserRound />}</span>
            <small>{uploadingPhoto ? "Enregistrement..." : "Changer la photo"}</small>
          </div>
          <ProfilePhotoManager
            api={api}
            user={user}
            updateUser={updateUser}
            onMessage={setMessage}
          />
          <h2>{user?.name || "Client VinnHT"}</h2>
          <p>{user?.email || "client@vinnht.ht"}</p>
          <b>Client vérifié</b>
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
              <input defaultValue={user?.email || "client@vinnht.ht"} />
            </label>
            <label>
              Téléphone
              <input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </label>
            <label>
              Ville
              <input defaultValue="Port-au-Prince" />
            </label>
            <label className="full-field">
              Adresse de livraison
              <input defaultValue="Delmas 60, Port-au-Prince" />
            </label>
          </div>
          <button className="save-profile">Enregistrer les modifications</button>
        </form>
      </div>
      <ProfileLogoutCard onLogout={onLogout} />
    </ClientPageFrame>
  );
}

export function ClientSettingsContent({ api }) {
  const [securityMessage, setSecurityMessage] = useState("");
  const defaults = {
    orderUpdates: true,
    promotions: true,
    messages: true,
    profileVisibility: false,
  };
  const [preferences, setPreferences] = useState(defaults);
  const settings = [
    [Bell, "Suivi des commandes", "Recevoir les changements de statut.", "orderUpdates"],
    [Sparkles, "Offres et promotions", "Recevoir les meilleures offres VinnHT.", "promotions"],
    [MessageCircle, "Nouveaux messages", "Être alerté lorsqu’un vendeur répond.", "messages"],
    [
      ShieldCheck,
      "Profil public",
      "Autoriser l’affichage public de votre profil.",
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
      <section className="settings-security-panel">
        <span>
          <LockKeyhole />
        </span>
        <div>
          <small>Sécurité du compte</small>
          <h2>Votre session est protégée</h2>
          <p>Un changement de mot de passe et la double authentification seront disponibles ici.</p>
        </div>
        <button
          onClick={() => setSecurityMessage("Votre session actuelle est active et sécurisée.")}
        >
          Vérifier ma session
        </button>
      </section>
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
