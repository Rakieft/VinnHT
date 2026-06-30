import axios from "axios";
import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  Car,
  ChevronRight,
  CircleUserRound,
  Clock3,
  CheckCircle2,
  CreditCard,
  Download,
  FileSignature,
  Flame,
  Headphones,
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
  Scale,
  Send,
  Share2,
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
import { apiOrigin, assetUrl } from "./config/runtime.js";
import { productAttributeEntries } from "./config/productAttributes.js";
import { shopPublicPath, shopSellerIdFromParam } from "./utils/shopUrl.js";
import sousHeroImage from "./assets/images/sous-hero-vinnht-student.jpg";
import contactSupportImage from "./assets/images/contact-support-hands-vinnht.jpg";
import "./styles/responsive-overrides.css";
import "./styles/auth-search.css";
import "./styles/brand-auth-fixes.css";
import "./styles/dashboard-navigation.css";

const USER_TERMS_VERSION = "2026-06-28-v5";

const lazyNamed = (loader, exportName) =>
  React.lazy(() => loader().then((module) => ({ default: module[exportName] })));

const loadClientSpace = () => import("./components/ClientSpace.jsx");
const ClientCartContent = lazyNamed(loadClientSpace, "ClientCartContent");
const ClientCheckoutContent = lazyNamed(loadClientSpace, "ClientCheckoutContent");
const ClientDashboardContent = lazyNamed(loadClientSpace, "ClientDashboardContent");
const ClientFavoritesContent = lazyNamed(loadClientSpace, "ClientFavoritesContent");
const ClientOrdersContent = lazyNamed(loadClientSpace, "ClientOrdersContent");
const ClientProfileContent = lazyNamed(loadClientSpace, "ClientProfileContent");
const ClientSettingsContent = lazyNamed(loadClientSpace, "ClientSettingsContent");

const loadSellerFlow = () => import("./components/SellerFlow.jsx");
const AddSellerProductContent = lazyNamed(loadSellerFlow, "AddSellerProductContent");
const SellerDashboardContent = lazyNamed(loadSellerFlow, "SellerDashboardContent");
const SellerOrdersContent = lazyNamed(loadSellerFlow, "SellerOrdersContent");
const SellerPayoutsContent = lazyNamed(loadSellerFlow, "SellerPayoutsContent");
const SellerProfileContent = lazyNamed(loadSellerFlow, "SellerProfileContent");
const SellerProductsContent = lazyNamed(loadSellerFlow, "SellerProductsContent");
const SellerSalesContent = lazyNamed(loadSellerFlow, "SellerSalesContent");
const SellerSettingsContent = lazyNamed(loadSellerFlow, "SellerSettingsContent");
const SellerShopContent = lazyNamed(loadSellerFlow, "SellerShopContent");
const SupervisorRequestsContent = lazyNamed(loadSellerFlow, "SupervisorRequestsContent");
const SupervisorRequestDetailContent = lazyNamed(
  loadSellerFlow,
  "SupervisorRequestDetailContent",
);

const loadDeliveryFlow = () => import("./components/DeliveryFlow.jsx");
const DeliveryDashboardContent = lazyNamed(loadDeliveryFlow, "DeliveryDashboardContent");
const DeliveryManagementContent = lazyNamed(loadDeliveryFlow, "DeliveryManagementContent");
const DeliveryMissionsContent = lazyNamed(loadDeliveryFlow, "DeliveryMissionsContent");
const DeliveryProfileContent = lazyNamed(loadDeliveryFlow, "DeliveryProfileContent");

const loadAdminFlow = () => import("./components/AdminFlow.jsx");
const AdminCategoriesContent = lazyNamed(loadAdminFlow, "AdminCategoriesContent");
const AdminContactRequestsContent = lazyNamed(loadAdminFlow, "AdminContactRequestsContent");
const AdminDashboardContent = lazyNamed(loadAdminFlow, "AdminDashboardContent");
const AdminPaymentsContent = lazyNamed(loadAdminFlow, "AdminPaymentsContent");
const AdminProfileContent = lazyNamed(loadAdminFlow, "AdminProfileContent");
const AdminProductsContent = lazyNamed(loadAdminFlow, "AdminProductsContent");
const AdminResourceContent = lazyNamed(loadAdminFlow, "AdminResourceContent");
const AdminSettingsContent = lazyNamed(loadAdminFlow, "AdminSettingsContent");
const AdminUsersContent = lazyNamed(loadAdminFlow, "AdminUsersContent");
const OperationsDashboardContent = lazyNamed(loadAdminFlow, "OperationsDashboardContent");
const ReportsContent = lazyNamed(loadAdminFlow, "ReportsContent");
const SellersOverviewContent = lazyNamed(loadAdminFlow, "SellersOverviewContent");
const StaffProfileContent = lazyNamed(loadAdminFlow, "StaffProfileContent");
const StaffSettingsContent = lazyNamed(loadAdminFlow, "StaffSettingsContent");

const BecomeSellerPage = React.lazy(() => import("./pages/client/BecomeSeller.jsx"));
const MarketplaceMessages = React.lazy(() => import("./components/MarketplaceMessages.jsx"));

const api = axios.create({ baseURL: `${apiOrigin}/api`, withCredentials: true });
const whatsappNumber = (value = "") => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 8 ? `509${digits}` : digits;
};

const productSimilarityStopWords = new Set([
  "avec",
  "pour",
  "dans",
  "sans",
  "produit",
  "nouveau",
  "nouvelle",
  "original",
  "originale",
  "homme",
  "femme",
  "enfant",
  "garcon",
  "fille",
  "mode",
  "chaussure",
  "chaussures",
  "soulier",
  "souliers",
  "taille",
  "couleur",
  "noir",
  "noire",
  "blanc",
  "blanche",
  "rouge",
  "bleu",
  "bleue",
]);

const normalizeProductText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const productSimilarityKeywords = (product = {}) => {
  const attributeWords = productAttributeEntries(product)
    .filter((attribute) => ["marque", "brand", "modele", "model"].includes(attribute.key))
    .map((attribute) => attribute.value)
    .join(" ");
  return [
    ...new Set(
      normalizeProductText(`${product.name || ""} ${attributeWords}`)
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length >= 3 && !productSimilarityStopWords.has(word)),
    ),
  ].slice(0, 6);
};

const relevantSimilarProducts = (baseProduct, candidates) => {
  const keywords = productSimilarityKeywords(baseProduct);
  if (!keywords.length) return [];

  return candidates
    .map((candidate) => {
      const candidateText = normalizeProductText(
        `${candidate.name || ""} ${candidate.category_name || ""}`,
      );
      const score = keywords.reduce(
        (total, keyword) => total + (candidateText.includes(keyword) ? 1 : 0),
        0,
      );
      return { candidate, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ candidate }) => candidate);
};
const productPrice = (product) => {
  const promotionIsActive =
    product.is_featured &&
    Number(product.promotional_price) > 0 &&
    Number(product.promotional_price) < Number(product.price) &&
    (!product.offer_ends_at || new Date(product.offer_ends_at) > new Date());

  return promotionIsActive ? Number(product.promotional_price) : Number(product.price || 0);
};
const productOfferIsActive = (product) =>
  Boolean(
    product?.is_featured &&
      Number(product.promotional_price) > 0 &&
      Number(product.promotional_price) < Number(product.price) &&
      (!product.offer_ends_at || new Date(product.offer_ends_at) > new Date()),
  );
const productPackSizes = (product) => {
  if (Array.isArray(product?.pack_options)) {
    return product.pack_options
      .map((option) => Number(option.units_per_pack))
      .filter((packSize) => Number.isFinite(packSize) && packSize > 1);
  }

  return String(product?.pack_sizes || "")
    .split(",")
    .map((packSize) => Number(packSize))
    .filter((packSize) => Number.isFinite(packSize) && packSize > 1);
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
const cartLineKey = (item) =>
  `${Number(item?.id ?? item?.productId)}:${Number(item?.pack_size ?? item?.packSize ?? 1)}`;
const cartUnitsCount = (items) =>
  items.reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0) *
        Number(item.pack_size || item.packSize || 1),
    0,
  );
