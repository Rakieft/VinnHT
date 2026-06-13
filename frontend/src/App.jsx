import axios from "axios";
import React from "react";
import Lottie from "lottie-react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  Car,
  ChevronRight,
  CircleUserRound,
  Heart,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Package,
  Phone,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  Smartphone,
  Sofa,
  Sparkles,
  Star,
  Store,
  Truck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  AnimatedSection,
  Badge,
  Button,
  EmptyState,
  SearchBar,
  StatCard,
} from "./components/ui.jsx";
import {
  ClientCartContent,
  ClientCheckoutContent,
  ClientDashboardContent,
  ClientFavoritesContent,
  ClientMessagesContent,
  ClientOrdersContent,
  ClientProfileContent,
  ClientSettingsContent,
} from "./components/ClientSpace.jsx";
import {
  AddSellerProductContent,
  SellerDashboardContent,
  SellerOrdersContent,
  SellerPayoutsContent,
  SellerProfileContent,
  SellerProductsContent,
  SellerSalesContent,
  SellerSettingsContent,
  SellerShopContent,
  SupervisorRequestsContent,
  SupervisorRequestDetailContent,
} from "./components/SellerFlow.jsx";
import {
  DeliveryDashboardContent,
  DeliveryManagementContent,
  DeliveryMissionsContent,
  DeliveryProfileContent,
} from "./components/DeliveryFlow.jsx";
import {
  AdminCategoriesContent,
  AdminContactRequestsContent,
  AdminDashboardContent,
  AdminPaymentsContent,
  AdminProfileContent,
  AdminProductsContent,
  AdminResourceContent,
  AdminSettingsContent,
  AdminUsersContent,
  OperationsDashboardContent,
  ReportsContent,
  SellersOverviewContent,
  StaffProfileContent,
  StaffSettingsContent,
} from "./components/AdminFlow.jsx";
import BecomeSellerPage from "./pages/client/BecomeSeller.jsx";
import MarketplaceMessages from "./components/MarketplaceMessages.jsx";
import { apiOrigin, assetUrl } from "./config/runtime.js";
import "./styles/responsive-overrides.css";
import "./styles/auth-search.css";
import "./styles/brand-auth-fixes.css";
import "./styles/dashboard-navigation.css";
import "./styles/client-space.css";
import "./styles/seller-flow.css";
import "./styles/delivery-flow.css";
import "./styles/admin-flow.css";

const api = axios.create({ baseURL: `${apiOrigin}/api`, withCredentials: true });
const whatsappNumber = (value = "") => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 8 ? `509${digits}` : digits;
};
const productPrice = (product) => {
  const promotionIsActive =
    product?.is_featured &&
    Number(product?.promotional_price) > 0 &&
    Number(product.promotional_price) < Number(product.price) &&
    (!product.offer_ends_at || new Date(product.offer_ends_at) > new Date());

  return promotionIsActive ? Number(product.promotional_price) : Number(product?.price || 0);
};

function WhatsAppIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12 2a9.7 9.7 0 0 0-8.42 14.52L2 22l5.63-1.48A9.9 9.9 0 1 0 12 2Zm0 17.82a8 8 0 0 1-4.08-1.12l-.29-.17-3.34.88.89-3.25-.19-.31A7.84 7.84 0 1 1 12 19.82Zm4.3-5.87c-.24-.12-1.4-.69-1.61-.77-.22-.08-.38-.12-.54.12-.16.23-.61.77-.75.93-.14.16-.28.18-.52.06-2.03-1.01-3.36-1.81-4.7-4.11-.36-.62.36-.58 1.03-1.92.11-.23.05-.43-.03-.55-.06-.12-.53-1.3-.73-1.77-.2-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.29-.22.24-.84.82-.84 2 0 1.17.86 2.31.97 2.47.12.16 1.68 2.56 4.07 3.59 1.51.65 2.1.71 2.85.6.46-.07 1.4-.57 1.6-1.13.2-.55.2-1.03.14-1.13-.06-.1-.22-.16-.46-.28Z"
      />
    </svg>
  );
}
const AuthContext = createContext(null);
const CartContext = createContext(null);
const FavoritesContext = createContext(null);
const useAuth = () => useContext(AuthContext);
const useCart = () => useContext(CartContext);
const useFavorites = () => useContext(FavoritesContext);
const roleHome = {
  client: "/client",
  seller: "/seller",
  delivery: "/delivery",
  supervisor: "/supervisor",
  manager: "/manager",
  admin: "/admin",
};
const switchableAccountRoles = ["client", "seller", "delivery"];
const roleDisplay = {
  client: { label: "Espace client", icon: CircleUserRound },
  seller: { label: "Espace vendeur", icon: Store },
  delivery: { label: "Espace livreur", icon: Truck },
};

const lottiePulse = {
  v: "5.7.0",
  fr: 30,
  ip: 0,
  op: 90,
  w: 360,
  h: 360,
  nm: "VinnHT",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "orb",
      ks: {
        o: { k: 90 },
        r: {
          k: [
            { t: 0, s: [0] },
            { t: 90, s: [360] },
          ],
        },
        p: { k: [180, 180, 0] },
        a: { k: [0, 0, 0] },
        s: {
          k: [
            { t: 0, s: [95, 95, 100] },
            { t: 45, s: [108, 108, 100] },
            { t: 90, s: [95, 95, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: "gr",
          it: [
            { ty: "el", p: { k: [0, 0] }, s: { k: [210, 210] } },
            {
              ty: "gf",
              p: { k: [0, 0] },
              s: { k: [210, 210] },
              g: {
                p: 3,
                k: { k: [0, 0.15, 0.39, 0.92, 0.55, 0.96, 0.62, 0.16, 1, 0.06, 0.09, 0.16] },
              },
              o: { k: 100 },
              r: 1,
            },
            {
              ty: "tr",
              p: { k: [0, 0] },
              a: { k: [0, 0] },
              s: { k: [100, 100] },
              r: { k: 0 },
              o: { k: 100 },
            },
          ],
        },
      ],
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "bag",
      ks: {
        o: { k: 100 },
        r: { k: 0 },
        p: { k: [180, 185, 0] },
        a: { k: [0, 0, 0] },
        s: { k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: "gr",
          it: [
            { ty: "rc", s: { k: [130, 115] }, p: { k: [0, 18] }, r: { k: 24 } },
            { ty: "st", c: { k: [1, 1, 1, 1] }, w: { k: 10 }, o: { k: 95 } },
            {
              ty: "tr",
              p: { k: [0, 0] },
              a: { k: [0, 0] },
              s: { k: [100, 100] },
              r: { k: 0 },
              o: { k: 100 },
            },
          ],
        },
      ],
    },
  ],
};

const categories = [
  [
    "Supermarché",
    "supermarche",
    ShoppingBasket,
    "Produits frais, essentiels et promos du quotidien",
  ],
  ["Électronique", "electronique", Smartphone, "Téléphones, accessoires et technologies modernes"],
  ["Mode", "mode", ShoppingBag, "Styles, chaussures et créations locales"],
  ["Maison & Meubles", "maison-meubles", Sofa, "Décoration, mobilier et confort"],
  ["Véhicules", "vehicules", Car, "Autos, motos et pièces"],
  ["Immobilier", "immobilier", Building2, "Maisons, terrains et locations"],
  ["Services", "services", BriefcaseBusiness, "Professionnels et prestations"],
  ["Beauté & Soins", "beaute-soins", Sparkles, "Produits beauté, soins et bien-être"],
];
const marketplaceDepartments = [
  ["Mode femme", "mode", ShoppingBag, ["Robes", "Chaussures", "Sacs", "Bijoux"]],
  ["Mode homme", "mode", BriefcaseBusiness, ["Chemises", "Pantalons", "Montres", "Chaussures"]],
  [
    "Téléphones & appareils",
    "electronique",
    Smartphone,
    ["Smartphones", "Tablettes", "Accessoires", "Audio"],
  ],
  ["Informatique", "electronique", BarChart3, ["Ordinateurs", "Écrans", "Imprimantes", "Réseau"]],
  [
    "Supermarché",
    "supermarche",
    ShoppingBasket,
    ["Alimentation", "Boissons", "Hygiène", "Entretien"],
  ],
  ["Maison & cuisine", "maison-meubles", Sofa, ["Meubles", "Décoration", "Cuisine", "Literie"]],
  ["Beauté & soins", "beaute-soins", Sparkles, ["Maquillage", "Parfums", "Cheveux", "Soins"]],
  ["Véhicules", "vehicules", Car, ["Voitures", "Motos", "Pièces", "Accessoires"]],
  ["Immobilier", "immobilier", Building2, ["Maisons", "Appartements", "Terrains", "Locations"]],
  ["Agriculture", "agriculture", ShoppingBasket, ["Semences", "Récoltes", "Matériel", "Élevage"]],
  [
    "Services",
    "services",
    BriefcaseBusiness,
    ["Réparation", "Transport", "Événement", "Professionnels"],
  ],
  ["Emplois", "emplois", Users, ["Offres d’emploi", "Freelance", "Stages", "Formations"]],
];

const demoProducts = [
  {
    id: 1,
    name: "Panier fraîcheur peyi",
    price: 2450,
    city: "Port-au-Prince",
    category_name: "Supermarché",
    seller_name: "Marché Lakay",
    image_url:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    name: "Casque audio premium",
    price: 7850,
    city: "Pétion-Ville",
    category_name: "Électronique",
    seller_name: "Tech Ayiti",
    image_url:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    name: "Fauteuil contemporain",
    price: 18900,
    city: "Delmas",
    category_name: "Maison & Meubles",
    seller_name: "Kay Design",
    image_url:
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    name: "Sac artisanal haïtien",
    price: 4200,
    city: "Jacmel",
    category_name: "Mode",
    seller_name: "Kreyol Chic",
    image_url:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 5,
    name: "Smartphone reconditionné",
    price: 24500,
    city: "Cap-Haïtien",
    category_name: "Électronique",
    seller_name: "Mobile Plus",
    image_url:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
  },
];
const boutiques = [
  "Marché Lakay",
  "Tech Ayiti",
  "Kreyol Chic",
  "Kay Design",
  "Mobile Plus",
  "Soleil Market",
];

function Providers({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("vinnht_user") || "null"));
  const [activeRole, setActiveRole] = useState(
    () => localStorage.getItem("vinnht_active_role") || user?.role || "client"
  );
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => {
        localStorage.setItem("vinnht_user", JSON.stringify(data));
        setUser(data);
        if (!data.roles?.includes(activeRole)) {
          const nextRole = data.role || data.roles?.[0] || "client";
          localStorage.setItem("vinnht_active_role", nextRole);
          setActiveRole(nextRole);
        }
      })
      .catch(() => {
        localStorage.removeItem("vinnht_user");
        localStorage.removeItem("vinnht_active_role");
        setUser(null);
      });
  }, []);
  useEffect(() => {
    if (!user?.roles?.includes("client")) return;
    const syncClientData = async () => {
      const localCart = JSON.parse(localStorage.getItem("vinnht_cart") || "[]");
      const localFavorites = JSON.parse(localStorage.getItem("vinnht_favorites") || "[]");
      if (localCart.length) {
        await api.post("/cart/sync", {
          items: localCart.map((item) => ({
            productId: item.id,
            quantity: item.quantity || 1,
          })),
        });
      }
      if (localFavorites.length) {
        await api.post("/favorites/sync", {
          productIds: localFavorites.map((item) => item.id),
        });
      }
      const [{ data: serverCart }, { data: serverFavorites }] = await Promise.all([
        api.get("/cart"),
        api.get("/favorites"),
      ]);
      setCart(serverCart);
      setFavorites(serverFavorites);
      localStorage.removeItem("vinnht_cart");
      localStorage.removeItem("vinnht_favorites");
    };
    syncClientData().catch(() => {});
  }, [user?.id]);
  const auth = useMemo(
    () => ({
      user,
      login(data) {
        localStorage.setItem("vinnht_user", JSON.stringify(data.user));
        setUser(data.user);
        const nextRole = data.user.roles?.includes(data.user.role)
          ? data.user.role
          : data.user.roles?.[0] || "client";
        localStorage.setItem("vinnht_active_role", nextRole);
        setActiveRole(nextRole);
      },
      updateUser(nextUser) {
        localStorage.setItem("vinnht_user", JSON.stringify(nextUser));
        setUser(nextUser);
      },
      activeRole,
      switchRole(role) {
        if (!user?.roles?.includes(role) && !user?.roles?.includes("admin")) return;
        localStorage.setItem("vinnht_active_role", role);
        setActiveRole(role);
      },
      async logout() {
        await api.post("/auth/logout").catch(() => {});
        localStorage.removeItem("vinnht_user");
        localStorage.removeItem("vinnht_active_role");
        setUser(null);
        setActiveRole("client");
      },
    }),
    [user, activeRole]
  );
  const cartValue = useMemo(
    () => ({
      cart,
      async add(product) {
        if (Number(product.stock) < 1) return;
        const current = cart.find((item) => item.id === product.id);
        const quantity = Math.min((current?.quantity || 0) + 1, Number(product.stock));
        await api.put(`/cart/${product.id}`, { quantity });
        const { data } = await api.get("/cart");
        setCart(data);
      },
      async remove(id) {
        await api.delete(`/cart/${id}`);
        setCart((items) => items.filter((i) => i.id !== id));
      },
      async updateQuantity(id, quantity) {
        const item = cart.find((product) => product.id === id);
        const maximum = Math.max(1, Number(item?.stock) || 1);
        const nextQuantity = Math.min(maximum, Math.max(1, Number(quantity) || 1));
        await api.put(`/cart/${id}`, { quantity: nextQuantity });
        setCart((items) =>
          items.map((product) =>
            product.id === id ? { ...product, quantity: nextQuantity } : product,
          ),
        );
      },
      async clear() {
        await api.delete("/cart");
        setCart([]);
      },
    }),
    [cart]
  );
  const favoritesValue = useMemo(
    () => ({
      favorites,
      isFavorite(id) {
        return favorites.some((product) => product.id === id);
      },
      async toggle(product) {
        const exists = favorites.some((item) => item.id === product.id);
        if (exists) {
          await api.delete(`/favorites/${product.id}`);
          setFavorites((items) => items.filter((item) => item.id !== product.id));
        } else {
          await api.post(`/favorites/${product.id}`);
          const { data } = await api.get("/favorites");
          setFavorites(data);
        }
      },
    }),
    [favorites]
  );
  return (
    <AuthContext.Provider value={auth}>
      <CartContext.Provider value={cartValue}>
        <FavoritesContext.Provider value={favoritesValue}>{children}</FavoritesContext.Provider>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { user, logout, activeRole } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const count = cart.reduce((n, item) => n + item.quantity, 0);
  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/products${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`);
  };
  return (
    <>
      <header className="navbar">
        <Link className="brand" to="/">
          <img src="/vinnht-logo.png" alt="Logo VinnHT" />
          <b>VinnHT</b>
        </Link>
        <form className="header-search" onSubmit={submitSearch}>
          <Search size={17} />
          <input
            aria-label="Recherche rapide"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher sur VinnHT"
          />
          <button>
            <Search size={16} />
          </button>
        </form>
        <nav className={open ? "nav-links open" : "nav-links"}>
          <Link to="/">Accueil</Link>
          <Link to="/categories">Rayons</Link>
          <Link to="/contact">Contact</Link>
          {user ? (
            <>
              <Link to={roleHome[activeRole] || "/client"}>Mon espace</Link>
              <button className="text-btn" onClick={logout}>
                <LogOut size={17} /> Quitter
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Connexion</Link>
              <Button to="/register" className="compact">
                Créer un compte
              </Button>
            </>
          )}
        </nav>
        <div className="nav-actions">
          <Link className="cart-link" to="/cart">
            <ShoppingCart />
            <b>{count}</b>
          </Link>
          <button className="icon-btn mobile-only" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <form className="mobile-search-dock" onSubmit={submitSearch}>
        <Search />
        <input
          aria-label="Recherche mobile"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher sur VinnHT"
        />
        <button>
          <Search />
        </button>
      </form>
    </>
  );
}
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <Link className="brand light" to="/">
          <img src="/vinnht-logo.png" alt="Logo VinnHT" />
          <b>VinnHT</b>
        </Link>
        <p>
          Le marché numérique d’Haïti. Une expérience premium pour acheter, vendre et livrer avec
          confiance.
        </p>
        <div className="social-row">
          <span /> <span /> <span />
        </div>
      </div>
      <div>
        <h4>Marketplace</h4>
        <Link to="/categories">Rayons</Link>
        <Link to="/cart">Panier</Link>
        <Link to="/contact">Support</Link>
      </div>
      <div>
        <h4>Vendeurs</h4>
        <Link to="/become-seller">Devenir vendeur</Link>
        <span>Boutiques vérifiées</span>
        <span>Payouts suivis</span>
      </div>
      <div>
        <h4>Confiance</h4>
        <span>Paiement simulé prêt MonCash</span>
        <span>Livraison suivie</span>
        <span>Support local</span>
      </div>
    </footer>
  );
}
function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

function MarketplaceLayout({ children }) {
  const { user, activeRole } = useAuth();

  if (user && activeRole === "client") {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  return <PublicLayout>{children}</PublicLayout>;
}

function CategoryCard({ item }) {
  const [name, slug, Icon, text] = item;
  return (
    <motion.div whileHover={{ y: -8, scale: 1.01 }}>
      <Link className="category-card" to={`/categories/${slug}`}>
        <div className="category-icon">
          <Icon />
        </div>
        <h3>{name}</h3>
        <p>{text}</p>
        <span>
          Explorer <ChevronRight size={16} />
        </span>
      </Link>
    </motion.div>
  );
}
function ProductCard({ product }) {
  const { add } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const favorite = isFavorite(product.id);
  return (
    <motion.article className="product-card" whileHover={{ y: -8 }}>
      <Link className="product-media" to={`/products/${product.id}`}>
        <img src={assetUrl(product.image_url)} alt={product.name} />
        {product.is_featured ? (
          <img
            className="best-price-ribbon"
            src="/best-price-ribbon.png"
            alt="Meilleur prix"
          />
        ) : (
          <Badge tone="gold">Tendance</Badge>
        )}
      </Link>
      <button
        className={`product-favorite-button ${favorite ? "active" : ""}`}
        onClick={() => toggle(product)}
        aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        <Heart size={18} fill={favorite ? "currentColor" : "none"} />
      </button>
      <div className="product-body">
        <div className="product-meta">
          <span>{product.category_name}</span>
          <span>
            <MapPin size={13} />
            {product.city || "Haïti"}
          </span>
        </div>
        <Link to={`/products/${product.id}`}>
          <h3>{product.name}</h3>
        </Link>
        <p>
          <ShieldCheck size={14} /> Vendeur vérifié : {product.seller_name}
        </p>
        <div className="product-bottom">
          <strong>{productPrice(product).toLocaleString("fr-HT")} HTG</strong>
          <button className="round-btn" onClick={() => add(product)}>
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
function PageHero({ title, text }) {
  return (
    <section className="page-hero">
      <Badge>VinnHT Marketplace</Badge>
      <h1>{title}</h1>
      <p>{text}</p>
    </section>
  );
}

function Home() {
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    Promise.all([
      api.get("/products", { params: { limit: 4 } }),
      api.get("/shops"),
      api.get("/marketplace/stats"),
    ]).then(([productsResponse, shopsResponse, statsResponse]) => {
      setProducts(productsResponse.data);
      setShops(shopsResponse.data);
      setStats(statsResponse.data);
    });
  }, []);

  return (
    <PublicLayout>
      <section className="hero premium-bg">
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge tone="gold">
              <Sparkles size={15} /> Startup marketplace premium
            </Badge>
            <h1>
              Achetez, vendez et trouvez tout en Haïti avec <em>VinnHT</em>
            </h1>
            <p>
              Une marketplace moderne pour connecter clients, vendeurs et livreurs dans une
              expérience simple, rapide et professionnelle.
            </p>
            <div className="hero-actions">
              <Button to="/categories">
                Explorer les rayons <ArrowRight size={18} />
              </Button>
              <Button to="/become-seller" variant="glass">
                Devenir vendeur
              </Button>
            </div>
          </motion.div>
        </div>
        <motion.div
          className="hero-visual-3d"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <Lottie animationData={lottiePulse} loop />
          <div className="hero-card floating-a">
            <b>+12 rayons</b>
            <span>Marché complet</span>
          </div>
          <div className="hero-card floating-b">
            <b>Livraison suivie</b>
            <span>Commandes en temps réel</span>
          </div>
        </motion.div>
      </section>
      <AnimatedSection className="stats-strip">
        <StatCard icon={Users} label="Comptes actifs" count={Number(stats.active_users || 0)} />
        <StatCard icon={Store} label="Boutiques" count={Number(stats.sellers || 0)} />
        <StatCard icon={ShoppingBag} label="Produits disponibles" count={Number(stats.products || 0)} />
        <StatCard icon={Package} label="Commandes suivies" count={Number(stats.orders || 0)} />
      </AnimatedSection>
      <AnimatedSection className="section">
        <SectionHead
          eyebrow="Rayons populaires"
          title="Un grand marché organisé pour Haïti"
          link="/categories"
        />
        <Swiper
          modules={[Autoplay, Pagination]}
          autoplay={{ delay: 2600 }}
          pagination={{ clickable: true }}
          spaceBetween={18}
          breakpoints={{
            320: { slidesPerView: 1.1 },
            700: { slidesPerView: 2.2 },
            1000: { slidesPerView: 4 },
          }}
        >
          {categories.map((cat) => (
            <SwiperSlide key={cat[1]}>
              <CategoryCard item={cat} />
            </SwiperSlide>
          ))}
        </Swiper>
      </AnimatedSection>
      <AnimatedSection className="section soft">
        <SectionHead
          eyebrow="Produits tendance"
          title="Les offres qui donnent envie de remplir son panier"
        />
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard product={p} key={p.id} />
          ))}
        </div>
        {!products.length && <div className="empty-state"><ShoppingBag /><h3>Aucun produit disponible</h3><p>Les premiers produits apparaîtront après la validation d’un vendeur.</p></div>}
      </AnimatedSection>
      <AnimatedSection className="section why-grid">
        <div className="why-copy">
          <Badge tone="blue">Pourquoi VinnHT ?</Badge>
          <h2>Une expérience haut de gamme, pensée pour le marché local.</h2>
          <p>
            VinnHT associe la simplicité d’un grand marketplace moderne à la réalité du commerce en
            Haïti : vendeurs locaux, livraison flexible et suivi clair.
          </p>
        </div>
        {[
          [ShieldCheck, "Vendeurs vérifiés", "Des boutiques mieux présentées et plus fiables."],
          [Truck, "Livraison structurée", "Les livreurs peuvent suivre leurs missions."],
          [Wallet, "Payouts vendeur", "Une base claire pour payer chaque vendeur."],
          [BarChart3, "Pilotage complet", "Managers et admins gardent la visibilité."],
        ].map(([Icon, t, d]) => (
          <div className="why-card" key={t}>
            <Icon />
            <h3>{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </AnimatedSection>
      <AnimatedSection className="section timeline-section">
        <SectionHead eyebrow="Comment ça marche" title="Acheter ou vendre en quelques étapes" />
        <div className="timeline">
          {[
            "Créez votre compte",
            "Explorez les rayons",
            "Commandez ou vendez",
            "Suivez la livraison",
          ].map((step, i) => (
            <div key={step}>
              <span>{i + 1}</span>
              <h3>{step}</h3>
              <p>Une étape simple, claire et pensée pour avancer vite.</p>
            </div>
          ))}
        </div>
      </AnimatedSection>
      <AnimatedSection className="section boutiques">
        <SectionHead
          eyebrow="Boutiques professionnelles"
          title="Des vendeurs prêts pour le commerce numérique"
        />
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 2200 }}
          loop={shops.length > 4}
          spaceBetween={18}
          breakpoints={{
            320: { slidesPerView: 1.2 },
            800: { slidesPerView: 3 },
            1100: { slidesPerView: 4 },
          }}
        >
          {shops.map((shop) => (
            <SwiperSlide key={shop.seller_id}>
              <div className="shop-card">
                <span>{shop.shop_name[0]}</span>
                <h3>{shop.shop_name}</h3>
                <p>{shop.category || "Boutique VinnHT"}</p>
                <Badge tone="success">Professionnel</Badge>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        {!shops.length && <div className="empty-state"><Store /><h3>Aucune boutique active</h3><p>Les boutiques validées apparaîtront ici.</p></div>}
      </AnimatedSection>
      <AnimatedSection className="mobile-app">
        <div>
          <Badge tone="gold">Bientôt</Badge>
          <h2>Une application mobile VinnHT pour suivre le marché partout.</h2>
          <p>Notifications, commandes, livraison et dashboard vendeur directement sur téléphone.</p>
        </div>
        <div className="phone-mock">
          <div>
            <Search size={18} /> VinnHT App
          </div>
          <div className="empty-state">
            <img src="/vinnht-logo.png" alt="VinnHT" />
            <h3>Votre marché dans votre poche</h3>
            <p>Les produits réels de VinnHT seront disponibles dans l’application.</p>
          </div>
        </div>
      </AnimatedSection>
    </PublicLayout>
  );
}
function SectionHead({ eyebrow, title, link }) {
  return (
    <div className="section-head">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {link && (
        <Link to={link}>
          Voir plus <ChevronRight size={18} />
        </Link>
      )}
    </div>
  );
}

function Contact() {
  const [open, setOpen] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const faq = [
    [
      "Comment devenir vendeur ?",
      "Connectez-vous à votre espace client, ouvrez Devenir vendeur puis envoyez votre dossier. Un superviseur VinnHT vérifiera ensuite votre demande.",
    ],
    [
      "Comment suivre une commande ?",
      "Ouvrez Mes commandes depuis votre espace client pour consulter le paiement, la préparation et la livraison.",
    ],
    [
      "Quand MonCash sera intégré ?",
      "Le paiement est actuellement simulé pour valider le parcours. MonCash remplacera cette simulation avant la mise en production commerciale.",
    ],
  ];

  const submitContact = async (event) => {
    event.preventDefault();
    setSending(true);
    setFeedback("");
    try {
      const { data } = await api.post("/contact", form);
      setFeedback(data.message);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      setFeedback(error.response?.data?.message || "Impossible d’envoyer votre message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <PublicLayout>
      <section className="contact-hero premium-bg">
        <div>
          <Badge tone="gold">Support VinnHT</Badge>
          <h1>Une équipe locale pour accompagner votre expérience.</h1>
          <p>
            Questions, vendeurs, livraison ou partenariat : contactez-nous depuis le canal qui vous
            convient.
          </p>
        </div>
        <div className="contact-lottie">
          <Lottie animationData={lottiePulse} loop />
        </div>
      </section>
      <section className="section contact-grid">
        {[
          [MessageCircle, "WhatsApp", "+509 0000 0000", "Réponse rapide"],
          [Mail, "Email", "support@vinnht.ht", "Support officiel"],
          [Phone, "Téléphone", "+509 0000 0000", "Assistance client"],
          [MapPin, "Adresse", "Port-au-Prince, Haïti", "Bureau opérationnel"],
        ].map(([Icon, t, v, n]) => (
          <motion.article className="contact-card" whileHover={{ y: -8 }} key={t}>
            <Icon />
            <h3>{t}</h3>
            <b>{v}</b>
            <p>{n}</p>
          </motion.article>
        ))}
      </section>
      <section className="section contact-form-wrap">
        <div className="contact-copy">
          <Badge>Contact</Badge>
          <h2>Envoyez-nous un message.</h2>
          <p>Votre demande sera enregistrée directement dans le centre de support VinnHT.</p>
        </div>
        <form className="glass-form" onSubmit={submitContact}>
          <label>
            Nom complet
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Votre nom" />
          </label>
          <label>
            Email
            <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="vous@email.com" />
          </label>
          <label>
            Sujet
            <input required value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Sujet de votre demande" />
          </label>
          <label>
            Message
            <textarea required minLength="10" rows="5" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Comment pouvons-nous aider ?" />
          </label>
          {feedback && <strong>{feedback}</strong>}
          <button className="button primary" disabled={sending}>
            {sending ? "Envoi en cours..." : "Envoyer le message"} <ArrowRight size={18} />
          </button>
        </form>
      </section>
      <section className="section faq-section">
        <SectionHead eyebrow="FAQ" title="Questions fréquentes" />
        {faq.map(([question, answer], i) => (
          <div className="faq-item" key={question}>
            <button onClick={() => setOpen(open === i ? -1 : i)}>
              <span>{question}</span>
              <ChevronRight className={open === i ? "rotate" : ""} />
            </button>
            {open === i && (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
              >
                {answer}
              </motion.p>
            )}
          </div>
        ))}
      </section>
      <section className="map-section">
        <MapPin />
        <h2>VinnHT opère depuis Haïti</h2>
        <p>Notre équipe accompagne les clients, vendeurs et livreurs depuis Port-au-Prince.</p>
      </section>
    </PublicLayout>
  );
}

function Categories() {
  return (
    <MarketplaceLayout>
      <PageHero
        title="Explorez tous les rayons"
        text="Des catégories premium qui ressemblent à un vrai grand marché numérique."
      />
      <section className="section">
        <div className="category-grid">
          {categories.map((c) => (
            <CategoryCard item={c} key={c[1]} />
          ))}
        </div>
      </section>
    </MarketplaceLayout>
  );
}

function ProductsCatalog() {
  const location = useLocation();
  const initialSearch = new URLSearchParams(location.search).get("search") || "";
  const offersOnly = new URLSearchParams(location.search).get("offers") === "true";
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState(initialSearch);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("recent");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    api
      .get("/products", {
        params: {
          category: category || undefined,
          search: query || undefined,
          offers: offersOnly || undefined,
          page,
          limit: 48,
        },
      })
      .then(({ data, headers }) => {
        setProducts(data);
        setTotal(Number(headers["x-total-count"]) || data.length);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category, query, offersOnly, page]);

  useEffect(() => {
    setQuery(new URLSearchParams(location.search).get("search") || "");
    setPage(1);
  }, [location.search]);

  useEffect(() => {
    setPage(1);
  }, [category, query]);

  const sortedProducts = [...products].sort((a, b) => {
    if (sort === "price-low") return Number(a.price) - Number(b.price);
    if (sort === "price-high") return Number(b.price) - Number(a.price);
    return Number(b.id) - Number(a.id);
  });

  return (
    <MarketplaceLayout>
      <section className="catalog-hero">
        <div>
          <Badge tone="gold">Tous les vendeurs VinnHT</Badge>
          <h1>
            {offersOnly
              ? "Les offres spéciales sélectionnées sur VinnHT."
              : "Découvrez tout le marché, dans un seul catalogue."}
          </h1>
          <p>
            {offersOnly
              ? "Profitez de prix promotionnels actifs proposés par les boutiques vérifiées."
              : "Explorez les rayons, comparez les offres et achetez auprès des boutiques vérifiées."}
          </p>
        </div>
        <form onSubmit={(event) => event.preventDefault()}>
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un produit, une marque ou une boutique"
          />
          <button>Rechercher</button>
        </form>
      </section>

      <section className="catalog-departments">
        <SectionHead eyebrow="Explorer par univers" title="Que recherchez-vous aujourd’hui ?" />
        <div className="department-grid">
          {marketplaceDepartments.map(([name, slug, Icon, children]) => (
            <button
              className={category === slug ? "active" : ""}
              onClick={() => setCategory(category === slug ? "" : slug)}
              key={name}
            >
              <span>
                <Icon />
              </span>
              <div>
                <h3>{name}</h3>
                <p>{children.join(" · ")}</p>
              </div>
              <ChevronRight />
            </button>
          ))}
        </div>
      </section>

      <section className="catalog-products-section">
        <aside className="catalog-filters">
          <span>Rayons</span>
          <button className={!category ? "active" : ""} onClick={() => setCategory("")}>
            Tous les produits
          </button>
          {categories.map(([name, slug]) => (
            <button
              className={category === slug ? "active" : ""}
              onClick={() => setCategory(slug)}
              key={slug}
            >
              {name}
            </button>
          ))}
        </aside>
        <div className="catalog-results">
          <header>
            <div>
              <span>{total} produit(s)</span>
              <h2>
                {offersOnly
                  ? "Offres spéciales"
                  : category
                    ? "Produits du rayon"
                    : "Tous les produits"}
              </h2>
            </div>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="recent">Plus récents</option>
              <option value="price-low">Prix croissant</option>
              <option value="price-high">Prix décroissant</option>
            </select>
          </header>
          {loading ? (
            <div className="catalog-empty">Chargement du marché...</div>
          ) : sortedProducts.length ? (
            <div className="product-grid">
              {sortedProducts.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </div>
          ) : (
            <div className="catalog-empty">
              <ShoppingBag />
              <h3>Aucun produit trouvé</h3>
              <p>Essayez un autre rayon ou une autre recherche.</p>
            </div>
          )}
          {total > 48 && (
            <div className="catalog-pagination">
              <button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
                Précédent
              </button>
              <span>
                Page {page} sur {Math.ceil(total / 48)}
              </span>
              <button
                disabled={page >= Math.ceil(total / 48)}
                onClick={() => setPage((value) => value + 1)}
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </section>
    </MarketplaceLayout>
  );
}

function CategoryProducts() {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api
      .get("/products", { params: { category: slug } })
      .then(({ data }) => setProducts(data))
      .catch(() => setProducts([]));
  }, [slug]);

  return (
    <MarketplaceLayout>
      <PageHero
        title={slug.replaceAll("-", " ")}
        text="Produits vérifiés, vendeurs professionnels et expérience fluide."
      />
      <section className="section">
        <div className="product-toolbar">
          <SearchBar />
        </div>
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard product={p} key={p.id} />
          ))}
        </div>
        {!products.length && (
          <div className="catalog-empty">
            <ShoppingBag />
            <h3>Aucun produit dans ce rayon</h3>
            <p>Les produits apparaîtront après la validation des premiers vendeurs.</p>
          </div>
        )}
      </section>
    </MarketplaceLayout>
  );
}
function ProductDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [missing, setMissing] = useState(false);
  const { add } = useCart();
  const { isFavorite, toggle } = useFavorites();

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then(async ({ data }) => {
        setProduct(data);
        const response = await api.get("/products", {
          params: { category: data.category_slug },
        });
        setSimilar(response.data.filter((item) => item.id !== data.id));
      })
      .catch(() => setMissing(true));
  }, [id]);

  if (!product) {
    return (
      <MarketplaceLayout>
        <div className="catalog-empty">
          <ShoppingBag />
          <h3>{missing ? "Produit introuvable" : "Chargement du produit..."}</h3>
          <p>{missing ? "Ce produit n’est plus disponible sur VinnHT." : "Veuillez patienter."}</p>
          {missing && <Link className="button primary" to="/products">Retour au catalogue</Link>}
        </div>
      </MarketplaceLayout>
    );
  }

  const contactSeller = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    const { data } = await api.post("/messages/conversations", {
      sellerId: product.seller_id,
    });
    const draft = `Bonjour, je souhaite avoir plus d’informations sur le produit « ${product.name} ».`;
    navigate(`/messages?conversation=${data.id}&draft=${encodeURIComponent(draft)}`);
  };

  const sellerWhatsApp = whatsappNumber(product.seller_whatsapp);
  const whatsappMessage = encodeURIComponent(
    `Bonjour, je vous contacte depuis VinnHT au sujet du produit « ${product.name} ».`,
  );

  return (
    <MarketplaceLayout>
      <section className="product-detail">
        <div className="gallery">
          <img src={assetUrl(product.image_url)} alt={product.name} />
          <div>
            {similar.slice(0, 3).map((p) => (
              <img key={p.id} src={p.image_url} alt="Aperçu" />
            ))}
          </div>
        </div>
        <div className="product-info">
          {product.is_featured && (
            <img
              className="best-price-detail-ribbon"
              src="/best-price-ribbon.png"
              alt="Meilleur prix"
            />
          )}
          <Badge tone="gold">Vendeur vérifié</Badge>
          <h1>{product.name}</h1>
          <p className="lead">
            Une sélection premium proposée par {product.seller_name}, disponible à {product.city}.
          </p>
          <h2>{productPrice(product).toLocaleString("fr-HT")} HTG</h2>
          <div className="product-detail-meta">
            <span>
              <ShoppingBag /> {product.category_name || "Produit"}
            </span>
            <span>
              <Package /> {product.stock ?? 0} disponible(s)
            </span>
            <span>
              <MapPin /> {product.city || "Haïti"}
            </span>
          </div>
          <div className="product-description">
            <span>Description</span>
            <p>
              {product.description ||
                "Contactez le vendeur pour obtenir plus d’informations sur ce produit."}
            </p>
          </div>
          <div className="detail-actions">
            <Button onClick={() => add(product)}>
              <ShoppingCart size={18} /> Ajouter au panier
            </Button>
            <Button variant="glass" onClick={() => toggle(product)}>
              <Heart fill={isFavorite(product.id) ? "currentColor" : "none"} />
              {isFavorite(product.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
            </Button>
          </div>
          <article className="product-seller-card">
            <div className="product-seller-avatar">
              {product.seller_profile_image_url ? (
                <img src={assetUrl(product.seller_profile_image_url)} alt={product.seller_name} />
              ) : (
                <CircleUserRound />
              )}
            </div>
            <div>
              <span>Vendu par</span>
              <h3>{product.shop_name || product.seller_name}</h3>
              <p>
                <ShieldCheck /> Vendeur vérifié · {product.seller_name}
              </p>
            </div>
            <div className="product-seller-actions">
              <button onClick={contactSeller} aria-label={`Contacter ${product.seller_name}`}>
                <MessageCircle />
                <span>Message</span>
              </button>
              {sellerWhatsApp && (
                <a
                  className="whatsapp"
                  href={`https://wa.me/${sellerWhatsApp}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Discuter avec ${product.seller_name} sur WhatsApp`}
                >
                  <WhatsAppIcon />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </article>
        </div>
      </section>
      <section className="section soft">
        <SectionHead eyebrow="Produits similaires" title="Vous pourriez aussi aimer" />
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 2500 }}
          spaceBetween={18}
          breakpoints={{
            320: { slidesPerView: 2, spaceBetween: 10 },
            760: { slidesPerView: 2.2 },
            1100: { slidesPerView: 4 },
          }}
        >
          {similar.map((p) => (
            <SwiperSlide key={p.id}>
              <ProductCard product={p} />
            </SwiperSlide>
          ))}
        </Swiper>
        {!similar.length && (
          <div className="catalog-empty">
            <ShoppingBag />
            <h3>Aucun produit similaire pour le moment</h3>
            <p>Les nouveaux produits de ce rayon apparaîtront ici.</p>
          </div>
        )}
      </section>
    </MarketplaceLayout>
  );
}