const roleHome = {
  client: "/client",
  seller: "/seller",
  delivery: "/delivery",
  manager: "/manager",
  admin: "/admin",
};
const switchableAccountRoles = ["client", "seller", "delivery"];
const roleDisplay = {
  client: { label: "Espace client", icon: CircleUserRound },
  seller: { label: "Espace vendeur", icon: Store },
  delivery: { label: "Espace livreur", icon: Truck },
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
const haitiDepartments = [
  "Artibonite",
  "Centre",
  "Grand'Anse",
  "Nippes",
  "Nord",
  "Nord-Est",
  "Nord-Ouest",
  "Ouest",
  "Sud",
  "Sud-Est",
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
const categoryVisuals = {
  supermarche: [ShoppingBasket, ["Alimentation", "Boissons", "Hygiène", "Entretien"]],
  electronique: [Smartphone, ["Téléphones", "Ordinateurs", "Audio", "Accessoires"]],
  mode: [ShoppingBag, ["Femme", "Homme", "Enfant", "Chaussures"]],
  "maison-meubles": [Sofa, ["Meubles", "Cuisine", "Décoration", "Literie"]],
  vehicules: [Car, ["Voitures", "Motos", "Pièces", "Accessoires"]],
  immobilier: [Building2, ["Maisons", "Terrains", "Locations", "Bureaux"]],
  services: [BriefcaseBusiness, ["Réparation", "Transport", "Événement", "Professionnels"]],
  emplois: [Users, ["Emplois", "Stages", "Freelance", "Formations"]],
  agriculture: [ShoppingBasket, ["Semences", "Récoltes", "Matériel", "Élevage"]],
  animaux: [Heart, ["Animaux", "Alimentation", "Soins", "Accessoires"]],
  "beaute-soins": [Sparkles, ["Beauté", "Cheveux", "Parfums", "Bien-être"]],
  autres: [ShoppingBag, ["Nouveautés", "Collections", "Occasions", "Autres"]],
};
const supportCategories = [
  ["general", "Question générale"],
  ["order", "Commande"],
  ["payment", "Paiement"],
  ["delivery", "Livraison"],
  ["seller", "Compte vendeur"],
  ["technical", "Problème technique"],
  ["partnership", "Partenariat"],
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
      "https://images.unsplash.com/photo-1542838132-92c53300491eauto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    name: "Casque audio premium",
    price: 7850,
    city: "Pétion-Ville",
    category_name: "Électronique",
    seller_name: "Tech Ayiti",
    image_url:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30eauto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    name: "Fauteuil contemporain",
    price: 18900,
    city: "Delmas",
    category_name: "Maison & Meubles",
    seller_name: "Kay Design",
    image_url:
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374cauto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    name: "Sac artisanal haïtien",
    price: 4200,
    city: "Jacmel",
    category_name: "Mode",
    seller_name: "Kreyol Chic",
    image_url:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 5,
    name: "Smartphone reconditionné",
    price: 24500,
    city: "Cap-Haïtien",
    category_name: "Électronique",
    seller_name: "Mobile Plus",
    image_url:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9auto=format&fit=crop&w=900&q=80",
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
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeRole, setActiveRole] = useState("client");
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [cartPriceNotice, setCartPriceNotice] = useState(null);
  useEffect(() => {
    localStorage.removeItem("vinnht_messages");
    localStorage.removeItem("vinnht_user");
    localStorage.removeItem("vinnht_active_role");
    localStorage.removeItem("vinnht_cart");
    localStorage.removeItem("vinnht_favorites");
  }, []);
  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => {
        const authenticatedUser = data?.user || data;

        if (!authenticatedUser?.id) {
          setUser(null);
          setActiveRole("client");
          return;
        }

        const normalizedRoles = Array.isArray(authenticatedUser.roles)
          ? authenticatedUser.roles
          : [authenticatedUser.role].filter(Boolean);
        const normalizedUser = {
          ...authenticatedUser,
          roles: normalizedRoles,
        };

        setUser(normalizedUser);
        if (!normalizedRoles.includes(activeRole)) {
          const nextRole = normalizedUser.role || normalizedRoles[0] || "client";
          setActiveRole(nextRole);
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, []);
  const refreshCart = React.useCallback(
    async ({ notify = true } = {}) => {
      if (!user?.roles?.includes("client")) return { cart: [], changes: [] };

      const previousById = new Map(
        cart.map((item) => [cartLineKey(item), Number(item.price || 0)]),
      );
      const { data } = await api.get("/cart");
      const refreshedCart = Array.isArray(data) ? data : [];
      const changes = refreshedCart.flatMap((item) => {
        const currentPrice = Number(item.price || 0);
        const previousPrice = item.price_changed
          ? Number(item.previous_price || 0)
          : previousById.get(cartLineKey(item));

        if (
          previousPrice === undefined ||
          Math.abs(previousPrice - currentPrice) < 0.01
        ) {
          return [];
        }

        return [
          {
            id: cartLineKey(item),
            name: item.name,
            previousPrice,
            currentPrice,
          },
        ];
      });

      setCart(refreshedCart);
      if (notify && changes.length) {
        setCartPriceNotice({ id: Date.now(), changes });
      }

      return { cart: refreshedCart, changes };
    },
    [cart, user],
  );

  const refreshFavorites = React.useCallback(async () => {
    if (!user?.roles?.includes("client")) return [];
    const { data } = await api.get("/favorites");
    const refreshedFavorites = Array.isArray(data) ? data : [];
    setFavorites(refreshedFavorites);
    return refreshedFavorites;
  }, [user]);

  useEffect(() => {
    if (!user?.roles?.includes("client")) {
      setCart([]);
      setFavorites([]);
      setCartPriceNotice(null);
      return;
    }

    Promise.all([refreshCart(), refreshFavorites()]).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!user?.roles?.includes("client")) return undefined;

    const now = Date.now();
    const nextExpiration = [...cart, ...favorites]
      .filter(
        (product) =>
          product?.is_featured &&
          Number(product.promotional_price) > 0 &&
          Number(product.promotional_price) <
            Number(product.base_price || product.price || Infinity) &&
          product.offer_ends_at,
      )
      .map((product) => new Date(product.offer_ends_at).getTime())
      .filter((expiration) => Number.isFinite(expiration) && expiration > now)
      .sort((first, second) => first - second)[0];

    if (!nextExpiration) return undefined;

    const delay = Math.min(
      Math.max(nextExpiration - now + 500, 500),
      2_147_000_000,
    );
    const timer = window.setTimeout(() => {
      Promise.all([refreshCart(), refreshFavorites()]).catch(() => {});
    }, delay);

    return () => window.clearTimeout(timer);
  }, [cart, favorites, user?.id]);
  const auth = useMemo(
    () => ({
      user,
      authLoading,
      login(data) {
        const authenticatedUser = data?.user || data;
        const normalizedRoles = Array.isArray(authenticatedUser?.roles)
          ? authenticatedUser.roles
          : [authenticatedUser?.role].filter(Boolean);
        const normalizedUser = {
          ...authenticatedUser,
          roles: normalizedRoles,
        };

        setUser(normalizedUser);
        const nextRole = normalizedRoles.includes(normalizedUser.role)
          ? normalizedUser.role
          : normalizedRoles[0] || "client";
        setActiveRole(nextRole);
      },
      updateUser(nextUser) {
        setUser(nextUser);
      },
      activeRole,
      switchRole(role) {
        const roles = user?.roles || [];
        if (!roles.includes(role) && !roles.includes("admin")) return;
        setActiveRole(role);
      },
      async logout() {
        await api.post("/auth/logout").catch(() => {});
        setUser(null);
        setActiveRole("client");
        setCart([]);
        setFavorites([]);
        setCartPriceNotice(null);
      },
    }),
    [user, activeRole, authLoading]
  );
  const cartValue = useMemo(
    () => ({
      cart,
      priceNotice: cartPriceNotice,
      refreshCart,
      dismissPriceNotice() {
        setCartPriceNotice(null);
      },
      async add(product, packSize = 1) {
        if (!user?.roles?.includes("client")) {
          throw new Error("CLIENT_REQUIRED");
        }
        const stock = Math.max(0, Number(product.stock) || 0);
        const normalizedPackSize = Number(packSize || 1);
        const maximum = Math.floor(stock / normalizedPackSize);
        if (maximum < 1) {
          throw new Error("OUT_OF_STOCK");
        }
        const current = cart.find(
          (item) =>
            Number(item.id) === Number(product.id) &&
            Number(item.pack_size || 1) === normalizedPackSize,
        );
        const currentQuantity = Number(current?.quantity) || 0;
        const quantity = Math.min(currentQuantity + 1, maximum);
        await api.put(`/cart/${product.id}`, {
          quantity,
          packSize: normalizedPackSize,
        });
        const { data } = await api.get("/cart");
        setCart(Array.isArray(data) ? data : []);
        return quantity;
      },
      async remove(id, packSize = 1) {
        const normalizedPackSize = Number(packSize || 1);
        await api.delete(`/cart/${id}`, {
          params: { packSize: normalizedPackSize },
        });
        setCart((items) =>
          items.filter(
            (item) =>
              !(
                Number(item.id) === Number(id) &&
                Number(item.pack_size || 1) === normalizedPackSize
              ),
          ),
        );
      },
      async updateQuantity(id, quantity, packSize = 1) {
        const normalizedPackSize = Number(packSize || 1);
        const item = cart.find(
          (product) =>
            Number(product.id) === Number(id) &&
            Number(product.pack_size || 1) === normalizedPackSize,
        );
        const maximum = Math.max(
          1,
          Number(item?.available_pack_count) ||
            Math.floor(Number(item?.stock || 1) / normalizedPackSize),
        );
        const nextQuantity = Math.min(maximum, Math.max(1, Number(quantity) || 1));
        await api.put(`/cart/${id}`, {
          quantity: nextQuantity,
          packSize: normalizedPackSize,
        });
        setCart((items) =>
          items.map((product) =>
            Number(product.id) === Number(id) &&
            Number(product.pack_size || 1) === normalizedPackSize
              ? {
                  ...product,
                  quantity: nextQuantity,
                  units_total: nextQuantity * normalizedPackSize,
                }
              : product,
          ),
        );
      },
      async clear() {
        await api.delete("/cart");
        setCart([]);
        setCartPriceNotice(null);
      },
    }),
    [cart, user, cartPriceNotice, refreshCart]
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
  const count = cartUnitsCount(cart);
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
          <Link to="/about">À propos</Link>
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
function SocialIcon({ type }) {
  if (type === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 8.5h2.4V5h-2.9C10.6 5 9 6.7 9 9.8V12H6.7v3.6H9V22h4.1v-6.4h2.8l.5-3.6h-3.3V10c0-1 .3-1.5.9-1.5Z" />
      </svg>
    );
  }
  if (type === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8Zm8.9 2.1a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 7.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm0 2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z" />
      </svg>
    );
  }
  if (type === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16.5 3c.4 2.4 1.7 3.9 4 4.2v3.6a7 7 0 0 1-4-1.3v5.8c0 4-2.5 6.7-6.2 6.7A6.2 6.2 0 0 1 4 15.8c0-3.8 3.3-6.7 7.2-6v3.7c-1.7-.5-3.3.5-3.3 2.2 0 1.5 1.1 2.5 2.5 2.5 1.5 0 2.4-.9 2.4-2.8V3h3.7Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a9.7 9.7 0 0 0-8.4 14.6L2 22l5.6-1.5A9.8 9.8 0 1 0 12 2Zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-3.3.9.9-3.2-.2-.3A7.8 7.8 0 1 1 12 19.8Zm4.3-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8.9-.1.2-.3.2-.5.1-2-1-3.4-1.8-4.7-4.1-.4-.6.4-.6 1-1.9.1-.2.1-.4 0-.6l-.7-1.8c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.9 2.3 1 2.5c.1.2 1.7 2.6 4.1 3.6 1.5.7 2.1.7 2.9.6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.1-.2-.2-.5-.3Z" />
    </svg>
  );
}

function Footer() {
  const socials = [
    ["facebook", "Facebook", "https://www.facebook.com"],
    ["instagram", "Instagram", "https://www.instagram.com"],
    ["tiktok", "TikTok", "https://www.tiktok.com"],
    ["whatsapp", "WhatsApp", "/contact"],
  ];

  return (
    <footer className="footer footer-premium">
      <div className="footer-main">
        <Link className="brand light" to="/">
          <img src="/vinnht-logo.png" alt="Logo VinnHT" />
          <b>VinnHT</b>
        </Link>
        <p>
          Le marché numérique d'Haïti pour découvrir des rayons, acheter auprès de boutiques
          vérifiées et suivre chaque commande avec confiance.
        </p>
        <div className="social-row" aria-label="Réseaux sociaux VinnHT">
          {socials.map(([type, label, href]) => (
            <a
              href={href}
              key={type}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noreferrer" : undefined}
              aria-label={label}
              title={label}
            >
              <SocialIcon type={type} />
            </a>
          ))}
        </div>
      </div>

      <div>
        <h4>Explorer</h4>
        <Link to="/">Accueil</Link>
        <Link to="/categories">Rayons</Link>
        <Link to="/products">Catalogue</Link>
        <Link to="/about">À propos</Link>
        <Link to="/contact">Support</Link>
      </div>

      <div>
        <h4>Espaces</h4>
        <Link to="/client">Espace client</Link>
        <Link to="/seller">Espace vendeur</Link>
        <Link to="/delivery">Espace livreur</Link>
        <Link to="/login">Connexion</Link>
      </div>

      <div>
        <h4>Confiance</h4>
        <span>Paiement protégé VinnHT</span>
        <span>Preuve MonCash suivie</span>
        <span>Livraison assignée</span>
        <span>Support local VinnHT</span>
        <Link to="/terms">Conditions d’utilisation</Link>
      </div>

      <div className="footer-bottom">
        <span>© 2026 VinnHT. Le marché numérique d'Haïti.</span>
        <span>Plateforme marketplace premium.</span>
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
  const { user } = useAuth();

  if (user) {
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
  const activeOffer = productOfferIsActive(product);
  const packSizes = productPackSizes(product);
  return (
    <motion.article className="product-card" whileHover={{ y: -8 }}>
      <Link className="product-media" to={`/products/${product.id}`}>
        <img
          src={assetUrl(product.image_url)}
          alt={product.name}
          loading="lazy"
          decoding="async"
        />
        {activeOffer ? (
          <span className="vinnht-offer-badge" aria-label="Offre spéciale VinnHT">
            <Sparkles size={13} />
            Offre
          </span>
        ) : (
          <Badge tone="gold">Tendance</Badge>
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
          <span className="product-card-price">
            {packSizes.length > 0 && <small>Prix à l’unité</small>}
            <strong>{productPrice(product).toLocaleString("fr-HT")} HTG</strong>
          </span>
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
      setShops(shopsResponse.data.slice(0, 12));
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
            <div className="hero-trust-row">
              <span><ShieldCheck /> Paiement sécurisé</span>
              <span><Store /> Vendeurs vérifiés</span>
              <span><Headphones /> Support local</span>
            </div>
            <div className="hero-actions">
              <Button to="/categories">
                Explorer les rayons <ArrowRight size={18} />
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
          <div className="hero-orbit-animation" aria-hidden="true">
            <span className="hero-orbit-ring" />
            <ShoppingBag />
          </div>
          <div className="hero-card floating-a">
            <b>+12 rayons</b>
            <span>Marché complet</span>
          </div>
          <div className="hero-card floating-b">
            <b>Livraison suivie</b>
            <span>Commandes en temps réel</span>
          </div>
          <div className="hero-live-card">
            <span>En direct sur VinnHT</span>
            <b>{Number(stats.products || 0)} produit(s) disponibles</b>
            <small>{Number(stats.sellers || 0)} boutique(s) validée(s)</small>
          </div>
        </motion.div>
      </section>
      <AnimatedSection className="home-sous-hero">
        <motion.div
          className="home-sous-hero-card image-only"
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
        >
          <img
            src={sousHeroImage}
            alt="Jeune étudiante VinnHT invitant à découvrir les rayons"
            loading="lazy"
            decoding="async"
          />
        </motion.div>
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
          <Badge tone="blue">Pourquoi VinnHT </Badge>
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
                <span className="shop-card-logo">
                  {shop.shop_logo_url ? (
                    <img src={assetUrl(shop.shop_logo_url)} alt={`Logo ${shop.shop_name}`} />
                  ) : (
                    shop.shop_name?.[0] || <Store />
                  )}
                </span>
                <h3>{shop.shop_name}</h3>
                <p>{shop.category || "Boutique VinnHT"}</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        {!shops.length && <div className="empty-state"><Store /><h3>Aucune boutique active</h3><p>Les boutiques validées apparaîtront ici.</p></div>}
      </AnimatedSection>
      <AnimatedSection className="mobile-app">
        <div className="mobile-app-copy">
          <Badge tone="gold">
            <Smartphone size={15} /> Application VinnHT
          </Badge>
          <h2>Votre marché numérique bientôt dans votre poche.</h2>
          <p>
            Une expérience mobile rapide et sécurisée pour acheter, vendre et suivre chaque
            livraison partout en Haïti.
          </p>
          <div className="mobile-app-features">
            <span><ShoppingBag /> Acheter facilement</span>
            <span><Bell /> Alertes en temps réel</span>
            <span><Truck /> Suivre les livraisons</span>
          </div>
          <div className="mobile-app-status">
            <i />
            <div>
              <small>Statut du projet mobile</small>
              <strong>En préparation</strong>
            </div>
          </div>
        </div>
        <div className="phone-mock">
          <div className="phone-mock-top">
            <img src="/vinnht-logo.png" alt="VinnHT" />
            <span><b>VinnHT</b><small>Le marché numérique d’Haïti</small></span>
            <Bell />
          </div>
          <div className="phone-mock-screen">
            <span>Bonjour</span>
            <h3>Que recherchez-vous aujourd’hui </h3>
            <div className="phone-mock-search"><Search /> Rechercher sur VinnHT</div>
            <div className="phone-mock-actions">
              <span><ShoppingBag /><small>Acheter</small></span>
              <span><Store /><small>Vendre</small></span>
              <span><Truck /><small>Suivre</small></span>
            </div>
            <div className="phone-mock-banner">
              <ShieldCheck />
              <span><b>Marketplace sécurisée</b><small>Commerces vérifiés par VinnHT</small></span>
            </div>
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
  const { user } = useAuth();
  const [open, setOpen] = useState(0);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    category: "general",
    orderId: "",
    subject: "",
    message: "",
  });
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const [config, setConfig] = useState({});
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeSupportRequest, setActiveSupportRequest] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportDraft, setSupportDraft] = useState("");
  const [supportSending, setSupportSending] = useState(false);
  const [faqQuery, setFaqQuery] = useState("");
  const [faqCategory, setFaqCategory] = useState("all");
  const faq = [
    [
      "Comment devenir vendeur ",
      "Connectez-vous à votre espace client, ouvrez Devenir vendeur puis envoyez votre dossier. Un superviseur VinnHT vérifiera ensuite votre demande.",
      "seller",
    ],
    [
      "Comment suivre une commande ",
      "Ouvrez Mes commandes depuis votre espace client pour consulter le paiement, la préparation et la livraison.",
      "order",
    ],
    [
      "Comment fonctionne le paiement ",
      "Le client paie le compte MonCash VinnHT. Les fonds restent protégés jusqu’à la confirmation de réception.",
      "payment",
    ],
    [
      "Comment contacter directement le support ",
      "Utilisez ce formulaire ou ouvrez une conversation support depuis votre espace client.",
      "general",
    ],
    [
      "Comment signaler un problème de livraison ",
      "Choisissez Livraison comme sujet et associez la commande concernée pour accélérer le traitement.",
      "delivery",
    ],
  ];

  const loadRequests = () => {
    if (!user) return;
    api.get("/support/requests").then(({ data }) => setRequests(data));
  };

  const openSupportRequest = async (request) => {
    const { data } = await api.get(`/support/requests/${request.id}/messages`);
    setActiveSupportRequest(request);
    setSupportMessages(data.messages || []);
  };

  const replyToSupport = async (event) => {
    event.preventDefault();
    if (!supportDraft.trim() || !activeSupportRequest) return;
    setSupportSending(true);
    try {
      const { data } = await api.post(`/support/requests/${activeSupportRequest.id}/messages`, {
        body: supportDraft.trim(),
      });
      setFeedback(data.message);
      setSupportDraft("");
      await Promise.all([openSupportRequest(activeSupportRequest), loadRequests()]);
    } catch (error) {
      setFeedback(error.response?.data?.message || "Impossible d’envoyer votre réponse.");
    } finally {
      setSupportSending(false);
    }
  };

  useEffect(() => {
    api.get("/public/config").then(({ data }) => setConfig(data));
    if (user) {
      setForm((current) => ({
        ...current,
        name: current.name || user.name || "",
        email: current.email || user.email || "",
        phone: current.phone || user.phone || "",
      }));
      api.get("/orders/mine").then(({ data }) => setOrders(data));
      loadRequests();
    }
  }, [user?.id]);

  const submitContact = async (event) => {
    event.preventDefault();
    setSending(true);
    setFeedback("");
    try {
      const endpoint = user ? "/support/requests" : "/contact";
      const payload = user
        ? {
            phone: form.phone,
            category: form.category,
            orderId: form.orderId || undefined,
            subject: form.subject,
            message: form.message,
          }
        : form;
      const { data } = await api.post(endpoint, payload);
      setFeedback(data.message);
      setForm((current) => ({
        ...current,
        orderId: "",
        subject: "",
        message: "",
      }));
      loadRequests();
    } catch (error) {
      setFeedback(error.response?.data?.message || "Impossible d’envoyer votre message.");
    } finally {
      setSending(false);
    }
  };
  const visibleFaq = faq.filter(
    ([question, answer, category]) =>
      (faqCategory === "all" || category === faqCategory) &&
      `${question} ${answer}`.toLowerCase().includes(faqQuery.toLowerCase()),
  );
  const channels = [
    [
      MessageCircle,
      "WhatsApp",
      config.supportWhatsapp || "À configurer",
      "Réponse rapide",
      config.supportWhatsapp
        ? `https://wa.me/${String(config.supportWhatsapp).replace(/\D/g, "")}`
        : null,
    ],
    [Mail, "Email", config.supportEmail || "support@vinnht.ht", "Support officiel", `mailto:${config.supportEmail || "support@vinnht.ht"}`],
    [Phone, "Téléphone", config.supportPhone || "À configurer", config.supportHours || "Assistance client", config.supportPhone ? `tel:${config.supportPhone}` : null],
    [MapPin, "Adresse", config.supportAddress || "Port-au-Prince, Haïti", config.supportHours || "Bureau opérationnel", null],
  ];

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
          <div className="support-promise">
            <span><Clock3 /> Réponse suivie</span>
            <span><ShieldCheck /> Numéro de dossier</span>
            <span><MessageCircle /> Support humain</span>
          </div>
        </div>
        <div className="contact-lottie contact-hero-image-card">
          <img
            src={contactSupportImage}
            alt="Equipe support VinnHT unie pour accompagner les clients"
            decoding="async"
            fetchPriority="high"
          />
        </div>
      </section>
      <section className="support-steps">
        {[
          [Send, "Envoyez votre demande", "Choisissez le sujet et décrivez votre besoin."],
          [Bell, "Recevez une référence", "Chaque message obtient un numéro de dossier."],
          [CheckCircle2, "Suivez la réponse", "Consultez l’état depuis votre espace client."],
        ].map(([Icon, title, text], index) => (
          <article key={title}>
            <span>{index + 1}</span>
            <Icon />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>
      <section className="section contact-grid">
        {channels.map(([Icon, title, value, note, href]) => (
          <motion.article className="contact-card" whileHover={{ y: -8 }} key={title}>
            <Icon />
            <h3>{title}</h3>
            <b>{value}</b>
            <p>{note}</p>
            {href && <a href={href} target={href.startsWith("http") ? "_blank" : undefined}>Ouvrir <ArrowRight /></a>}
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
          {!user && <label>Nom complet<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Votre nom" /></label>}
          {!user && <label>Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="vous@email.com" /></label>}
          <label>
            Numéro de téléphone
            <input
              required
              type="tel"
              minLength="8"
              maxLength="30"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="Ex : 37 00 00 00"
            />
          </label>
          <label>Type de demande<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{supportCategories.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          {user && <label>Commande concernée<select value={form.orderId} onChange={(event) => setForm({ ...form, orderId: event.target.value })}><option value="">Aucune commande</option>{orders.map((order) => <option value={order.id} key={order.id}>{order.order_number}</option>)}</select></label>}
          <label>
            Sujet
            <input required value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Sujet de votre demande" />
          </label>
          <label>
            Message
            <textarea required minLength="10" rows="5" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Comment pouvons-nous aider " />
          </label>
          {feedback && <strong>{feedback}</strong>}
          <button className="button primary" disabled={sending}>
            {sending ? "Envoi en cours..." : "Envoyer le message"} <ArrowRight size={18} />
          </button>
          {user && <Link className="contact-support-chat" to="/messages?support=1"><MessageCircle /> Discuter avec le support</Link>}
        </form>
      </section>
      {user && (
        <section className="section support-tracking-section">
          <SectionHead eyebrow="Suivi personnel" title="Mes demandes de support" />
          <div className="support-request-grid">
            {requests.map((request) => (
              <article id={`support-${request.id}`} key={request.id}>
                <header><span>{request.reference}</span><Badge tone={request.status === "resolved" ? "success" : "gold"}>{request.status}</Badge></header>
                <h3>{request.subject}</h3>
                <p>{request.message}</p>
                <footer><small>{request.order_number || "Aucune commande associée"}</small><time>{new Date(request.created_at).toLocaleDateString("fr-HT")}</time></footer>
                <button className="support-thread-button" onClick={() => openSupportRequest(request)}>
                  <MessageCircle /> Voir la discussion
                </button>
              </article>
            ))}
            {!requests.length && <div className="catalog-empty">Vous n’avez encore aucune demande de support.</div>}
          </div>
          {activeSupportRequest && (
            <section className="support-client-thread">
              <header>
                <div>
                  <small>{activeSupportRequest.reference}</small>
                  <h3>{activeSupportRequest.subject}</h3>
                </div>
                <button onClick={() => setActiveSupportRequest(null)} aria-label="Fermer"><X /></button>
              </header>
              <div>
                {supportMessages.map((item) => (
                  <article className={item.sender_role === "admin" ? "support" : "client"} key={item.id}>
                    <small>{item.sender_role === "admin" ? "Support VinnHT" : "Vous"}</small>
                    <p>{item.body}</p>
                    <time>{new Date(item.created_at).toLocaleString("fr-HT")}</time>
                  </article>
                ))}
              </div>
              <form onSubmit={replyToSupport}>
                <textarea
                  required
                  rows="3"
                  value={supportDraft}
                  onChange={(event) => setSupportDraft(event.target.value)}
                  placeholder="Ajouter une réponse..."
                />
                <button disabled={supportSending}>
                  <Send /> {supportSending ? "Envoi..." : "Envoyer"}
                </button>
              </form>
            </section>
          )}
        </section>
      )}
      <section className="section faq-section">
        <SectionHead eyebrow="FAQ" title="Questions fréquentes" />
        <div className="faq-tools">
          <label className="faq-search"><Search /><input value={faqQuery} onChange={(event) => setFaqQuery(event.target.value)} placeholder="Rechercher dans la FAQ" /></label>
          <select value={faqCategory} onChange={(event) => setFaqCategory(event.target.value)}>
            <option value="all">Toutes les catégories</option>
            {supportCategories.slice(0, 5).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </div>
        {visibleFaq.map(([question, answer], i) => (
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
        <div><MapPin /><h2>VinnHT opère depuis Haïti</h2><p>{config.supportAddress || "Port-au-Prince, Haïti"} · {config.supportHours || "Lundi au samedi"}</p><a href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(config.supportAddress || "Port-au-Prince, Haiti")}`} target="_blank">Voir sur OpenStreetMap <ArrowRight /></a></div>
        <iframe title="Localisation VinnHT à Port-au-Prince" src="https://www.openstreetmap.org/export/embed.html?bbox=-72.38%2C18.50%2C-72.25%2C18.62&layer=mapnik" loading="lazy" />
      </section>
    </PublicLayout>
  );
}

function About() {
  const ecosystem = [
    {
      icon: ShoppingBag,
      title: "Pour les clients",
      text: "Découvrir des produits disponibles en Haïti, comparer les boutiques et suivre chaque commande depuis un seul espace.",
    },
    {
      icon: Store,
      title: "Pour les vendeurs",
      text: "Créer une boutique professionnelle, présenter ses produits et développer son activité auprès d’un public national.",
    },
    {
      icon: Truck,
      title: "Pour les livreurs",
      text: "Recevoir des missions claires, suivre le parcours de livraison et confirmer la remise au client avec confiance.",
    },
  ];
  const commitments = [
    [ShieldCheck, "Confiance", "Des profils, boutiques, paiements et livraisons suivis avec des étapes compréhensibles."],
    [MapPin, "Proximité", "Une marketplace pensée pour les départements, les villes et les réalités commerciales d’Haïti."],
    [Users, "Opportunités", "Un espace où clients, commerçants et professionnels peuvent évoluer ensemble."],
    [Sparkles, "Qualité", "Une expérience rapide, moderne et soignée sur téléphone, tablette et ordinateur."],
  ];
  const journey = [
    ["01", "Découvrir", "Explorer les rayons et trouver des produits selon ses besoins et son département."],
    ["02", "Échanger", "Contacter directement une boutique dans VinnHT ou par WhatsApp avant l’achat."],
    ["03", "Commander", "Payer le vendeur, transmettre la preuve et suivre la préparation de la commande."],
    ["04", "Recevoir", "Identifier le livreur, suivre la livraison puis confirmer la réception en toute clarté."],
  ];

  return (
    <PublicLayout>
      <section className="about-hero">
        <motion.div
          className="about-hero-copy"
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="about-eyebrow">À propos de VinnHT</span>
          <h1>Le marché numérique conçu pour faire avancer Haïti.</h1>
          <p>
            VinnHT rapproche les clients, les vendeurs et les livreurs dans une
            marketplace locale, simple et professionnelle.
          </p>
          <div className="about-hero-actions">
            <Button to="/categories">
              Explorer les rayons <ArrowRight />
            </Button>
            <Button to="/register" variant="secondary">
              Rejoindre VinnHT
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="about-brand-visual"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.75 }}
        >
          <div className="about-brand-orbit orbit-one" />
          <div className="about-brand-orbit orbit-two" />
          <div className="about-logo-core">
            <img src="/vinnht-logo.png" alt="Logo officiel VinnHT" />
          </div>
          <motion.article
            className="about-floating-card about-card-client"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <ShoppingBag />
            <span><b>Acheter</b><small>Simplement</small></span>
          </motion.article>
          <motion.article
            className="about-floating-card about-card-seller"
            animate={{ y: [0, 9, 0] }}
            transition={{ duration: 4.6, repeat: Infinity }}
          >
            <Store />
            <span><b>Vendre</b><small>Partout en Haïti</small></span>
          </motion.article>
          <motion.article
            className="about-floating-card about-card-delivery"
            animate={{ x: [0, 7, 0] }}
            transition={{ duration: 4.2, repeat: Infinity }}
          >
            <Truck />
            <span><b>Livrer</b><small>Avec confiance</small></span>
          </motion.article>
        </motion.div>
      </section>

      <AnimatedSection className="about-mission section">
        <div className="about-mission-heading">
          <span>Notre mission</span>
          <h2>Rendre le commerce local plus visible, plus accessible et mieux organisé.</h2>
        </div>
        <div className="about-mission-copy">
          <p>
            Beaucoup de produits, de services et de talents existent déjà en
            Haïti. VinnHT leur offre un espace numérique commun pour être
            découverts, présentés et commandés plus facilement.
          </p>
          <p>
            Notre ambition est de construire une référence locale où la
            technologie soutient réellement le commerce, sans effacer la
            relation humaine entre le client et la boutique.
          </p>
        </div>
      </AnimatedSection>

      <section className="about-ecosystem section">
        <SectionHead
          eyebrow="Un écosystème complet"
          title="Une plateforme, trois expériences connectées"
        />
        <div className="about-ecosystem-grid">
          {ecosystem.map(({ icon: Icon, title, text }, index) => (
            <AnimatedSection delay={index * 0.08} key={title}>
              <motion.article whileHover={{ y: -7 }}>
                <span><Icon /></span>
                <small>VinnHT {index + 1}</small>
                <h3>{title}</h3>
                <p>{text}</p>
              </motion.article>
            </AnimatedSection>
          ))}
        </div>
      </section>

      <AnimatedSection className="about-story section">
        <div className="about-story-panel">
          <span>Notre vision</span>
          <h2>Une marketplace haïtienne qui grandit avec ses utilisateurs.</h2>
          <p>
            VinnHT est construit progressivement autour des besoins réels:
            vendre, acheter, communiquer, payer, livrer et suivre son activité.
            Chaque fonction vise une expérience plus claire et plus rassurante.
          </p>
          <Link to="/contact">
            Parler avec l’équipe VinnHT <ArrowRight />
          </Link>
        </div>
        <div className="about-vision-board">
          <div
            className="about-haiti-network"
            role="img"
            aria-label="VinnHT connecte les clients, les boutiques et les livraisons à travers Haïti"
          >
            <img
              className="haiti-map-image"
              src="/haiti-map-vinnht.png"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
            />

            <svg
              className="haiti-network-map"
              viewBox="0 0 520 320"
              aria-hidden="true"
            >
              <g className="haiti-routes">
                <path d="M258 166 C205 125 154 116 111 146" />
                <path d="M258 166 C310 118 360 113 404 139" />
                <path d="M258 166 C207 202 168 225 127 224" />
                <path d="M258 166 C310 196 348 221 397 211" />
              </g>
              <g className="haiti-map-points">
                <circle cx="111" cy="146" r="6" />
                <circle cx="404" cy="139" r="6" />
                <circle cx="127" cy="224" r="6" />
                <circle cx="397" cy="211" r="6" />
                <circle className="center-point" cx="258" cy="166" r="9" />
              </g>
            </svg>

            <div className="haiti-network-caption" aria-hidden="true">
              <span />
              Haïti connectée
            </div>

            <div className="haiti-network-core">
              <span />
              <img src="/vinnht-logo.png" alt="VinnHT" />
            </div>

            <span className="haiti-network-node node-shop" title="Boutiques">
              <Store />
            </span>
            <span className="haiti-network-node node-client" title="Clients">
              <Users />
            </span>
            <span className="haiti-network-node node-product" title="Produits">
              <Package />
            </span>
            <span className="haiti-network-node node-delivery" title="Livraisons">
              <Truck />
            </span>

            <i className="haiti-flow flow-one" />
            <i className="haiti-flow flow-two" />
            <i className="haiti-flow flow-three" />
            <i className="haiti-flow flow-four" />
          </div>
        </div>
      </AnimatedSection>

      <section className="about-commitments section">
        <SectionHead eyebrow="Nos engagements" title="Ce qui guide VinnHT" />
        <div className="about-commitment-grid">
          {commitments.map(([Icon, title, text], index) => (
            <AnimatedSection delay={index * 0.06} key={title}>
              <article>
                <span><Icon /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            </AnimatedSection>
          ))}
        </div>
      </section>

      <AnimatedSection className="about-journey section">
        <SectionHead eyebrow="L’expérience VinnHT" title="De la découverte à la réception" />
        <div className="about-journey-grid">
          {journey.map(([number, title, text]) => (
            <article key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection className="about-final-cta section">
        <div>
          <span>Bienvenue dans le marché numérique d’Haïti</span>
          <h2>Découvrez ce que VinnHT peut vous offrir aujourd’hui.</h2>
        </div>
        <div>
          <Button to="/products">
            Voir le catalogue <ArrowRight />
          </Button>
          <Button to="/contact" variant="secondary">
            Contacter VinnHT
          </Button>
        </div>
      </AnimatedSection>
    </PublicLayout>
  );
}

function Terms() {
  const fallbackSections = [
    [
      "1. Objet et acceptation",
      "VinnHT est une marketplace qui met en relation des clients, des vendeurs et des livreurs en Haïti. En créant un compte, vous confirmez avoir lu et accepté la version des présentes conditions affichée au moment de l’inscription.",
    ],
    [
      "2. Compte et sécurité",
      "Vous devez fournir des informations exactes, protéger votre mot de passe et signaler rapidement toute utilisation non autorisée. VinnHT peut demander une vérification supplémentaire pour protéger la communauté.",
    ],
    [
      "3. Produits et boutiques",
      "Les vendeurs restent responsables de la légalité, de l’authenticité, de la qualité, du prix, du stock et de la description de leurs produits. Les contenus trompeurs, dangereux, contrefaits ou interdits peuvent être retirés sans préavis.",
    ],
    [
      "4. Commandes et prix",
      "Le client doit vérifier le produit, la quantité, le département, les frais et le montant total avant de commander. Une commande peut être annulée lorsqu’un article est indisponible, frauduleux ou impossible à livrer.",
    ],
    [
      "5. Paiement protégé VinnHT",
      "Cette protection s’applique uniquement aux commandes qui affichent clairement la mention Paiement protégé VinnHT. Pour ces commandes, le paiement est reçu par le canal professionnel indiqué par VinnHT et le vendeur ne peut pas disposer des fonds avant la confirmation de réception prévue par le parcours de livraison.",
    ],
    [
      "6. Paiement central VinnHT",
      "Le client paie uniquement le compte MonCash VinnHT affiché au checkout. Le vendeur ne reçoit pas les fonds avant la confirmation de réception et ne peut pas valider lui-même la preuve.",
    ],
    [
      "7. Livraison et double confirmation",
      "À la remise du colis, le destinataire signe devant le livreur. Cette signature ne finalise pas seule la vente. Le client doit ensuite se connecter à son compte VinnHT et confirmer qu’il a signé et reçu la livraison.",
    ],
    [
      "8. Réclamations et remboursements",
      "Le client doit signaler rapidement un colis manquant, endommagé, non conforme ou une livraison contestée. VinnHT peut bloquer la finalisation, demander des preuves et appliquer les règles de remboursement communiquées pour la commande.",
    ],
    [
      "9. Comportements interdits",
      "La fraude, l’usurpation d’identité, les fausses preuves, la manipulation des avis, le harcèlement et les tentatives de contourner les protections de VinnHT sont interdits.",
    ],
    [
      "10. Données personnelles",
      "VinnHT utilise les informations nécessaires à la création du compte, aux commandes, aux messages, aux paiements, à la livraison, à la prévention de la fraude et au support. Les données ne doivent pas être réutilisées par les vendeurs ou livreurs à d’autres fins.",
    ],
    [
      "11. Suspension",
      "VinnHT peut limiter, suspendre ou fermer un compte en cas de fraude présumée, danger pour les utilisateurs, violation des conditions ou obligation légale. L’utilisateur peut contacter le support pour demander un examen de la décision.",
    ],
    [
      "12. Évolution des conditions",
      "Une nouvelle acceptation pourra être demandée lorsqu’une modification importante affecte les paiements, les responsabilités ou les données personnelles. La version applicable est enregistrée avec la date d’acceptation.",
    ],
  ].map(([title, text], index) => ({
    id: `section-${index + 1}`,
    title,
    paragraphs: [text],
  }));
  const [termsDocument, setTermsDocument] = useState(null);
  const [termsLoading, setTermsLoading] = useState(true);

  useEffect(() => {
    api
      .get("/legal/terms")
      .then(({ data }) => setTermsDocument(data))
      .catch(() => setTermsDocument(null))
      .finally(() => setTermsLoading(false));
  }, []);

  const sections = termsDocument?.sections || fallbackSections;
  const effectiveDate = termsDocument?.effectiveDate
    ? new Date(`${termsDocument.effectiveDate}T00:00:00`).toLocaleDateString("fr-HT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "28 juin 2026";

  return (
    <PublicLayout>
      <section className="legal-hero">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span><ShieldCheck /> Confiance et sécurité</span>
          <h1>Conditions d’utilisation de VinnHT</h1>
          <p>
            Un cadre clair pour acheter, vendre, payer, livrer et résoudre les difficultés
            sur une marketplace conçue pour les réalités d’Haïti.
          </p>
          <small>
            Version {termsDocument?.version || USER_TERMS_VERSION} · Applicable à partir du {effectiveDate}
          </small>
        </motion.div>
      </section>
      <section className="legal-introduction section">
        <div>
          <span>Document contractuel VinnHT</span>
          <h2>Bienvenue. Commençons par les règles essentielles.</h2>
          <p>
            {termsDocument?.introduction ||
              "Ces conditions encadrent l’accès à VinnHT et l’utilisation de ses services en Haïti."}
          </p>
        </div>
        <div className="legal-principles">
          <article><ShieldCheck /><span><b>Paiement clair</b><small>Protection indiquée avant de payer</small></span></article>
          <article><FileSignature /><span><b>Double confirmation</b><small>Signature puis validation du client</small></span></article>
          <article><Scale /><span><b>Règles haïtiennes</b><small>Différends traités en Haïti</small></span></article>
        </div>
      </section>
      <section className="legal-layout section">
        <aside>
          <ShieldCheck />
          <h2>Sommaire</h2>
          <p>Choisissez une section pour accéder directement à la règle concernée.</p>
          <nav>
            {sections.map((section) => (
              <a href={`#${section.id}`} key={section.id}>{section.title}</a>
            ))}
          </nav>
          <Link to="/contact">Contacter le support <ArrowRight /></Link>
        </aside>
        <div className="legal-sections">
          {termsLoading && <div className="legal-loading">Chargement de la version officielle...</div>}
          {sections.map((section) => (
            <article id={section.id} key={section.id}>
              <h2>{section.title}</h2>
              {(section.paragraphs || []).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets?.length > 0 && (
                <ul>
                  {section.bullets.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </article>
          ))}
          <div className="legal-regulatory-note">
            <ShieldCheck />
            <div>
              <h3>Cadre local pris en compte</h3>
              <p>
                Les paiements électroniques doivent être exécutés avec un fournisseur autorisé
                et dans le respect des exigences applicables de la Banque de la République
                d’Haïti. La protection de la qualité et du consommateur relève notamment des
                attributions du Ministère du Commerce et de l’Industrie.
              </p>
            </div>
          </div>
          <div className="legal-notice">
            Version de préparation : l’identité légale complète de l’exploitant, son CIF, sa
            patente, son adresse officielle et le contrat marchand MonCash doivent être ajoutés,
            puis le document doit être validé par un juriste haïtien avant l’ouverture commerciale.
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function Categories() {
  const [categoryData, setCategoryData] = useState([]);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/categories"),
      api.get("/products", { params: { limit: 100 } }),
    ]).then(([categoryResponse, productResponse]) => {
      setCategoryData(categoryResponse.data);
      setProducts(productResponse.data);
    });
  }, []);

  const visible = categoryData.filter((category) =>
    `${category.name} ${category.slug}`.toLowerCase().includes(query.toLowerCase()),
  );
  const popular = categoryData
    .filter((category) => Number(category.available_product_count) > 0)
    .slice(0, 6);
  const totalProducts = categoryData.reduce(
    (sum, category) => sum + Number(category.available_product_count || 0),
    0,
  );
  const activeRayons = categoryData.filter((category) => Number(category.available_product_count) > 0).length;

  return (
    <MarketplaceLayout>
      <section className="departments-hero departments-hero-premium">
        <div className="departments-hero-copy">
          <Badge tone="gold">Grand marché VinnHT</Badge>
          <h1>Choisissez votre rayon et trouvez plus vite.</h1>
        </div>
        <div className="departments-hero-search-card">
          <span><Search /></span>
          <h2>Que cherchez-vous ?</h2>
          <label>
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex: Mode, Electronique, Beauté..."
            />
          </label>
        </div>
      </section>

      {!!popular.length && (
        <section className="section category-popular category-popular-premium">
          <SectionHead eyebrow="Les plus actifs" title="Rayons qui bougent maintenant" />
          <div>
            {popular.map((category, index) => {
              const [Icon] = categoryVisuals[category.slug] || [ShoppingBag];
              return (
                <Link to={`/categories/${category.slug}`} key={category.id}>
                  <span className="popular-rank">#{index + 1}</span>
                  <span className="popular-icon"><Icon /></span>
                  <span>
                    <b>{category.name}</b>
                  </span>
                  <ArrowRight />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="section departments-section">
        <SectionHead eyebrow="Tous les univers" title={`${visible.length} rayon(s) à explorer`} />
        <div className="departments-premium-grid departments-premium-grid-v2">
          {visible.map((category) => {
            const [Icon, children] = categoryVisuals[category.slug] || [ShoppingBag, ["Produits", "Nouveautés", "Offres", "Collections"]];
            const preview = products.filter((product) => Number(product.category_id) === Number(category.id)).slice(0, 3);
            return (
              <motion.article whileHover={{ y: -6 }} key={category.id}>
                <header>
                  <span><Icon /></span>
                  <div>
                    <small>{category.available_product_count || 0} disponible(s)</small>
                    <h2>{category.name}</h2>
                  </div>
                </header>
                <div className="department-tags">{children.map((child) => <span key={child}>{child}</span>)}</div>
                <div className="department-preview">
                  {preview.map((product) => <img src={assetUrl(product.image_url)} alt={product.name} key={product.id} />)}
                  {!preview.length && <div><ShoppingBag /><small>Ce rayon attend ses premiers produits</small></div>}
                </div>
                <Link to={`/categories/${category.slug}`}>Explorer ce rayon <ArrowRight /></Link>
              </motion.article>
            );
          })}
        </div>
        {!visible.length && <div className="catalog-empty"><Search /><h3>Aucun rayon trouvé</h3><p>Essayez un autre mot-clé.</p></div>}
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
  const [department, setDepartment] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showAllUniverses, setShowAllUniverses] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get("/products", {
        params: {
          category: category || undefined,
          search: query || undefined,
          department: department || undefined,
          city: city || undefined,
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
  }, [category, query, department, city, offersOnly, page]);

  useEffect(() => {
    setQuery(new URLSearchParams(location.search).get("search") || "");
    setPage(1);
  }, [location.search]);

  useEffect(() => {
    setPage(1);
  }, [category, query, department, city]);

  const availableCities = [...new Set(products.map((product) => product.city).filter(Boolean))];
  const featuredUniverses = marketplaceDepartments.slice(0, 6);
  const selectUniverse = (slug) => {
    setCategory(category === slug ? "" : slug);
    setShowAllUniverses(false);
  };

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
        <SectionHead eyebrow="Explorer par univers" title="Que recherchez-vous aujourd'hui" />
        <div className="department-mobile-strip" aria-label="Rayons populaires">
          {featuredUniverses.map(([name, slug, Icon]) => (
            <button
              className={category === slug ? "active" : ""}
              onClick={() => selectUniverse(slug)}
              key={name}
            >
              <Icon />
              <span>{name}</span>
            </button>
          ))}
          <button className="show-all-universes" onClick={() => setShowAllUniverses(true)}>
            <ShoppingBag />
            <span>Voir tous</span>
          </button>
        </div>
        <div className="department-grid catalog-department-grid">
          {marketplaceDepartments.map(([name, slug, Icon, children]) => (
            <button
              className={category === slug ? "active" : ""}
              onClick={() => selectUniverse(slug)}
              key={name}
            >
              <span>
                <Icon />
              </span>
              <div>
                <h3>{name}</h3>
                <p>{children.join(" - ")}</p>
              </div>
              <ChevronRight />
            </button>
          ))}
        </div>
        {showAllUniverses && (
          <div className="mobile-universe-layer" role="dialog" aria-modal="true" aria-label="Tous les rayons">
            <button className="mobile-universe-backdrop" onClick={() => setShowAllUniverses(false)} />
            <motion.div
              className="mobile-universe-sheet"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <header>
                <div>
                  <span>Rayons VinnHT</span>
                  <h2>Tous les univers</h2>
                </div>
                <button onClick={() => setShowAllUniverses(false)} aria-label="Fermer les rayons">
                  <X />
                </button>
              </header>
              <div>
                {marketplaceDepartments.map(([name, slug, Icon, children]) => (
                  <button
                    className={category === slug ? "active" : ""}
                    onClick={() => selectUniverse(slug)}
                    key={name}
                  >
                    <span><Icon /></span>
                    <div>
                      <strong>{name}</strong>
                      <small>{children.slice(0, 3).join(" - ")}</small>
                    </div>
                    <ChevronRight />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
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
            <select
              value={department}
              onChange={(event) => {
                setDepartment(event.target.value);
                setCity("");
              }}
              aria-label="Filtrer les produits par département"
            >
              <option value="">Tous les départements</option>
              {haitiDepartments.map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
          </header>
          {loading ? (
            <div className="catalog-empty">Chargement du marché...</div>
          ) : products.length ? (
            <div className="product-grid">
              {products.map((product) => (
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
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [maxPrice, setMaxPrice] = useState("");
  const [department, setDepartment] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    api
      .get("/products", { params: { category: slug, department: department || undefined, city: city || undefined } })
      .then(({ data }) => setProducts(data))
      .catch(() => setProducts([]));
  }, [slug, department, city]);

  const currentCategory = categories.find(([, categorySlug]) => categorySlug === slug);
  const currentName = currentCategory?.[0] || slug.replaceAll("-", " ");
  const [HeroIcon, children = ["Produits", "Nouveautés", "Offres", "Collections"]] =
    categoryVisuals[slug] || [ShoppingBag, ["Produits", "Nouveautés", "Offres", "Collections"]];
  const availableCities = [...new Set(products.map((product) => product.city).filter(Boolean))];
  const visibleProducts = products
    .filter((product) => product.name.toLowerCase().includes(query.toLowerCase()))
    .filter((product) => !maxPrice || Number(product.price) <= Number(maxPrice))
    .sort((a, b) => {
      if (sort === "price-low") return Number(a.price) - Number(b.price);
      if (sort === "price-high") return Number(b.price) - Number(a.price);
      return Number(b.id) - Number(a.id);
    });

  return (
    <MarketplaceLayout>
      <section className="category-products-hero">
        <div className="category-products-icon"><HeroIcon /></div>
        <div>
          <Badge tone="gold">Rayon VinnHT</Badge>
          <h1>{currentName}</h1>
        </div>
      </section>

      <section className="section category-products-premium-section">
        <div className="category-product-filters category-product-filters-premium">
          <label className="wide-filter"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dans ce rayon" /></label>
          <label>Prix maximum<input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Tous les prix" /></label>
          <label>Département<select value={department} onChange={(event) => { setDepartment(event.target.value); setCity(""); }}><option value="">Tous les départements</option>{haitiDepartments.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
          <label>Ville<select value={city} onChange={(event) => setCity(event.target.value)}><option value="">Toutes les villes</option>{availableCities.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
          <label>Trier<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Plus récents</option><option value="price-low">Prix croissant</option><option value="price-high">Prix décroissant</option></select></label>
        </div>

        <div className="category-results-head">
          <div>
            <span>{visibleProducts.length} résultat(s)</span>
            <h2>Produits disponibles dans {currentName}</h2>
          </div>
          <Link to="/categories"><ChevronRight /> Retour aux rayons</Link>
        </div>

        {visibleProducts.length ? (
          <div className="product-grid category-product-grid-premium">
            {visibleProducts.map((p) => (
              <ProductCard product={p} key={p.id} />
            ))}
          </div>
        ) : (
          <div className="catalog-empty category-empty-premium">
            <ShoppingBag />
            <h3>Aucun produit dans ce rayon</h3>
            <p>Les produits apparaîtront après la validation des premiers vendeurs.</p>
            <Link to="/products">Voir tout le catalogue <ArrowRight /></Link>
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
  const [cartMessage, setCartMessage] = useState("");
  const [selectedPackSize, setSelectedPackSize] = useState(1);
  const { add } = useCart();
  const { isFavorite, toggle } = useFavorites();

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then(async ({ data }) => {
        setProduct(data);
        setSelectedPackSize(1);
        const response = await api.get("/products", {
          params: { category: data.category_slug },
        });
        const candidates = response.data.filter((item) => item.id !== data.id);
        setSimilar(relevantSimilarProducts(data, candidates));
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

  const addProductToCart = async () => {
    setCartMessage("");
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      await add(product, selectedPackSize);
      setCartMessage(
        selectedPackSize === 1
          ? "Produit ajouté au panier."
          : `Lot de ${selectedPackSize} ajouté au panier.`,
      );
    } catch (error) {
      if (error.message === "CLIENT_REQUIRED") {
        navigate("/login");
        return;
      }
      setCartMessage(
        error.response?.data?.message ||
          (error.message === "OUT_OF_STOCK"
            ? "Ce produit n'est plus disponible."
            : "Impossible d'ajouter ce produit au panier."),
      );
    }
  };

  const contactSeller = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const { data } = await api.post("/messages/conversations", {
        sellerId: product.seller_id,
      });
      const draft = `Bonjour, je souhaite avoir plus d'informations sur le produit "${product.name}".`;
      navigate(`/messages?conversation=${data.id}&draft=${encodeURIComponent(draft)}`);
    } catch (error) {
      window.alert(error.response?.data?.message || "Impossible d'ouvrir la discussion avec ce vendeur.");
    }
  };

  const sellerWhatsApp = whatsappNumber(product.seller_whatsapp);
  const whatsappMessage = encodeURIComponent(
    `Bonjour, je vous contacte depuis VinnHT au sujet du produit « ${product.name} ».`,
  );
  const productAttributes = productAttributeEntries(product);
  const activeOffer = productOfferIsActive(product);
  const packOptions = Array.isArray(product.pack_options)
    ? [...product.pack_options].sort(
        (first, second) =>
          Number(first.units_per_pack) - Number(second.units_per_pack),
      )
    : [];
  const selectedPack = packOptions.find(
    (option) => Number(option.units_per_pack) === selectedPackSize,
  );
  const selectedPrice =
    selectedPackSize === 1
      ? productPrice(product)
      : Number(selectedPack?.price || 0);
  const availableSelections = Math.floor(
    Number(product.stock || 0) / selectedPackSize,
  );
  const regularTotalForSelection =
    productPrice(product) * selectedPackSize;
  const selectionSavings = Math.max(
    0,
    regularTotalForSelection - selectedPrice,
  );

  return (
    <MarketplaceLayout>
      <div className="product-detail-topbar">
        <Link to="/products">
          <ArrowLeft size={17} />
          Retour au catalogue
        </Link>
        <span>
          <ShieldCheck size={16} />
          Achat protégé par VinnHT
        </span>
      </div>
      <section className="product-detail">
        <div className="gallery">
          <img src={assetUrl(product.image_url)} alt={product.name} />
        </div>
        <div className="product-info">
          <div className="product-detail-badges">
            {activeOffer && (
              <span className="vinnht-offer-detail-badge">
                <Sparkles size={15} />
                Offre spéciale VinnHT
              </span>
            )}
            <Badge tone="gold">
              <ShieldCheck size={14} />
              Vendeur vérifié
            </Badge>
            {packOptions.length > 0 && (
              <span className="product-detail-pack-badge">
                <Package size={14} />
                Unité et lots disponibles
              </span>
            )}
          </div>
          <h1>{product.name}</h1>
          <p className="lead">
            Une selection premium proposee par {product.shop_name || product.seller_name}{product.city ? `, disponible a ${product.city}` : ""}{product.department ? ` dans le departement ${product.department}` : ""}.
          </p>
          <div className="product-detail-price-row">
            <div>
              <small>
                {selectedPackSize === 1
                  ? "Prix à l’unité"
                  : `Prix du lot de ${selectedPackSize}`}
              </small>
              <h2>{selectedPrice.toLocaleString("fr-HT")} HTG</h2>
            </div>
            {selectedPackSize > 1 && selectionSavings > 0 && (
              <span>
                <Sparkles size={14} />
                Économisez {selectionSavings.toLocaleString("fr-HT")} HTG
              </span>
            )}
          </div>
          {packOptions.length > 0 && (
            <section className="product-pack-selector" aria-label="Format d’achat">
              <header>
                <div>
                  <small>Format d’achat</small>
                  <h3>Choisissez votre format</h3>
                  <p>Le prix et le stock s’actualisent selon votre choix.</p>
                </div>
                <span>
                  {selectedPackSize === 1
                    ? "1 unité"
                    : `${selectedPackSize} unités par lot`}
                </span>
              </header>
              <div>
                <button
                  className={selectedPackSize === 1 ? "active" : ""}
                  type="button"
                  aria-pressed={selectedPackSize === 1}
                  onClick={() => {
                    setSelectedPackSize(1);
                    setCartMessage("");
                  }}
                >
                  <span>À l’unité</span>
                  <strong>{productPrice(product).toLocaleString("fr-HT")} HTG</strong>
                </button>
                {packOptions.map((option) => {
                  const packSize = Number(option.units_per_pack);
                  return (
                    <button
                      className={selectedPackSize === packSize ? "active" : ""}
                      type="button"
                      aria-pressed={selectedPackSize === packSize}
                      disabled={Number(product.stock || 0) < packSize}
                      onClick={() => {
                        setSelectedPackSize(packSize);
                        setCartMessage("");
                      }}
                      key={option.id || packSize}
                    >
                      <span>Lot de {packSize}</span>
                      <strong>{Number(option.price).toLocaleString("fr-HT")} HTG</strong>
                      <small>
                        {Number(product.stock || 0) < packSize
                          ? "Stock insuffisant"
                          : `${Math.round(Number(option.price) / packSize).toLocaleString("fr-HT")} HTG/unité`}
                      </small>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
          <div className="product-detail-meta">
            <span>
              <ShoppingBag /> {product.category_name || "Produit"}
            </span>
            <span>
              <Package /> {selectedPackSize === 1
                ? `${product.stock ?? 0} unité(s) disponible(s)`
                : `${availableSelections} lot(s) disponible(s)`}
            </span>
            <span>
              <MapPin /> {product.department ? `${product.department} - ` : ""}{product.city || "Haiti"}
            </span>
          </div>
          <div className="product-description">
            <span>Description</span>
            <p>
              {product.description ||
                "Contactez le vendeur pour obtenir plus d'informations sur ce produit."}
            </p>
          </div>
          {productAttributes.length > 0 && (
            <div className="product-characteristics">
              <header>
                <span>Caractéristiques</span>
                <h3>Détails du produit</h3>
              </header>
              <div>
                {productAttributes.map((attribute) => (
                  <article key={attribute.key}>
                    <small>{attribute.label}</small>
                    <strong>{attribute.value}</strong>
                  </article>
                ))}
              </div>
            </div>
          )}
          {cartMessage && <div className="product-cart-feedback">{cartMessage}</div>}
          <div className="detail-actions">
            <Button onClick={addProductToCart}>
              <ShoppingCart size={18} />
              {selectedPackSize === 1
                ? "Ajouter au panier"
                : `Ajouter le lot de ${selectedPackSize}`}
            </Button>
            <Button variant="glass" onClick={() => toggle(product)}>
              <Heart fill={isFavorite(product.id) ? "currentColor" : "none"} />
              {isFavorite(product.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
            </Button>
          </div>
          <article className="product-seller-card">
            <div className="product-seller-avatar">
              {product.shop_logo_url ? (
                <img src={assetUrl(product.shop_logo_url)} alt={product.shop_name || product.seller_name} />
              ) : product.seller_profile_image_url ? (
                <img src={assetUrl(product.seller_profile_image_url)} alt={product.seller_name} />
              ) : (
                <CircleUserRound />
              )}
            </div>
            <div>
              <span>Vendu par</span>
              <h3>{product.shop_name || product.seller_name}</h3>
              <p>
                <ShieldCheck /> Vendeur verifie - {product.seller_name}
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
            <p>Seuls les produits qui correspondent vraiment à celui-ci apparaîtront ici.</p>
          </div>
        )}
      </section>
    </MarketplaceLayout>
  );
}

function ShopDetails() {
  const { user } = useAuth();
  const { sellerId: shopParam } = useParams();
  const navigate = useNavigate();
  const sellerId = shopSellerIdFromParam(shopParam);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareFeedback, setShareFeedback] = useState("");
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followBusy, setFollowBusy] = useState(false);
  const [followFeedback, setFollowFeedback] = useState("");
  const canFollow = Boolean(
    user &&
    Number(user.id) !== Number(sellerId) &&
    (user.role === "client" || user.roles?.includes("client")),
  );

  useEffect(() => {
    if (!sellerId) {
      setError("Cette adresse de boutique est invalide.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    Promise.all([
      api.get(`/shops/${sellerId}`),
      api.get("/products", { params: { seller: sellerId } }),
      api.get(`/shops/${sellerId}/reviews`),
    ]).then(([shopResponse, productsResponse, reviewsResponse]) => {
      const loadedShop = shopResponse.data;

      setShop(loadedShop);
      setFollowerCount(Number(loadedShop.follower_count || 0));
      setProducts(productsResponse.data);
      setReviews(reviewsResponse.data);
      const canonicalPath = shopPublicPath(loadedShop);

      if (window.location.pathname !== canonicalPath) {
        navigate(canonicalPath, { replace: true });
      }
    }).catch((requestError) => {
      setError(
        requestError.response?.data?.message ||
          "Impossible de charger cette boutique pour le moment.",
      );
      setShop(null);
      setProducts([]);
      setReviews([]);
    }).finally(() => {
      setLoading(false);
    });
  }, [navigate, sellerId]);

  useEffect(() => {
    if (!canFollow) {
      setFollowing(false);
      return;
    }

    api
      .get(`/shops/${sellerId}/follow`)
      .then(({ data }) => {
        setFollowing(Boolean(data.following));
        setFollowerCount(Number(data.followerCount || 0));
      })
      .catch(() => setFollowing(false));
  }, [canFollow, sellerId, user?.id]);

  const toggleFollow = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!canFollow || followBusy) return;

    setFollowBusy(true);
    setFollowFeedback("");
    try {
      const { data } = following
        ? await api.delete(`/shops/${sellerId}/follow`)
        : await api.post(`/shops/${sellerId}/follow`);
      setFollowing(Boolean(data.following));
      setFollowerCount(Number(data.followerCount || 0));
    } catch (requestError) {
      setFollowFeedback(
        requestError.response?.data?.message || "Action indisponible",
      );
      window.setTimeout(() => setFollowFeedback(""), 2400);
    } finally {
      setFollowBusy(false);
    }
  };

  const shareShop = async () => {
    if (!shop) return;

    const url = `${window.location.origin}${shopPublicPath(shop)}`;
    const shareData = {
      title: shop.shop_name || "Boutique VinnHT",
      text: `Découvrez ${shop.shop_name || "cette boutique"} sur VinnHT.`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareFeedback("Boutique partagée");
      } else {
        await navigator.clipboard.writeText(url);
        setShareFeedback("Lien copié");
      }
    } catch (shareError) {
      if (shareError.name !== "AbortError") {
        setShareFeedback("Partage indisponible");
      }
    }

    window.setTimeout(() => setShareFeedback(""), 2200);
  };

  if (loading) {
    return (
      <MarketplaceLayout>
        <section className="shop-public-state" aria-live="polite">
          <span className="shop-public-loader" />
          <h1>Chargement de la boutique</h1>
          <p>Nous préparons son catalogue VinnHT.</p>
        </section>
      </MarketplaceLayout>
    );
  }

  if (error || !shop) {
    return (
      <MarketplaceLayout>
        <section className="shop-public-state shop-public-state-error">
          <Store />
          <h1>Boutique indisponible</h1>
          <p>{error || "Cette boutique n’existe pas ou n’est plus active."}</p>
          <Link className="primary-button" to="/products">
            Explorer le catalogue
          </Link>
        </section>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout>
      <section className="shop-public-hero">
        <div className="shop-public-logo">
          {shop.shop_logo_url ? (
            <img
              src={assetUrl(shop.shop_logo_url)}
              alt={shop.shop_name}
            />
          ) : (
            <Store />
          )}
        </div>
        <div className="shop-public-content">
          <Badge tone="gold">Boutique vérifiée</Badge>
          <div className="shop-public-heading">
            <h1>{shop.shop_name || "Boutique VinnHT"}</h1>
            <div className="shop-public-actions">
              {(!user || canFollow) && (
                <button
                  type="button"
                  className={`shop-follow-button ${following ? "following" : ""}`}
                  onClick={toggleFollow}
                  disabled={followBusy}
                  aria-pressed={following}
                >
                  {following ? <CheckCircle2 /> : <Bell />}
                  <span>
                    {followBusy
                      ? "Patientez..."
                      : followFeedback || (following ? "Boutique suivie" : "Suivre")}
                  </span>
                </button>
              )}
              <button type="button" onClick={shareShop}>
                <Share2 />
                <span>{shareFeedback || "Partager"}</span>
              </button>
            </div>
          </div>
          <p>
            {shop.description || "Découvrez tous les produits disponibles dans cette boutique."}
          </p>
          <div className="shop-public-metrics">
            <span>{products.length} produit(s) en ligne</span>
            <span>
              <Bell />
              {followerCount} abonné{followerCount > 1 ? "s" : ""}
            </span>
            <span>
              <Star />
              {Number(shop.review_count) > 0
                 ? `${Number(shop.rating).toFixed(1)} sur 5 · ${shop.review_count} avis vérifié(s)`
                : "Nouvelle boutique · Aucun avis"}
            </span>
          </div>
        </div>
      </section>
      <section className="section">
        <SectionHead
          eyebrow="Catalogue boutique"
          title={`Les produits de ${shop.shop_name || "cette boutique"}`}
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
    activityStatus: "",
    activityOrganization: "",
    activityDetails: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const passwordChecks = {
    length: form.password.length >= 10,
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
            activityStatus: form.activityStatus,
            activityOrganization: form.activityOrganization || null,
            activityDetails: form.activityDetails || null,
            password: form.password,
            termsAccepted: form.acceptedTerms,
            termsVersion: USER_TERMS_VERSION,
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

                <label className="education-select-field">
                  <BriefcaseBusiness />
                  <span>
                    <small>Votre situation actuelle</small>
                    <select
                      required
                      value={form.activityStatus}
                      onChange={(e) => {
                        const activityStatus = e.target.value;
                        setForm({
                          ...form,
                          activityStatus,
                          activityOrganization: "",
                          activityDetails: "",
                        });
                      }}
                    >
                      <option value="">Sélectionnez votre statut</option>
                      <option value="school">Écolier / Écolière</option>
                      <option value="university">Étudiant / Étudiante</option>
                      <option value="employee">Employé / Employée</option>
                      <option value="entrepreneur">Entrepreneur / Commerçant</option>
                      <option value="self_employed">Travailleur indépendant</option>
                      <option value="unemployed">Sans activité actuellement</option>
                      <option value="other">Autre situation</option>
                    </select>
                  </span>
                </label>

                {["school", "university", "employee", "entrepreneur"].includes(
                  form.activityStatus,
                ) && (
                  <motion.label
                    className="line-field education-institution-field"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Building2 />
                    <input
                      required
                      minLength="2"
                      maxLength="190"
                      value={form.activityOrganization}
                      onChange={(e) =>
                        setForm({ ...form, activityOrganization: e.target.value })
                      }
                      placeholder={
                        form.activityStatus === "university"
                          ? "Nom de votre université"
                          : form.activityStatus === "school"
                            ? "Nom de votre école"
                            : form.activityStatus === "employee"
                              ? "Nom de votre employeur"
                              : "Nom de votre entreprise ou commerce"
                      }
                    />
                  </motion.label>
                )}

                {["self_employed", "other"].includes(form.activityStatus) && (
                  <motion.label
                    className="line-field education-institution-field"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <BriefcaseBusiness />
                    <input
                      required
                      minLength="2"
                      maxLength="190"
                      value={form.activityDetails}
                      onChange={(e) => setForm({ ...form, activityDetails: e.target.value })}
                      placeholder={
                        form.activityStatus === "self_employed"
                          ? "Précisez votre activité professionnelle"
                          : "Précisez votre situation"
                      }
                    />
                  </motion.label>
                )}
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
                minLength={register ? 10 : 1}
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
                    minLength="10"
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
                    J’accepte les <Link to="/terms" target="_blank">conditions d’utilisation</Link>
                    {" "}et la politique de confidentialité.
                  </span>
                </label>
              </>
            )}
            {!register && (
              <Link className="forgot-link" to="/login">
                Mot de passe oublié 
              </Link>
            )}
            {error && <div className="alert">{error}</div>}
            <motion.button
              className="magenta-button"
              disabled={busy}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {busy ? "Veuillez patienter..." : register ? "Creer mon compte" : "Se connecter"}
            </motion.button>
            <p className="auth-switch">
              {register ? "Deja membre " : "Pas encore membre "}{" "}
              <Link to={register ? "/login" : "/register"}>
                {register ? "Se connecter" : "Creer un compte"}
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
  manager: [
    ["Vue d’ensemble", "/manager", LayoutDashboard],
    ["Demandes vendeurs", "/manager/seller-requests", Store],
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
    ["Paiements", "/admin/payments", CreditCard],
    ["Profil", "/admin/profile", CircleUserRound],
    ["Support", "/admin/contact-requests", MessageCircle],
    ["Paramètres", "/admin/settings", Settings],
  ],
};

const menuItemsFor = (role) => menus[role] || [];
const mobileMenuItemsFor = (role) => {
  const items = menuItemsFor(role).filter(([, path]) => !path.endsWith("/settings") && path !== "/settings");

  if (role === "seller" && !items.some(([, path]) => path === "/seller/profile")) {
    items.push(["Profil", "/seller/profile", CircleUserRound]);
  }

  return items;
};

const isMenuPathActive = (currentPath, itemPath) => {
  if (itemPath === "/manager/seller-requests") {
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
  const { user, activeRole, authLoading } = useAuth();
  if (authLoading) {
    return (
      <div className="auth-loading-screen">
        <img src="/vinnht-logo.png" alt="VinnHT" />
        <span>Chargement de votre espace...</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  const userRoles = user.roles || [user.role].filter(Boolean);
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
  const items = mobileMenuItemsFor(activeRole, user);

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
  const cartCount = cartUnitsCount(cart);
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
              <p className="seller-form-note">
                Votre boutique pourra publier dans tous les rayons VinnHT. Le rayon sera choisi
                séparément pour chaque produit.
              </p>
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
  const cartCount = cartUnitsCount(cart);

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
        .get("/products", { params: { offers: true, limit: 6 } })
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
  const [proofProcessing, setProofProcessing] = useState(false);
  const [proofError, setProofError] = useState("");
  const [proofSuccess, setProofSuccess] = useState("");
  const [receiptProcessing, setReceiptProcessing] = useState(false);
  const [receiptMessage, setReceiptMessage] = useState("");
  const [receiptError, setReceiptError] = useState("");

  useEffect(() => {
    api
      .get("/orders/mine")
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  const selectOrder = async (id) => {
    const { data } = await api.get(`/orders/${id}`);
    setSelectedOrder(data);
    setProofError("");
    setProofSuccess("");
  };

  const submitOrderPaymentProof = async (orderId, { file, note }) => {
    setProofProcessing(true);
    setProofError("");
    setProofSuccess("");
    try {
      const formData = new FormData();
      formData.append("paymentProof", file);
      if (note) formData.append("note", note);
      const { data } = await api.patch(`/payments/${orderId}/proof`, formData);
      await selectOrder(orderId);
      const { data: refreshedOrders } = await api.get("/orders/mine");
      setOrders(refreshedOrders);
      setProofSuccess(data.message || "Preuve envoyee aux vendeurs.");
    } catch (requestError) {
      setProofError(requestError.response?.data?.message || "Impossible d'envoyer la preuve de paiement.");
    } finally {
      setProofProcessing(false);
    }
  };

  const confirmOrderReceipt = async (orderId, assignmentId) => {
    setReceiptProcessing(true);
    setReceiptMessage("");
    setReceiptError("");
    try {
      const { data } = await api.patch(
        `/orders/${orderId}/deliveries/${assignmentId}/confirm-receipt`,
        { signatureAcknowledged: true },
      );
      await selectOrder(orderId);
      const { data: refreshedOrders } = await api.get("/orders/mine");
      setOrders(refreshedOrders);
      setReceiptMessage(data.message);
      return true;
    } catch (requestError) {
      setReceiptError(
        requestError.response?.data?.message || "Impossible de confirmer la réception.",
      );
      return false;
    } finally {
      setReceiptProcessing(false);
    }
  };

  const confirmPickupReceipt = async (orderId, saleId) => {
    setReceiptProcessing(true);
    setReceiptMessage("");
    setReceiptError("");
    try {
      const { data } = await api.patch(
        `/orders/${orderId}/pickups/${saleId}/confirm-receipt`,
        { receiptAcknowledged: true },
      );
      await selectOrder(orderId);
      const { data: refreshedOrders } = await api.get("/orders/mine");
      setOrders(refreshedOrders);
      setReceiptMessage(data.message);
      return true;
    } catch (requestError) {
      setReceiptError(
        requestError.response?.data?.message || "Impossible de confirmer le retrait.",
      );
      return false;
    } finally {
      setReceiptProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <ClientOrdersContent
        ordersData={orders}
        loading={loading}
        selectedOrder={selectedOrder}
        onSelect={selectOrder}
        onCloseDetails={() => setSelectedOrder(null)}
        onSubmitPaymentProof={submitOrderPaymentProof}
        proofProcessing={proofProcessing}
        proofError={proofError}
        proofSuccess={proofSuccess}
        onConfirmReceipt={confirmOrderReceipt}
        onConfirmPickup={confirmPickupReceipt}
        receiptProcessing={receiptProcessing}
        receiptMessage={receiptMessage}
        receiptError={receiptError}
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
  const {
    cart,
    remove,
    updateQuantity,
    priceNotice,
    dismissPriceNotice,
    refreshCart,
  } = useCart();

  useEffect(() => {
    refreshCart().catch(() => {});
  }, []);

  return (
    <DashboardLayout>
      <ClientCartContent
        cart={cart}
        remove={remove}
        updateQuantity={updateQuantity}
        priceNotice={priceNotice}
        onDismissPriceNotice={dismissPriceNotice}
      />
    </DashboardLayout>
  );
}

function ClientCheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    cart,
    clear,
    priceNotice,
    refreshCart,
    dismissPriceNotice,
  } = useCart();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [priceChanges, setPriceChanges] = useState([]);
  const [pendingCheckout, setPendingCheckout] = useState(null);
  const [paymentAccount, setPaymentAccount] = useState(null);

  useEffect(() => {
    refreshCart()
      .then(({ changes }) => {
        if (changes.length) setPriceChanges(changes);
      })
      .catch(() => {});
    api
      .get("/payments/config")
      .then(({ data }) => setPaymentAccount(data))
      .catch(() => setPaymentAccount(null));
  }, []);

  useEffect(() => {
    if (priceNotice?.changes?.length) {
      setPriceChanges(priceNotice.changes);
    }
  }, [priceNotice?.id]);

  useEffect(() => {
    if (!priceChanges.length) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [priceChanges.length]);

  const submitOrder = async (checkoutForm, orderCart) => {
    const fulfillmentChoices = Object.entries(
      checkoutForm.fulfillmentChoices || {},
    ).map(([sellerId, method]) => ({
      sellerId: Number(sellerId),
      method,
    }));
    const includesDelivery = fulfillmentChoices.some(
      (choice) => choice.method === "delivery",
    );
    const { data } = await api.post("/orders", {
      fulfillmentChoices,
      deliveryAddress: includesDelivery
        ? `${checkoutForm.address}, ${checkoutForm.city}`
        : null,
      items: orderCart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        packSize: Number(item.pack_size || 1),
      })),
    });
    setResult(data);
    setPendingCheckout(null);
    setPriceChanges([]);
    dismissPriceNotice();
  };

  const createOrder = async (checkoutForm) => {
    setProcessing(true);
    setError("");
    try {
      const refreshed = await refreshCart({ notify: false });
      if (refreshed.changes.length) {
        setPendingCheckout(checkoutForm);
        setPriceChanges(refreshed.changes);
        return;
      }

      await submitOrder(checkoutForm, refreshed.cart);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de créer la commande.");
    } finally {
      setProcessing(false);
    }
  };

  const confirmPriceChanges = async () => {
    if (!pendingCheckout) {
      setPriceChanges([]);
      dismissPriceNotice();
      return;
    }

    setProcessing(true);
    setError("");
    try {
      const refreshed = await refreshCart({ notify: false });
      if (refreshed.changes.length) {
        setPriceChanges(refreshed.changes);
        return;
      }

      await submitOrder(pendingCheckout, refreshed.cart);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de créer la commande.");
    } finally {
      setProcessing(false);
    }
  };

  const cancelPriceConfirmation = () => {
    setPendingCheckout(null);
    setPriceChanges([]);
    dismissPriceNotice();
    navigate("/cart");
  };

  const submitPaymentProof = async (orderId, { file, note }) => {
    setProcessing(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("paymentProof", file);
      if (note) formData.append("note", note);
      const { data } = await api.patch(`/payments/${orderId}/direct-proof`, formData);
      setResult((current) => ({
        ...current,
        paymentStatus: data.paymentStatus,
        reference: data.reference,
        proofUrl: data.proofUrl,
      }));
      clear();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible d'envoyer la preuve de paiement.");
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
        paymentAccount={paymentAccount}
        error={error}
        priceChanges={priceChanges}
        continueAfterPriceConfirmation={Boolean(pendingCheckout)}
        onSubmit={createOrder}
        onConfirmPriceChanges={confirmPriceChanges}
        onCancelPriceChanges={cancelPriceConfirmation}
        onSubmitPaymentProof={submitPaymentProof}
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

function DeliverySettingsPage() {
  return (
    <DashboardLayout>
      <StaffSettingsContent api={api} role="delivery" />
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
  const { user } = useAuth();
  return (
    <DashboardLayout>
      <AdminDashboardContent api={api} user={user} />
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

function AdminContactRequestsPage() {
  const { user } = useAuth();
  const [supportView, setSupportView] = useState("messages");
  const [mobileDiscussionOpen, setMobileDiscussionOpen] = useState(false);

  return (
    <DashboardLayout>
      <div
        className={`admin-support-page ${
          mobileDiscussionOpen ? "mobile-discussion-open" : ""
        }`}
      >
        <header className="admin-support-view-switcher">
          <div>
            <span>Centre de support</span>
            <h1>Messages et demandes clients</h1>
            <p>
              Les discussions instantanées et les dossiers du formulaire Contact
              sont regroupés ici.
            </p>
          </div>
          <nav>
            <button
              className={supportView === "messages" ? "active" : ""}
              onClick={() => setSupportView("messages")}
            >
              <MessageCircle /> Discussions directes
            </button>
            <button
              className={supportView === "requests" ? "active" : ""}
              onClick={() => setSupportView("requests")}
            >
              <Headphones /> Dossiers support
            </button>
          </nav>
        </header>
        {supportView === "messages" ? (
          <MarketplaceMessages
            api={api}
            user={user}
            sellerMode
            onMobileConversationChange={setMobileDiscussionOpen}
          />
        ) : (
          <AdminContactRequestsContent api={api} />
        )}
      </div>
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
      <Route path="/about" element={<About />} />
      <Route path="/terms" element={<Terms />} />
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
        path="/delivery/settings"
        element={
          <Protected roles={["delivery"]}>
            <DeliverySettingsPage />
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
        path="/manager/seller-requests"
        element={
          <Protected roles={["manager", "admin"]}>
            <SupervisorRequestsPage />
          </Protected>
        }
      />
      <Route
        path="/manager/seller-requests/:id"
        element={
          <Protected roles={["manager", "admin"]}>
            <SupervisorRequestDetailPage />
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
      <Route path="/supervisor" element={<Navigate to="/manager" replace />} />
      <Route path="/supervisor/seller-requests" element={<Navigate to="/manager/seller-requests" replace />} />
      <Route path="/supervisor/seller-requests/:id" element={<Navigate to="/manager/seller-requests" replace />} />
      <Route path="/supervisor/reports" element={<Navigate to="/manager/sales-reports" replace />} />
      <Route path="/supervisor/profile" element={<Navigate to="/manager/profile" replace />} />
      <Route path="/supervisor/settings" element={<Navigate to="/manager/settings" replace />} />
      {Object.keys(menus)
        .filter((role) => !["client", "seller", "delivery", "admin", "manager"].includes(role))
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

function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (!import.meta.env.PROD) return undefined;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    const iosDevice = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const dismissedAt = Number(window.localStorage.getItem("vinnht-pwa-dismissed-at") || 0);
    const dismissalExpired = Date.now() - dismissedAt > 7 * 24 * 60 * 60 * 1000;

    setIsIos(iosDevice);
    if (standalone || !dismissalExpired) return undefined;

    const handleInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
      window.setTimeout(() => setVisible(true), 1100);
    };
    const handleInstalled = () => {
      setVisible(false);
      setInstallEvent(null);
      window.localStorage.removeItem("vinnht-pwa-dismissed-at");
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    let iosTimer;
    if (iosDevice) {
      iosTimer = window.setTimeout(() => setVisible(true), 1600);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      window.clearTimeout(iosTimer);
    };
  }, []);

  const close = () => {
    window.localStorage.setItem("vinnht-pwa-dismissed-at", String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (isIos) {
      setShowIosHelp(true);
      return;
    }
    if (!installEvent) return;

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setInstallEvent(null);
  };

  if (!visible || (!isIos && !installEvent)) return null;

  return (
    <motion.aside
      className="pwa-install-card"
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      role="dialog"
      aria-label="Installer l’application VinnHT"
    >
      <button className="pwa-install-close" type="button" onClick={close} aria-label="Fermer">
        <X />
      </button>
      <img src="/icon-192.png" alt="" />
      <div className="pwa-install-content">
        <span>Application VinnHT</span>
        <h2>Ajoutez VinnHT à votre écran d’accueil</h2>
        <p>
          Accédez plus rapidement au marché numérique d’Haïti, comme avec une véritable
          application mobile.
        </p>
        {showIosHelp && (
          <div className="pwa-ios-help">
            <Share2 />
            <span>
              Dans Safari, touchez <b>Partager</b>, puis <b>Sur l’écran d’accueil</b>.
            </span>
          </div>
        )}
        <div className="pwa-install-actions">
          <button type="button" onClick={install}>
            {isIos ? <Share2 /> : <Download />}
            {isIos ? "Voir comment l’ajouter" : "Ajouter à l’écran d’accueil"}
          </button>
          <button type="button" className="secondary" onClick={close}>
            Plus tard
          </button>
        </div>
      </div>
    </motion.aside>
  );
}

export default function App() {
  return (
    <Providers>
      <React.Suspense
        fallback={
          <div className="auth-loading-screen">
            <img src="/vinnht-logo.png" alt="VinnHT" />
            <span>Chargement de votre espace...</span>
          </div>
        }
      >
        <AppRoutes />
      </React.Suspense>
      <PwaInstallPrompt />
    </Providers>
  );
}