function ShopDetails() {
  const { sellerId } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get(`/shops/${sellerId}`),
      api.get("/products", { params: { seller: sellerId } }),
      api.get(`/shops/${sellerId}/reviews`),
    ]).then(([shopResponse, productsResponse, reviewsResponse]) => {
      setShop(shopResponse.data);
      setProducts(productsResponse.data);
      setReviews(reviewsResponse.data);
    });
  }, [sellerId]);

  return (
    <MarketplaceLayout>
      <section className="shop-public-hero">
        <div className="shop-public-logo">
          {shop?.shop_logo_url ? (
            <img
              src={assetUrl(shop.shop_logo_url)}
              alt={shop.shop_name}
            />
          ) : (
            <Store />
          )}
        </div>
        <div>
          <Badge tone="gold">Boutique vérifiée</Badge>
          <h1>{shop?.shop_name || "Boutique VinnHT"}</h1>
          <p>
            {shop?.description || "Découvrez tous les produits disponibles dans cette boutique."}
          </p>
          <div className="shop-public-metrics">
            <span>{products.length} produit(s) en ligne</span>
            <span>
              <Star />
              {Number(shop?.review_count) > 0
                ? `${Number(shop.rating).toFixed(1)} sur 5 · ${shop.review_count} avis vérifié(s)`
                : "Nouvelle boutique · Aucun avis"}
            </span>
          </div>
        </div>
      </section>
      <section className="section">
        <SectionHead
          eyebrow="Catalogue boutique"
          title={`Les produits de ${shop?.shop_name || "cette boutique"}`}
        />
        {products.length ? (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        ) : (
          <div className="catalog-empty">
            <Store />
            <h3>Aucun produit en ligne</h3>
          </div>
        )}
      </section>
      <section className="section soft">
        <SectionHead eyebrow="Confiance VinnHT" title="Avis de clients vérifiés" />
        {reviews.length ? (
          <div className="shop-review-grid">
            {reviews.slice(0, 6).map((review) => (
              <article className="shop-review-card" key={review.id}>
                <header>
                  <span>
                    {review.profile_image_url ? (
                      <img src={assetUrl(review.profile_image_url)} alt={review.client_name} />
                    ) : (
                      <CircleUserRound />
                    )}
                  </span>
                  <div>
                    <strong>{review.client_name}</strong>
                    <small>Achat livré et vérifié</small>
                  </div>
                  <b>
                    <Star />
                    {review.rating}/5
                  </b>
                </header>
                <p>{review.comment || "Client satisfait de cette commande."}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="catalog-empty">
            <Star />
            <h3>Cette boutique n’a pas encore reçu d’avis</h3>
            <p>Seuls les clients ayant reçu leur commande peuvent publier une note.</p>
          </div>
        )}
      </section>
    </MarketplaceLayout>
  );
}

function AuthPage({ register = false }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const passwordChecks = {
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    number: /\d/.test(form.password),
  };

  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (register && form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (register && !form.acceptedTerms) {
      setError("Vous devez accepter les conditions d’utilisation.");
      return;
    }

    setBusy(true);

    try {
      const payload = register
        ? {
            name: form.name,
            phone: form.phone,
            email: form.email,
            password: form.password,
          }
        : {
            email: form.email,
            password: form.password,
          };

      const { data } = await api.post(register ? "/auth/register" : "/auth/login", payload);
      login(data);
      navigate(roleHome[data.user.role] || "/client");
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
          err.response?.data?.message ||
          "Le serveur est indisponible. Vérifiez que l’API est démarrée."
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <PublicLayout>
      <section className="auth-premium-page">
        <motion.div
          className="auth-premium-card"
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65 }}
        >
          <div className="auth-geometry">
            <motion.div
              className="ribbon ribbon-one"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            <motion.div
              className="ribbon ribbon-two"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <motion.div
              className="ribbon ribbon-three"
              animate={{ x: [0, 8, 0] }}
              transition={{ duration: 7, repeat: Infinity }}
            />
            <Link className="auth-brand" to="/">
              <img src="/vinnht-logo.png" alt="Logo VinnHT" />
              <b>VinnHT</b>
            </Link>
            <div className="login-pill">{register ? "REGISTER" : "LOGIN"}</div>
          </div>
          <form className="auth-modern-form" onSubmit={submit}>
            <div className="auth-user-orb">
              <CircleUserRound />
            </div>
            <h1>{register ? "REGISTER" : "LOGIN"}</h1>
            <p className="auth-subtitle">
              {register ? "Créez votre compte VinnHT" : "Bienvenue, connectez-vous à votre espace"}
            </p>
            {register && (
              <>
                <label className="line-field">
                  <CircleUserRound />
                  <input
                    required
                    minLength="2"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nom complet"
                  />
                </label>

                <label className="line-field">
                  <Phone />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Téléphone, ex. +509 3700 0000"
                  />
                </label>
              </>
            )}
            <label className="line-field">
              <Mail />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Adresse email"
              />
            </label>
            <label className="line-field">
              <LockKeyhole />
              <input
                type="password"
                minLength="8"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mot de passe"
              />
            </label>

            {register && (
              <>
                <div className="password-strength" aria-label="Robustesse du mot de passe">
                  <span className={passwordStrength >= 1 ? "active" : ""} />
                  <span className={passwordStrength >= 2 ? "active" : ""} />
                  <span className={passwordStrength >= 3 ? "active" : ""} />
                </div>

                <label className="line-field">
                  <ShieldCheck />
                  <input
                    type="password"
                    minLength="8"
                    required
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Confirmer le mot de passe"
                  />
                </label>

                <label className="terms-check">
                  <input
                    type="checkbox"
                    checked={form.acceptedTerms}
                    onChange={(e) => setForm({ ...form, acceptedTerms: e.target.checked })}
                  />
                  <span>
                    J’accepte les conditions d’utilisation et la politique de confidentialité.
                  </span>
                </label>
              </>
            )}
            {!register && (
              <Link className="forgot-link" to="/login">
                Mot de passe oublié ?
              </Link>
            )}
            {error && <div className="alert">{error}</div>}
            <motion.button
              className="magenta-button"
              disabled={busy}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {busy ? "Veuillez patienter..." : register ? "Créer mon compte" : "Se connecter"}
            </motion.button>
            <div className="social-divider">
              <span />
              Ou continuer avec
              <span />
            </div>
            <div className="social-login">
              <button type="button">
                <b>G</b> Google
              </button>
              <button type="button">
                <b>f</b> Facebook
              </button>
            </div>
            <p className="auth-switch">
              {register ? "Déjà membre ?" : "Pas encore membre ?"}{" "}
              <Link to={register ? "/login" : "/register"}>
                {register ? "Se connecter" : "Créer un compte"}
              </Link>
            </p>
          </form>
        </motion.div>
      </section>
    </PublicLayout>
  );
}
function Cart() {
  const { cart, remove } = useCart();
  const total = cart.reduce((n, i) => n + i.price * i.quantity, 0);
  return (
    <PublicLayout>
      <section className="section">
        <PageTitle title="Votre panier" text={`${cart.length} produit(s) sélectionné(s)`} />
        <div className="cart-layout">
          <div>
            {cart.length ? (
              cart.map((i) => (
                <div className="cart-item" key={i.id}>
                  <img src={i.image_url} alt={i.name} />
                  <div>
                    <h3>{i.name}</h3>
                    <p>Quantité : {i.quantity}</p>
                  </div>
                  <b>{(i.price * i.quantity).toLocaleString("fr-HT")} HTG</b>
                  <button className="round-btn muted" onClick={() => remove(i.id)}>
                    <X />
                  </button>
                </div>
              ))
            ) : (
              <EmptyState title="Votre panier est vide." />
            )}
          </div>
          <aside className="summary glass-card">
            <h3>Résumé</h3>
            <div>
              <span>Sous-total</span>
              <b>{total.toLocaleString("fr-HT")} HTG</b>
            </div>
            <div>
              <span>Livraison</span>
              <b>À calculer</b>
            </div>
            <hr />
            <div>
              <span>Total</span>
              <strong>{total.toLocaleString("fr-HT")} HTG</strong>
            </div>
            <Button to="/checkout" className="full">
              Continuer
            </Button>
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
}

const menus = {
  client: [
    ["Dashboard", "/client", LayoutDashboard],
    ["Catalogue", "/products", ShoppingBag],
    ["Mes favoris", "/favorites", Heart],
    ["Mes commandes", "/my-orders", Package],
    ["Messages", "/messages", MessageCircle],
    ["Profil", "/profile", CircleUserRound],
    ["Paramètres", "/settings", Settings],
  ],
  seller: [
    ["Vue d’ensemble", "/seller", LayoutDashboard],
    ["Mes produits", "/seller/products", ShoppingBag],
    ["Commandes", "/seller/orders", Package],
    ["Ventes & revenus", "/seller/sales", BarChart3],
    ["Ma boutique", "/seller/shop", Store],
    ["Messages", "/seller/messages", MessageCircle],
    ["Paramètres", "/seller/settings", Settings],
  ],
  delivery: [
    ["Vue d’ensemble", "/delivery", LayoutDashboard],
    ["Commandes assignées", "/delivery/assigned", Truck],
    ["Historique", "/delivery/history", Package],
    ["Profil", "/delivery/profile", CircleUserRound],
  ],
  supervisor: [
    ["Vue d’ensemble", "/supervisor", LayoutDashboard],
    ["Demandes vendeurs", "/supervisor/seller-requests", Store],
    ["Rapports", "/supervisor/reports", BarChart3],
    ["Profil", "/supervisor/profile", CircleUserRound],
    ["Paramètres", "/supervisor/settings", Settings],
  ],
  manager: [
    ["Vue d’ensemble", "/manager", LayoutDashboard],
    ["Rapports opérationnels", "/manager/sales-reports", BarChart3],
    ["Gestion vendeurs", "/manager/sellers", Store],
    ["Gestion livraison", "/manager/deliveries", Truck],
    ["Profil", "/manager/profile", CircleUserRound],
    ["Paramètres", "/manager/settings", Settings],
  ],
  admin: [
    ["Vue d’ensemble", "/admin", LayoutDashboard],
    ["Vendeurs", "/admin/users", Users],
    ["Catégories", "/admin/categories", ShoppingBasket],
    ["Produits", "/admin/products", ShoppingBag],
    ["Profil", "/admin/profile", CircleUserRound],
    ["Paiements", "/admin/payments", ShieldCheck],
    ["Support", "/admin/contact-requests", MessageCircle],
    ["Paramètres", "/admin/settings", Settings],
  ],
};

const menuItemsFor = (role) => menus[role] || [];

const isMenuPathActive = (currentPath, itemPath) => {
  if (itemPath === "/supervisor/seller-requests") {
    return currentPath.startsWith(itemPath);
  }

  if (itemPath === "/products") {
    return (
      currentPath === "/products" ||
      currentPath.startsWith("/products/") ||
      currentPath.startsWith("/categories")
    );
  }

  return currentPath === itemPath;
};

function Protected({ roles, children }) {
  const { user, activeRole } = useAuth();
  const userRoles = user?.roles || [user?.role].filter(Boolean);
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.some((role) => userRoles.includes(role)) && !userRoles.includes("admin"))
    return <Navigate to={roleHome[activeRole] || roleHome[user.role]} />;
  return children;
}
function Sidebar() {
  const { user, logout, activeRole, switchRole } = useAuth();
  const loc = useLocation();
  const [shopLogo, setShopLogo] = useState("");
  const switchableRoles = (user.roles || [user.role]).filter((role) =>
    switchableAccountRoles.includes(role)
  );

  useEffect(() => {
    if (activeRole !== "seller") return;

    api
      .get("/seller/shop")
      .then(({ data }) => setShopLogo(data.shop_logo_url || ""))
      .catch(() => setShopLogo(""));

    const updateShopLogo = (event) => {
      setShopLogo(event.detail || "");
    };

    window.addEventListener("vinnht-shop-logo-updated", updateShopLogo);
    return () => window.removeEventListener("vinnht-shop-logo-updated", updateShopLogo);
  }, [activeRole]);

  return (
    <aside className="sidebar">
      <Link className="brand light" to="/">
        <img src="/vinnht-logo.png" alt="Logo VinnHT" />
        <b>VinnHT</b>
      </Link>
      <div className="profile">
        {activeRole === "seller" && shopLogo ? (
          <img src={assetUrl(shopLogo)} alt="Logo de la boutique" />
        ) : activeRole === "seller" ? (
          <Store />
        ) : user.profile_image_url ? (
          <img src={assetUrl(user.profile_image_url)} alt={`Photo de ${user.name}`} />
        ) : (
          <CircleUserRound />
        )}
        <div>
          <b>{user.name}</b>
          <span>{activeRole}</span>
        </div>
      </div>
      {switchableRoles.length > 1 && (
        <div className="space-switcher">
          {switchableRoles.map((role) => {
            const RoleIcon = roleDisplay[role].icon;
            return (
              <Link
                className={activeRole === role ? "active" : ""}
                to={roleHome[role]}
                onClick={() => switchRole(role)}
                key={role}
              >
                <RoleIcon />
                <span>{roleDisplay[role].label}</span>
              </Link>
            );
          })}
        </div>
      )}
      <nav>
        {menuItemsFor(activeRole, user).map(([n, p, I]) => (
          <Link className={isMenuPathActive(loc.pathname, p) ? "active" : ""} to={p} key={p}>
            <I size={19} />
            <span>{n}</span>
          </Link>
        ))}
      </nav>
      <button className="sidebar-logout" onClick={logout}>
        <LogOut size={18} />
        <span>Déconnexion</span>
      </button>
    </aside>
  );
}

function MobileDashboardNav() {
  const { user, activeRole } = useAuth();
  const loc = useLocation();
  const activeItemRef = useRef(null);
  const skipNextScrollAnimation = useRef(false);
  const items =
    activeRole === "seller"
      ? [...menuItemsFor(activeRole, user), ["Profil", "/seller/profile", CircleUserRound]]
      : menuItemsFor(activeRole, user);

  useEffect(() => {
    skipNextScrollAnimation.current = true;
  }, [activeRole]);

  useEffect(() => {
    if (!activeItemRef.current) return;

    activeItemRef.current.scrollIntoView({
      behavior: skipNextScrollAnimation.current ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });

    skipNextScrollAnimation.current = false;
  }, [loc.pathname, activeRole]);

  return (
    <nav
      key={activeRole}
      className={`mobile-dashboard-nav mobile-dashboard-nav-${activeRole}`}
      aria-label="Navigation du dashboard"
    >
      {items.map(([label, path, Icon]) => {
        const active = isMenuPathActive(loc.pathname, path);

        return (
          <Link
            className={active ? "active" : ""}
            to={path}
            key={path}
            ref={active ? activeItemRef : null}
            aria-label={label}
            title={label}
          >
            <span className="mobile-nav-icon">
              {active && (
                <motion.span
                  className="mobile-nav-active"
                  layoutId={`mobile-dashboard-active-${activeRole}`}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon size={20} />
            </span>
            <small>{label}</small>
          </Link>
        );
      })}
    </nav>
  );
}

function DashboardNotifications({ role }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const unread = notifications.filter((notification) => !notification.read_at).length;

  useEffect(() => {
    setOpen(false);
    const load = () =>
      api
        .get("/notifications", { params: { role } })
        .then(({ data }) => setNotifications(data))
        .catch(() => setNotifications([]));
    load();
    const interval = window.setInterval(load, 30000);
    return () => window.clearInterval(interval);
  }, [role]);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, read_at: new Date().toISOString() } : item)),
    );
  };

  const markAllRead = async () => {
    await api.patch("/notifications/read-all", { role });
    setNotifications((items) =>
      items.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })),
    );
  };

  return (
    <div className="dashboard-notifications">
      <button
        className="round-btn muted notification-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell />
        {unread > 0 && <b>{unread}</b>}
      </button>
      {open && (
        <motion.div
          className="notification-panel"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
        >
          <header>
            <div>
              <strong>Notifications</strong>
              <span>
                {unread} non lue{unread > 1 ? "s" : ""}
              </span>
            </div>
            <button onClick={markAllRead}>Tout marquer comme lu</button>
          </header>
          <div>
            {notifications.map((notification) => (
              <Link
                className={notification.read_at ? "read" : ""}
                to={notification.link || roleHome[role]}
                onClick={() => {
                  markRead(notification.id);
                  setOpen(false);
                }}
                key={notification.id}
              >
                <span>
                  <Bell />
                </span>
                <p>
                  <b>{notification.title}</b>
                  <small>{notification.message}</small>
                </p>
                {!notification.read_at && <i />}
              </Link>
            ))}
            {!notifications.length && (
              <div className="notification-empty">Aucune notification pour le moment.</div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function DashboardLayout({ children }) {
  const { user, activeRole, switchRole } = useAuth();
  const { cart } = useCart();
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const alternativeRoles = (user.roles || []).filter(
    (role) => switchableAccountRoles.includes(role) && role !== activeRole
  );
  return (
    <div className="dash-shell">
      <Sidebar />
      <div className="dash-main">
        <header className="dash-top">
          <div className="dash-top-actions">
            {alternativeRoles.map((role) => {
              const RoleIcon = roleDisplay[role].icon;
              return (
                <Link
                  className={`dashboard-space-switch dashboard-space-switch-${role}`}
                  to={roleHome[role]}
                  onClick={() => switchRole(role)}
                  aria-label={`Passer à l’${roleDisplay[role].label.toLowerCase()}`}
                  key={role}
                >
                  <RoleIcon />
                  <span>{roleDisplay[role].label}</span>
                </Link>
              );
            })}
            {activeRole === "client" && (
              <Link className="dashboard-cart-button" to="/cart" aria-label="Ouvrir mon panier">
                <ShoppingCart />
                <span>Panier</span>
                <b>{cartCount}</b>
              </Link>
            )}
            <DashboardNotifications role={activeRole} />
          </div>
        </header>
        <main>{children}</main>
      </div>
      <MobileDashboardNav />
    </div>
  );
}
function PageTitle({ title, text }) {
  return (
    <div className="dash-title">
      <div>
        <Badge tone="blue">VinnHT Dashboard</Badge>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </div>
  );
}
function Dashboard({ role }) {
  const user = useAuth().user;

  const roleContent = {
    client: {
      icon: Package,
      eyebrow: "Commande en cours",
      title: "Votre commande #VHT-1002 arrive bientôt.",
      text: "Elle est actuellement en préparation chez Marché Lakay.",
      action: "Suivre ma commande",
      path: "/my-orders",
    },
    seller: {
      icon: Wallet,
      eyebrow: "Solde vendeur",
      title: "41 800 HTG seront bientôt disponibles.",
      text: "Vos ventes progressent et trois commandes doivent être préparées aujourd’hui.",
      action: "Voir mes ventes",
      path: "/seller/sales",
    },
    delivery: {
      icon: Truck,
      eyebrow: "Prochaine livraison",
      title: "Commande #VHT-1048 à récupérer.",
      text: "Récupération à Pétion-Ville, puis livraison prévue à Delmas.",
      action: "Voir l’itinéraire",
      path: "/delivery/assigned",
    },
    supervisor: {
      icon: ShieldCheck,
      eyebrow: "Validation prioritaire",
      title: "9 demandes vendeurs attendent votre décision.",
      text: "Les documents de quatre boutiques ont déjà été vérifiés.",
      action: "Examiner les demandes",
      path: "/supervisor/seller-requests",
    },
    manager: {
      icon: BarChart3,
      eyebrow: "Performance mensuelle",
      title: "Le volume des ventes progresse de 18%.",
      text: "Les catégories Électronique et Supermarché portent la croissance.",
      action: "Ouvrir les rapports",
      path: "/manager/sales-reports",
    },
    admin: {
      icon: LayoutDashboard,
      eyebrow: "Santé de la plateforme",
      title: "VinnHT fonctionne normalement.",
      text: "Les commandes, paiements et livraisons sont opérationnels.",
      action: "Gérer les utilisateurs",
      path: "/admin/users",
    },
  }[role];

  const SpotlightIcon = roleContent.icon;

  const data = {
    client: [
      [Package, "Commandes", 3],
      [Truck, "En livraison", 1],
      [Heart, "Favoris", 8],
      [Wallet, "Total achats", 24500],
    ],
    seller: [
      [ShoppingBag, "Produits actifs", 18],
      [Package, "Commandes", 12],
      [BarChart3, "Ventes", 164200],
      [Wallet, "À recevoir", 41800],
    ],
    delivery: [
      [Truck, "Assignées", 7],
      [Package, "En transit", 3],
      [ShieldCheck, "Livrées", 48],
      [BarChart3, "Cette semaine", 12],
    ],
    supervisor: [
      [Store, "Demandes", 9],
      [Users, "Vendeurs actifs", 124],
      [ShieldCheck, "Signalements", 3],
      [BarChart3, "Approbations", 42],
    ],
    manager: [
      [BarChart3, "Volume ventes", 2400000],
      [Package, "Commandes", 856],
      [Store, "Vendeurs", 124],
      [Truck, "Livraisons", 702],
    ],
    admin: [
      [Users, "Utilisateurs", 4820],
      [ShoppingBag, "Produits", 2145],
      [Package, "Commandes", 856],
      [Wallet, "Revenus", 2400000],
    ],
  }[role];
  return (
    <DashboardLayout>
      <PageTitle
        title={`Bonjour, ${user.name}`}
        text={`Voici les informations importantes pour votre espace ${role}.`}
      />

      <motion.section
        className={`role-spotlight role-${role}`}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="role-spotlight-icon">
          <SpotlightIcon />
        </div>
        <div>
          <span>{roleContent.eyebrow}</span>
          <h2>{roleContent.title}</h2>
          <p>{roleContent.text}</p>
        </div>
        <Link to={roleContent.path}>
          {roleContent.action}
          <ArrowRight size={18} />
        </Link>
      </motion.section>

      <div className="stats-grid">
        {data.map(([Icon, label, count]) => (
          <StatCard
            icon={Icon}
            label={label}
            count={count}
            suffix={
              label.includes("Ventes") ||
              label.includes("Revenus") ||
              label.includes("achats") ||
              label.includes("recevoir") ||
              label.includes("Volume")
                ? " HTG"
                : ""
            }
            key={label}
          />
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <h2>Performance marketplace</h2>
          <div className="chart-placeholder">
            {[50, 75, 45, 90, 68, 82, 60].map((h, i) => (
              <span style={{ height: `${h}%` }} key={i} />
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>Activité récente</h2>
          <Table />
        </section>
        <section className="panel action-panel">
          <h2>Actions rapides</h2>
          <Link className="quick" to="/categories">
            <ShoppingBag /> Explorer le marché <ChevronRight />
          </Link>
          <Link className="quick" to={menus[role]?.[1]?.[1] || "/"}>
            <BarChart3 /> Voir les détails <ChevronRight />
          </Link>
        </section>
      </div>
    </DashboardLayout>
  );
}
function Table() {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Référence</th>
            <th>Activité</th>
            <th>Statut</th>
            <th>Montant</th>
          </tr>
        </thead>
        <tbody>
          {["payé", "en cours", "livré", "pending"].map((s, n) => (
            <tr key={s}>
              <td>#VHT-100{n + 1}</td>
              <td>Commande marketplace</td>
              <td>
                <span className={`status ${s}`}>{s}</span>
              </td>
              <td>{((n + 1) * 3250).toLocaleString("fr-HT")} HTG</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function ManagementPage({ title, text, action }) {
  return (
    <DashboardLayout>
      <PageTitle title={title} text={text} />
      {action && (
        <div className="toolbar">
          <Button>{action}</Button>
        </div>
      )}
      <section className="panel">
        <Table />
      </section>
    </DashboardLayout>
  );
}
function LegacyBecomeSeller() {
  return (
    <Protected roles={["client"]}>
      <DashboardLayout>
        <div className="client-space client-page">
          <motion.header
            className="client-page-header"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span>Évolution vendeur</span>
            <h1>Devenir vendeur</h1>
            <p>
              Présentez votre activité à l’équipe VinnHT et commencez à vendre partout en Haïti.
            </p>
          </motion.header>

          <section className="become-seller-grid">
            <article className="seller-application-card">
              <span>
                <Store />
              </span>
              <h2>Transformez votre activité avec VinnHT</h2>
              <p>
                Une boutique vérifiée vous permet de publier vos produits, recevoir des commandes et
                suivre vos ventes depuis un espace professionnel.
              </p>
              <div className="seller-request-status">
                <small>Statut de la demande</small>
                <strong>En attente</strong>
                <p>Votre dossier sera examiné par un superviseur VinnHT.</p>
              </div>
            </article>

            <form className="seller-application-form">
              <div>
                <span>Votre boutique</span>
                <h2>Demande vendeur</h2>
              </div>
              <label>
                Nom de votre boutique
                <input required placeholder="Ex: Marché Lakay" />
              </label>
              <label>
                Catégorie principale
                <input required placeholder="Ex: Supermarché, Mode, Électronique" />
              </label>
              <label>
                Téléphone WhatsApp
                <input required placeholder="+509 37 00 00 00" />
              </label>
              <label>
                Description
                <textarea
                  rows="6"
                  placeholder="Présentez votre boutique, vos produits et votre ville."
                />
              </label>
              <Button>Envoyer ma demande</Button>
            </form>
          </section>
        </div>
      </DashboardLayout>
    </Protected>
  );
}

function BecomeSeller() {
  const { user, updateUser } = useAuth();

  return (
    <Protected roles={["client"]}>
      <DashboardLayout>
        <BecomeSellerPage api={api} user={user} updateUser={updateUser} />
      </DashboardLayout>
    </Protected>
  );
}

function ClientDashboardPage() {
  const { user } = useAuth();
  const { cart, add } = useCart();
  const { favorites, isFavorite, toggle } = useFavorites();
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [shops, setShops] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    api
      .get("/products")
      .then(({ data }) => setProducts(data))
      .catch(() => setProducts([]));
  }, []);
  useEffect(() => {
    api
      .get("/shops")
      .then(({ data }) => setShops(data))
      .catch(() => setShops([]));
  }, []);
  useEffect(() => {
    api
      .get("/products", { params: { offers: true, limit: 3 } })
      .then(({ data }) => setOffers(data))
      .catch(() => setOffers([]));
  }, []);
  useEffect(() => {
    api
      .get("/client/dashboard")
      .then(({ data }) => setDashboard(data))
      .catch(() => setDashboard(null));
  }, []);

  return (
    <DashboardLayout>
      <ClientDashboardContent
        user={user}
        cartCount={cartCount}
        onAdd={add}
        favorites={favorites}
        isFavorite={isFavorite}
        onToggleFavorite={toggle}
        productData={products}
        offerData={offers}
        shopData={shops}
        dashboardData={dashboard}
      />
    </DashboardLayout>
  );
}

function ClientOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/orders/mine")
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  const selectOrder = async (id) => {
    const { data } = await api.get(`/orders/${id}`);
    setSelectedOrder(data);
  };

  return (
    <DashboardLayout>
      <ClientOrdersContent
        ordersData={orders}
        loading={loading}
        selectedOrder={selectedOrder}
        onSelect={selectOrder}
      />
    </DashboardLayout>
  );
}

function ClientFavoritesPage() {
  const { add } = useCart();
  const { favorites, isFavorite, toggle } = useFavorites();

  return (
    <DashboardLayout>
      <ClientFavoritesContent
        onAdd={add}
        favorites={favorites}
        isFavorite={isFavorite}
        onToggleFavorite={toggle}
      />
    </DashboardLayout>
  );
}

function ClientCartPage() {
  const { cart, remove, updateQuantity } = useCart();

  return (
    <DashboardLayout>
      <ClientCartContent cart={cart} remove={remove} updateQuantity={updateQuantity} />
    </DashboardLayout>
  );
}

function ClientCheckoutPage() {
  const { user } = useAuth();
  const { cart, clear } = useCart();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const createOrder = async ({ address, city }) => {
    setProcessing(true);
    setError("");
    try {
      const { data } = await api.post("/orders", {
        deliveryAddress: `${address}, ${city}`,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      });
      setResult(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de créer la commande.");
    } finally {
      setProcessing(false);
    }
  };

  const simulatePayment = async (orderId, status) => {
    setProcessing(true);
    setError("");
    try {
      const { data } = await api.patch(`/payments/${orderId}/simulate`, {
        status,
      });
      setResult((current) => ({
        ...current,
        paymentStatus: data.paymentStatus,
        reference: data.reference,
      }));
      if (status === "paid") clear();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de simuler le paiement.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <ClientCheckoutContent
        cart={cart}
        user={user}
        processing={processing}
        result={result}
        error={error}
        onSubmit={createOrder}
        onSimulatePayment={simulatePayment}
      />
    </DashboardLayout>
  );
}

function ClientMessagesPage() {
  const { user } = useAuth();
  return (
    <DashboardLayout>
      <MarketplaceMessages api={api} user={user} />
    </DashboardLayout>
  );
}

function SellerMessagesPage() {
  const { user } = useAuth();
  return (
    <DashboardLayout>
      <MarketplaceMessages api={api} user={user} sellerMode />
    </DashboardLayout>
  );
}

function ClientProfilePage() {
  const { user, updateUser, logout } = useAuth();

  return (
    <DashboardLayout>
      <ClientProfileContent api={api} user={user} updateUser={updateUser} onLogout={logout} />
    </DashboardLayout>
  );
}

function ClientSettingsPage() {
  return (
    <DashboardLayout>
      <ClientSettingsContent api={api} />
    </DashboardLayout>
  );
}

function SellerProductsPage() {
  return (
    <DashboardLayout>
      <SellerProductsContent api={api} />
    </DashboardLayout>
  );
}

function AddSellerProductPage() {
  return (
    <DashboardLayout>
      <AddSellerProductContent api={api} />
    </DashboardLayout>
  );
}

function SellerDashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <SellerDashboardContent api={api} user={user} />
    </DashboardLayout>
  );
}

function SellerOrdersPage() {
  return (
    <DashboardLayout>
      <SellerOrdersContent api={api} />
    </DashboardLayout>
  );
}

function SellerSalesPage() {
  return (
    <DashboardLayout>
      <SellerSalesContent api={api} />
    </DashboardLayout>
  );
}

function SellerPayoutsPage() {
  return (
    <DashboardLayout>
      <SellerPayoutsContent api={api} />
    </DashboardLayout>
  );
}

function SellerShopPage() {
  return (
    <DashboardLayout>
      <SellerShopContent api={api} />
    </DashboardLayout>
  );
}

function SellerSettingsPage() {
  return (
    <DashboardLayout>
      <SellerSettingsContent api={api} />
    </DashboardLayout>
  );
}

function SellerProfilePage() {
  const { user, updateUser, logout } = useAuth();

  return (
    <DashboardLayout>
      <SellerProfileContent api={api} user={user} updateUser={updateUser} onLogout={logout} />
    </DashboardLayout>
  );
}

function SupervisorRequestsPage() {
  return (
    <DashboardLayout>
      <SupervisorRequestsContent api={api} />
    </DashboardLayout>
  );
}

function SupervisorRequestDetailPage() {
  const { id } = useParams();
  return (
    <DashboardLayout>
      <SupervisorRequestDetailContent api={api} requestId={id} />
    </DashboardLayout>
  );
}

function DeliveryDashboardPage() {
  const { user } = useAuth();
  return (
    <DashboardLayout>
      <DeliveryDashboardContent api={api} user={user} />
    </DashboardLayout>
  );
}

function DeliveryAssignedPage() {
  const { user } = useAuth();
  return (
    <DashboardLayout>
      <DeliveryMissionsContent api={api} user={user} />
    </DashboardLayout>
  );
}

function DeliveryHistoryPage() {
  const { user } = useAuth();
  return (
    <DashboardLayout>
      <DeliveryMissionsContent api={api} user={user} history />
    </DashboardLayout>
  );
}

function DeliveryProfilePage() {
  const { user, updateUser, logout } = useAuth();
  return (
    <DashboardLayout>
      <DeliveryProfileContent api={api} user={user} updateUser={updateUser} onLogout={logout} />
    </DashboardLayout>
  );
}

function DeliveryManagementPage() {
  return (
    <DashboardLayout>
      <DeliveryManagementContent api={api} />
    </DashboardLayout>
  );
}

function AdminDashboardPage() {
  return (
    <DashboardLayout>
      <AdminDashboardContent api={api} />
    </DashboardLayout>
  );
}

function AdminUsersPage() {
  const { user } = useAuth();
  return (
    <DashboardLayout>
      <AdminUsersContent api={api} currentUser={user} />
    </DashboardLayout>
  );
}

function AdminCategoriesPage() {
  return (
    <DashboardLayout>
      <AdminCategoriesContent api={api} />
    </DashboardLayout>
  );
}

function AdminProductsPage() {
  return (
    <DashboardLayout>
      <AdminProductsContent api={api} />
    </DashboardLayout>
  );
}

function AdminPaymentsPage() {
  return (
    <DashboardLayout>
      <AdminPaymentsContent api={api} />
    </DashboardLayout>
  );
}

function AdminContactRequestsPage() {
  return (
    <DashboardLayout>
      <AdminContactRequestsContent api={api} />
    </DashboardLayout>
  );
}

function AdminProfilePage() {
  const { user, updateUser, logout } = useAuth();
  return (
    <DashboardLayout>
      <AdminProfileContent api={api} user={user} updateUser={updateUser} onLogout={logout} />
    </DashboardLayout>
  );
}

function AdminSettingsPage() {
  return (
    <DashboardLayout>
      <AdminSettingsContent api={api} />
    </DashboardLayout>
  );
}

function AdminResourcePage({ resource }) {
  return (
    <DashboardLayout>
      <AdminResourceContent api={api} resource={resource} />
    </DashboardLayout>
  );
}

function ReportsPage({ role }) {
  return (
    <DashboardLayout>
      <ReportsContent api={api} role={role} />
    </DashboardLayout>
  );
}

function SellersOverviewPage() {
  return (
    <DashboardLayout>
      <SellersOverviewContent api={api} />
    </DashboardLayout>
  );
}

function OperationsDashboardPage({ role }) {
  const { user } = useAuth();
  return (
    <DashboardLayout>
      <OperationsDashboardContent api={api} role={role} user={user} />
    </DashboardLayout>
  );
}

function StaffProfilePage({ role }) {
  const { user, updateUser, logout } = useAuth();
  return (
    <DashboardLayout>
      <StaffProfileContent
        api={api}
        user={user}
        updateUser={updateUser}
        onLogout={logout}
        role={role}
      />
    </DashboardLayout>
  );
}

function StaffSettingsPage({ role }) {
  return (
    <DashboardLayout>
      <StaffSettingsContent api={api} role={role} />
    </DashboardLayout>
  );
}

const pageMap = [];
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/products" element={<ProductsCatalog />} />
      <Route path="/categories/:slug" element={<CategoryProducts />} />
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route path="/shops/:sellerId" element={<ShopDetails />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage register />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/become-seller" element={<BecomeSeller />} />
      <Route
        path="/client"
        element={
          <Protected roles={["client"]}>
            <ClientDashboardPage />
          </Protected>
        }
      />
      <Route
        path="/my-orders"
        element={
          <Protected roles={["client"]}>
            <ClientOrdersPage />
          </Protected>
        }
      />
      <Route
        path="/favorites"
        element={
          <Protected roles={["client"]}>
            <ClientFavoritesPage />
          </Protected>
        }
      />
      <Route
        path="/cart"
        element={
          <Protected roles={["client"]}>
            <ClientCartPage />
          </Protected>
        }
      />
      <Route
        path="/checkout"
        element={
          <Protected roles={["client"]}>
            <ClientCheckoutPage />
          </Protected>
        }
      />
      <Route
        path="/messages"
        element={
          <Protected roles={["client"]}>
            <ClientMessagesPage />
          </Protected>
        }
      />
      <Route
        path="/profile"
        element={
          <Protected roles={["client"]}>
            <ClientProfilePage />
          </Protected>
        }
      />
      <Route
        path="/settings"
        element={
          <Protected roles={["client"]}>
            <ClientSettingsPage />
          </Protected>
        }
      />
      <Route
        path="/seller"
        element={
          <Protected roles={["seller"]}>
            <SellerDashboardPage />
          </Protected>
        }
      />
      <Route
        path="/seller/products"
        element={
          <Protected roles={["seller"]}>
            <SellerProductsPage />
          </Protected>
        }
      />
      <Route
        path="/seller/products/new"
        element={
          <Protected roles={["seller"]}>
            <AddSellerProductPage />
          </Protected>
        }
      />
      <Route
        path="/seller/orders"
        element={
          <Protected roles={["seller"]}>
            <SellerOrdersPage />
          </Protected>
        }
      />
      <Route
        path="/seller/sales"
        element={
          <Protected roles={["seller"]}>
            <SellerSalesPage />
          </Protected>
        }
      />
      <Route
        path="/seller/payouts"
        element={
          <Protected roles={["seller"]}>
            <Navigate to="/seller/sales" replace />
          </Protected>
        }
      />
      <Route
        path="/seller/shop"
        element={
          <Protected roles={["seller"]}>
            <SellerShopPage />
          </Protected>
        }
      />
      <Route
        path="/seller/settings"
        element={
          <Protected roles={["seller"]}>
            <SellerSettingsPage />
          </Protected>
        }
      />
      <Route
        path="/seller/profile"
        element={
          <Protected roles={["seller"]}>
            <SellerProfilePage />
          </Protected>
        }
      />
      <Route
        path="/seller/messages"
        element={
          <Protected roles={["seller"]}>
            <SellerMessagesPage />
          </Protected>
        }
      />
      <Route
        path="/delivery"
        element={
          <Protected roles={["delivery"]}>
            <DeliveryDashboardPage />
          </Protected>
        }
      />
      <Route
        path="/delivery/assigned"
        element={
          <Protected roles={["delivery"]}>
            <DeliveryAssignedPage />
          </Protected>
        }
      />
      <Route
        path="/delivery/history"
        element={
          <Protected roles={["delivery"]}>
            <DeliveryHistoryPage />
          </Protected>
        }
      />
      <Route
        path="/delivery/profile"
        element={
          <Protected roles={["delivery"]}>
            <DeliveryProfilePage />
          </Protected>
        }
      />
      <Route
        path="/manager"
        element={
          <Protected roles={["manager"]}>
            <OperationsDashboardPage role="manager" />
          </Protected>
        }
      />
      <Route
        path="/manager/deliveries"
        element={
          <Protected roles={["manager", "admin"]}>
            <DeliveryManagementPage />
          </Protected>
        }
      />
      <Route
        path="/manager/sales-reports"
        element={
          <Protected roles={["manager", "admin"]}>
            <ReportsPage role="manager" />
          </Protected>
        }
      />
      <Route
        path="/manager/sellers"
        element={
          <Protected roles={["manager", "admin"]}>
            <SellersOverviewPage />
          </Protected>
        }
      />
      <Route
        path="/manager/profile"
        element={
          <Protected roles={["manager"]}>
            <StaffProfilePage role="Manager" />
          </Protected>
        }
      />
      <Route
        path="/manager/settings"
        element={
          <Protected roles={["manager"]}>
            <StaffSettingsPage role="manager" />
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <Protected roles={["admin"]}>
            <AdminDashboardPage />
          </Protected>
        }
      />
      <Route
        path="/admin/users"
        element={
          <Protected roles={["admin"]}>
            <AdminUsersPage />
          </Protected>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <Protected roles={["admin"]}>
            <AdminCategoriesPage />
          </Protected>
        }
      />
      <Route
        path="/admin/products"
        element={
          <Protected roles={["admin"]}>
            <AdminProductsPage />
          </Protected>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <Protected roles={["admin"]}>
            <AdminPaymentsPage />
          </Protected>
        }
      />
      <Route
        path="/admin/contact-requests"
        element={
          <Protected roles={["admin"]}>
            <AdminContactRequestsPage />
          </Protected>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <Protected roles={["admin"]}>
            <AdminProfilePage />
          </Protected>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <Protected roles={["admin"]}>
            <AdminSettingsPage />
          </Protected>
        }
      />
      <Route
        path="/supervisor"
        element={
          <Protected roles={["supervisor"]}>
            <OperationsDashboardPage role="supervisor" />
          </Protected>
        }
      />
      <Route
        path="/supervisor/seller-requests"
        element={
          <Protected roles={["supervisor"]}>
            <SupervisorRequestsPage />
          </Protected>
        }
      />
      <Route
        path="/supervisor/seller-requests/:id"
        element={
          <Protected roles={["supervisor"]}>
            <SupervisorRequestDetailPage />
          </Protected>
        }
      />
      <Route
        path="/supervisor/reports"
        element={
          <Protected roles={["supervisor"]}>
            <ReportsPage role="superviseur" />
          </Protected>
        }
      />
      <Route
        path="/supervisor/profile"
        element={
          <Protected roles={["supervisor"]}>
            <StaffProfilePage role="Superviseur" />
          </Protected>
        }
      />
      <Route
        path="/supervisor/settings"
        element={
          <Protected roles={["supervisor"]}>
            <StaffSettingsPage role="superviseur" />
          </Protected>
        }
      />
      {Object.keys(menus)
        .filter((role) => !["client", "seller", "delivery", "admin", "manager", "supervisor"].includes(role))
        .map((role) => (
          <Route
            key={role}
            path={`/${role}`}
            element={
              <Protected roles={[role]}>
                <Dashboard role={role} />
              </Protected>
            }
          />
        ))}
      {pageMap.map(([path, title, text, action, roles]) => (
        <Route
          key={path}
          path={path}
          element={
            <Protected roles={roles}>
              <ManagementPage title={title} text={text} action={action} />
            </Protected>
          }
        />
      ))}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
export default function App() {
  return (
    <Providers>
      <AppRoutes />
    </Providers>
  );
}
