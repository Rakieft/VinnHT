import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Bell,
  DollarSign,
  Edit3,
  Eye,
  ImagePlus,
  Package,
  Plus,
  Power,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Trash2,
  Wallet,
  UploadCloud,
  UserRoundCheck,
  X,
} from "lucide-react";
import ProfilePhotoManager from "./ProfilePhotoManager.jsx";
import ProfileLogoutCard from "./ProfileLogoutCard.jsx";
import { apiOrigin } from "../config/runtime.js";

const imageSource = (url) => (url?.startsWith("/uploads") ? `${apiOrigin}${url}` : url);

export function SellerProductsContent({ api }) {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  const load = () => api.get("/seller/products").then(({ data }) => setProducts(data));

  useEffect(() => {
    load();
  }, []);

  const toggle = async (product) => {
    await api.patch(`/seller/products/${product.id}`, {
      status: product.status === "active" ? "inactive" : "active",
    });
    setMessage("Statut du produit mis à jour.");
    load();
  };

  const visibleProducts = products.filter((product) => {
    const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      product.status === filter ||
      (filter === "low-stock" && Number(product.stock) <= 5);
    return matchesQuery && matchesFilter;
  });

  const saveEdit = async (event) => {
    event.preventDefault();
    await api.patch(`/seller/products/${editing.id}`, {
      name: editing.name,
      price: Number(editing.price),
      promotionalPrice: editing.promotional_price
        ? Number(editing.promotional_price)
        : "",
      isFeatured: Boolean(editing.is_featured),
      offerEndsAt: editing.offer_ends_at || "",
      stock: Number(editing.stock),
      description: editing.description || "",
    });
    setEditing(null);
    setMessage("Produit modifié avec succès.");
    load();
  };

  return (
    <SellerPageHeader
      eyebrow="Catalogue vendeur"
      title="Mes produits"
      text="Gérez vos produits, stocks et disponibilités."
    >
      {message && <div className="flow-success">{message}</div>}
      <div className="seller-catalog-toolbar">
        <label>
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un produit"
          />
        </label>
        <div>
          <button
            className="seller-add-product-button"
            onClick={() => setAdding((current) => !current)}
          >
            {adding ? <X /> : <Plus />}
            {adding ? "Fermer" : "Ajouter un produit"}
          </button>
          {[
            ["all", "Tous"],
            ["active", "Actifs"],
            ["inactive", "Inactifs"],
            ["low-stock", "Stock faible"],
          ].map(([value, label]) => (
            <button
              className={filter === value ? "active" : ""}
              onClick={() => setFilter(value)}
              key={value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {adding && (
        <AddSellerProductContent
          api={api}
          embedded
          onCreated={() => {
            setAdding(false);
            setMessage("Produit ajouté avec succès.");
            load();
          }}
        />
      )}
      <div className="seller-product-grid">
        {visibleProducts.map((product) => (
          <motion.article whileHover={{ y: -5 }} key={product.id}>
            <img src={imageSource(product.image_url)} alt={product.name} />
            <div>
              <span className={`flow-status ${product.status}`}>{product.status}</span>
              {Number(product.stock) <= 5 && (
                <span className="low-stock-badge">
                  <AlertTriangle /> Stock faible
                </span>
              )}
              {Boolean(product.is_featured) && product.promotional_price && (
                <span className="flow-status confirmed">Offre spéciale</span>
              )}
              <h3>{product.name}</h3>
              <p>
                {product.category_name || "Produit"} · Stock : {product.stock}
              </p>
              <strong>
                {Number(product.promotional_price || product.price).toLocaleString("fr-HT")} HTG
              </strong>
            </div>
            <footer>
              <button title="Modifier" onClick={() => setEditing({ ...product })}>
                <Edit3 />
              </button>
              <button onClick={() => toggle(product)}>
                <Power />
                {product.status === "active" ? "Désactiver" : "Activer"}
              </button>
            </footer>
          </motion.article>
        ))}
      </div>
      {editing && (
        <form className="seller-edit-panel" onSubmit={saveEdit}>
          <header>
            <div>
              <span>Modification rapide</span>
              <h2>{editing.name}</h2>
            </div>
            <button type="button" onClick={() => setEditing(null)}>
              <X />
            </button>
          </header>
          <label>
            Nom
            <input
              value={editing.name}
              onChange={(event) => setEditing({ ...editing, name: event.target.value })}
            />
          </label>
          <label>
            Prix HTG
            <input
              type="number"
              value={editing.price}
              onChange={(event) => setEditing({ ...editing, price: event.target.value })}
            />
          </label>
          <label>
            Stock
            <input
              type="number"
              value={editing.stock}
              onChange={(event) => setEditing({ ...editing, stock: event.target.value })}
            />
          </label>
          <label>
            Prix promotionnel HTG
            <input
              min="0"
              max={editing.price}
              type="number"
              placeholder="Laisser vide sans promotion"
              value={editing.promotional_price || ""}
              onChange={(event) =>
                setEditing({ ...editing, promotional_price: event.target.value })
              }
            />
          </label>
          <label>
            Fin de l’offre
            <input
              type="datetime-local"
              value={editing.offer_ends_at?.slice(0, 16) || ""}
              onChange={(event) => setEditing({ ...editing, offer_ends_at: event.target.value })}
            />
          </label>
          <label className="seller-featured-toggle">
            <input
              type="checkbox"
              checked={Boolean(editing.is_featured)}
              onChange={(event) => setEditing({ ...editing, is_featured: event.target.checked })}
            />
            Afficher dans les offres spéciales VinnHT
          </label>
          <label className="full">
            Description
            <textarea
              rows="4"
              value={editing.description || ""}
              onChange={(event) => setEditing({ ...editing, description: event.target.value })}
            />
          </label>
          <button>Enregistrer les modifications</button>
        </form>
      )}
    </SellerPageHeader>
  );
}

export function AddSellerProductContent({ api, embedded = false, onCreated }) {
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    description: "",
    price: "",
    stock: "",
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    api.get("/categories").then(({ data }) => setCategories(data));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      images.forEach((image) => data.append("images", image));
      await api.post("/products", data);
      setMessage("Produit ajouté avec succès.");
      setForm({ name: "", categoryId: "", description: "", price: "", stock: "" });
      setImages([]);
      setPreviews([]);
      onCreated?.();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible d’ajouter le produit.");
    }
  };

  const studio = (
    <>
      {message && <div className="flow-success">{message}</div>}
      {error && <div className="flow-error">{error}</div>}
      <form className="seller-product-studio" onSubmit={submit}>
        <div className="seller-product-studio-main">
          <header className="seller-product-studio-heading">
            <span>
              <Sparkles /> Nouvelle fiche produit
            </span>
            <h2>Présentez votre produit comme une grande marque.</h2>
            <p>Des informations précises et de belles images inspirent confiance aux clients.</p>
          </header>

          <ProductStudioSection
            number="01"
            title="Informations essentielles"
            text="Le nom et le rayon dans lequel les clients trouveront ce produit."
          >
            <label>
              Nom du produit
              <input
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Ex. Casque audio sans fil"
              />
            </label>
            <label>
              Catégorie
              <select
                required
                value={form.categoryId}
                onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
              >
                <option value="">Choisir une catégorie</option>
                {categories.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </ProductStudioSection>

          <ProductStudioSection
            number="02"
            title="Prix et disponibilité"
            text="Indiquez un prix clair et le stock réellement disponible."
          >
            <label>
              Prix de vente
              <span className="seller-input-affix">
                <input
                  required
                  min="0"
                  type="number"
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                  placeholder="0"
                />
                <b>HTG</b>
              </span>
            </label>
            <label>
              Quantité en stock
              <input
                required
                min="0"
                type="number"
                value={form.stock}
                onChange={(event) => setForm({ ...form, stock: event.target.value })}
                placeholder="0"
              />
            </label>
          </ProductStudioSection>

          <section className="seller-product-form-section">
            <header>
              <b>03</b>
              <div>
                <h3>Photos et description</h3>
                <p>Utilisez des photos nettes prises sous plusieurs angles.</p>
              </div>
            </header>
            <label className="seller-images-upload seller-studio-upload">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files || []).slice(0, 5);
                  setImages(files);
                  setPreviews(files.map((file) => URL.createObjectURL(file)));
                }}
              />
              <span>
                <UploadCloud />
                <b>Choisir les images</b>
                <small>JPG, PNG ou WebP · maximum 5 images</small>
              </span>
              {previews.length > 0 && (
                <div>
                  {previews.map((preview, index) => (
                    <img src={preview} alt={`Aperçu ${index + 1}`} key={preview} />
                  ))}
                </div>
              )}
            </label>
            <label className="seller-studio-description">
              Description du produit
              <textarea
                rows="6"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Décrivez les caractéristiques, l’état et les avantages du produit..."
              />
            </label>
          </section>

          <footer className="seller-product-studio-footer">
            <p>
              <ShieldCheck /> Vous pourrez modifier ou désactiver ce produit à tout moment.
            </p>
            <button>
              <Plus /> Publier le produit
            </button>
          </footer>
        </div>

        <aside className="seller-product-live-preview">
          <span>Aperçu client</span>
          <div className="seller-preview-image">
            {previews[0] ? <img src={previews[0]} alt="Aperçu principal" /> : <ImagePlus />}
          </div>
          <small>
            {categories.find((category) => String(category.id) === String(form.categoryId))?.name ||
              "Catégorie"}
          </small>
          <h3>{form.name || "Nom de votre produit"}</h3>
          <strong>{Number(form.price || 0).toLocaleString("fr-HT")} HTG</strong>
          <p>{form.description || "La description de votre produit apparaîtra ici."}</p>
          <div>
            <CheckCircle2 /> Fiche prête à être publiée
          </div>
        </aside>
      </form>
    </>
  );

  if (embedded)
    return (
      <section className="seller-embedded-product-form seller-product-studio-shell">
        {studio}
      </section>
    );
  return (
    <SellerPageHeader
      eyebrow="Nouveau produit"
      title="Ajouter un produit"
      text="Créez une fiche premium pour présenter votre produit aux clients."
    >
      {studio}
    </SellerPageHeader>
  );
}

function ProductStudioSection({ number, title, text, children }) {
  return (
    <section className="seller-product-form-section">
      <header>
        <b>{number}</b>
        <div>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
      </header>
      <div className="seller-product-fields">{children}</div>
    </section>
  );
}

function LegacyAddSellerProductContent({ api, embedded = false, onCreated }) {
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    description: "",
    price: "",
    stock: "",
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    api.get("/categories").then(({ data }) => setCategories(data));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      images.forEach((image) => data.append("images", image));
      await api.post("/products", data);
      setMessage("Produit ajouté avec succès.");
      setForm({
        name: "",
        categoryId: "",
        description: "",
        price: "",
        stock: "",
      });
      setImages([]);
      setPreviews([]);
      onCreated?.();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible d’ajouter le produit.");
    }
  };

  const content = (
    <>
      {message && <div className="flow-success">{message}</div>}
      {error && <div className="flow-error">{error}</div>}
      <form className="seller-product-form" onSubmit={submit}>
        <label>
          Nom du produit
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>
        <label>
          Catégorie
          <select
            required
            value={form.categoryId}
            onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
          >
            <option value="">Choisir une catégorie</option>
            {categories.map((category) => (
              <option value={category.id} key={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Prix HTG
          <input
            required
            min="0"
            type="number"
            value={form.price}
            onChange={(event) => setForm({ ...form, price: event.target.value })}
          />
        </label>
        <label>
          Stock
          <input
            required
            min="0"
            type="number"
            value={form.stock}
            onChange={(event) => setForm({ ...form, stock: event.target.value })}
          />
        </label>
        <label className="full seller-images-upload">
          Images du produit
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files || []).slice(0, 5);
              setImages(files);
              setPreviews(files.map((file) => URL.createObjectURL(file)));
            }}
          />
          <span>
            <ImagePlus /> Choisir jusqu’à 5 images
          </span>
          {previews.length > 0 && (
            <div>
              {previews.map((preview) => (
                <img src={preview} alt="Aperçu produit" key={preview} />
              ))}
            </div>
          )}
        </label>
        <label className="full">
          Description
          <textarea
            rows="6"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </label>
        <button>
          <Plus />
          Ajouter le produit
        </button>
      </form>
    </>
  );

  if (embedded) {
    return <section className="seller-embedded-product-form">{content}</section>;
  }

  return (
    <SellerPageHeader
      eyebrow="Nouveau produit"
      title="Ajouter un produit"
      text="Créez une fiche claire pour présenter votre produit aux clients."
    >
      {content}
    </SellerPageHeader>
  );
}

const money = (value) => `${Number(value || 0).toLocaleString("fr-HT")} HTG`;
const shortDate = (value) =>
  new Intl.DateTimeFormat("fr-HT", { dateStyle: "medium" }).format(new Date(value));

export function SellerDashboardContent({ api, user }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/seller/dashboard").then(({ data: response }) => setData(response));
  }, []);

  const stats = data?.stats || {};
  const cards = [
    [Package, "Produits actifs", stats.active_products || 0, "Votre catalogue en ligne"],
    [AlertTriangle, "Stocks faibles", stats.low_stock_products || 0, "Produits à réapprovisionner"],
    [Clock3, "À préparer", stats.awaiting_preparation || 0, "Commandes payées à traiter"],
    [CheckCircle2, "Prêtes", stats.ready_orders || 0, "En attente de livraison"],
  ];

  return (
    <SellerPageHeader
      eyebrow="Centre de pilotage"
      title={`Bonjour, ${user.name}`}
      text="Pilotez votre boutique, préparez vos commandes et suivez vos performances."
    >
      <section className="seller-dashboard-hero">
        <div>
          <span>Performance de votre boutique</span>
          <h2>{money(stats.net_sales)}</h2>
          <p>Revenu net estimé après commission, sans fonction de retrait configurée.</p>
        </div>
        <Wallet />
      </section>
      <section className="seller-metric-grid">
        {cards.map(([Icon, label, value, note]) => (
          <motion.article whileHover={{ y: -5 }} key={label}>
            <span>
              <Icon />
            </span>
            <small>{label}</small>
            <strong>{value}</strong>
            <p>{note}</p>
          </motion.article>
        ))}
      </section>
      <section className="seller-finance-panel">
        <header>
          <div>
            <span>Activité récente</span>
            <h2>Dernières ventes</h2>
          </div>
          <TrendingUp />
        </header>
        <div className="seller-finance-list">
          {(data?.recentSales || []).map((sale) => (
            <article key={sale.id}>
              <div>
                <strong>{sale.order_number}</strong>
                <small>{shortDate(sale.created_at)}</small>
              </div>
              <b>{money(sale.net_amount)}</b>
              <span className={`flow-status ${sale.status}`}>{sale.status}</span>
            </article>
          ))}
          {data && !data.recentSales.length && <p>Aucune vente pour le moment.</p>}
        </div>
      </section>
    </SellerPageHeader>
  );
}

export function SellerOrdersContent({ api }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  const load = () => api.get("/seller/orders").then(({ data }) => setOrders(data));

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (saleId, status) => {
    const { data } = await api.patch(`/seller/sales/${saleId}/status`, { status });
    setMessage(data.message);
    setSelected(null);
    load();
  };

  const visible = orders.filter((order) => filter === "all" || order.seller_status === filter);

  return (
    <SellerPageHeader
      eyebrow="Opérations boutique"
      title="Commandes reçues"
      text="Préparez uniquement les produits vendus par votre boutique."
    >
      {message && <div className="flow-success">{message}</div>}
      <div className="seller-catalog-toolbar">
        <div>
          {[
            ["all", "Toutes"],
            ["pending", "Paiement en attente"],
            ["confirmed", "À préparer"],
            ["preparing", "En préparation"],
            ["ready", "Prêtes"],
            ["completed", "Livrées"],
            ["cancelled", "Annulées"],
          ].map(([value, label]) => (
            <button
              className={filter === value ? "active" : ""}
              onClick={() => setFilter(value)}
              key={value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <section className="seller-order-list">
        {visible.map((order) => (
          <motion.article whileHover={{ y: -3 }} key={order.sale_id}>
            <header>
              <div>
                <small>{order.order_number}</small>
                <h3>{order.client_name}</h3>
                <p>
                  <CalendarDays /> {shortDate(order.created_at)}
                </p>
              </div>
              <span className={`flow-status ${order.seller_status}`}>{order.seller_status}</span>
            </header>
            <div className="seller-order-items">
              {order.items.map((item) => (
                <div key={item.product_id}>
                  <img src={imageSource(item.image_url)} alt={item.name} />
                  <span>
                    <strong>{item.name}</strong>
                    <small>Quantité : {item.quantity}</small>
                  </span>
                  <b>{money(item.subtotal)}</b>
                </div>
              ))}
            </div>
            <footer>
              <strong>{money(order.gross_amount)}</strong>
              <button onClick={() => setSelected(order)}>
                <Eye /> Voir détails
              </button>
            </footer>
          </motion.article>
        ))}
        {!visible.length && <div className="seller-empty-state">Aucune commande ici.</div>}
      </section>
      {selected && (
        <section className="seller-order-detail">
          <header>
            <div>
              <span>Détail commande</span>
              <h2>{selected.order_number}</h2>
            </div>
            <button onClick={() => setSelected(null)}>
              <X />
            </button>
          </header>
          <div className="seller-order-information">
            <article>
              <small>Client</small>
              <strong>{selected.client_name}</strong>
              <span>{selected.client_phone || "Téléphone non renseigné"}</span>
            </article>
            <article>
              <small>Livraison</small>
              <strong>{selected.delivery_address}</strong>
            </article>
            <article>
              <small>Paiement</small>
              <strong>{selected.payment_status}</strong>
              <span>Livraison : {selected.delivery_status || "non assignée"}</span>
            </article>
            {selected.delivery_status === "delivered" && (
              <article className="seller-delivery-confirmed">
                <small>Preuve de réception</small>
                <strong>Commande finalisée</strong>
                <span>
                  Signée par {selected.delivery_signer_name || "le client"}
                  {selected.delivery_confirmed_at
                    ? ` le ${shortDate(selected.delivery_confirmed_at)}`
                    : ""}
                </span>
              </article>
            )}
          </div>
          {["confirmed", "preparing"].includes(selected.seller_status) &&
            selected.payment_status === "paid" && (
              <footer>
                <button
                  onClick={() =>
                    updateStatus(
                      selected.sale_id,
                      selected.seller_status === "confirmed" ? "preparing" : "ready"
                    )
                  }
                >
                  <CheckCircle2 />
                  {selected.seller_status === "confirmed"
                    ? "Commencer la préparation"
                    : "Marquer prête pour livraison"}
                </button>
                <button onClick={() => updateStatus(selected.sale_id, "cancelled")}>
                  <X /> Annuler ma vente
                </button>
              </footer>
            )}
        </section>
      )}
    </SellerPageHeader>
  );
}

export function SellerSalesContent({ api }) {
  const [sales, setSales] = useState([]);

  useEffect(() => {
    api.get("/seller/sales").then(({ data }) => setSales(data));
  }, []);

  const totals = sales.reduce(
    (result, sale) => ({
      gross: result.gross + Number(sale.gross_amount),
      commission: result.commission + Number(sale.commission_amount),
      net: result.net + Number(sale.net_amount),
    }),
    { gross: 0, commission: 0, net: 0 }
  );

  return (
    <SellerPageHeader
      eyebrow="Finances boutique"
      title="Ventes & revenus"
      text="Suivez vos ventes, commissions et revenus dans un seul espace."
    >
      <section className="seller-payout-banner">
        <span>
          <Wallet />
        </span>
        <div>
          <small>Revenu net estimé</small>
          <h2>{money(totals.net)}</h2>
          <p>Montant cumulé après déduction des commissions VinnHT.</p>
        </div>
      </section>
      <section className="seller-metric-grid">
        {[
          [DollarSign, "Ventes brutes", totals.gross],
          [ShieldCheck, "Commission VinnHT", totals.commission],
          [Wallet, "Revenu net", totals.net],
        ].map(([Icon, label, value]) => (
          <article key={label}>
            <span>
              <Icon />
            </span>
            <small>{label}</small>
            <strong>{money(value)}</strong>
          </article>
        ))}
      </section>
      <SellerFinanceTable
        rows={sales}
        columns={[
          ["Commande", "order_number"],
          ["Brut", "gross_amount", money],
          ["Commission", "commission_amount", money],
          ["Net vendeur", "net_amount", money],
          ["Statut", "status", null, true],
        ]}
      />
    </SellerPageHeader>
  );
}

export function SellerPayoutsContent({ api }) {
  const [sales, setSales] = useState([]);

  useEffect(() => {
    api.get("/seller/sales").then(({ data }) => setSales(data));
  }, []);

  const trackedSales = sales.filter((sale) => sale.status !== "cancelled");
  const netTotal = trackedSales.reduce((sum, sale) => sum + Number(sale.net_amount), 0);

  return (
    <SellerPageHeader
      eyebrow="Suivi financier"
      title="Mes revenus"
      text="Consultez vos ventes et revenus estimés. Les retraits seront définis ultérieurement."
    >
      <section className="seller-payout-banner">
        <span>
          <Wallet />
        </span>
        <div>
          <small>Revenu net estimé</small>
          <h2>{money(netTotal)}</h2>
          <p>Aucune demande de retrait ni méthode de paiement n’est configurée.</p>
        </div>
      </section>
      <SellerFinanceTable
        rows={trackedSales}
        columns={[
          ["Commande", "order_number"],
          ["Vente brute", "gross_amount", money],
          ["Commission", "commission_amount", money],
          ["Revenu net", "net_amount", money],
          ["Statut", "status", null, true],
        ]}
      />
    </SellerPageHeader>
  );
}

export function SellerShopContent({ api }) {
  const [shop, setShop] = useState(null);
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [cropSource, setCropSource] = useState("");
  const [zoom, setZoom] = useState(1);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);
  const [busyLogo, setBusyLogo] = useState(false);
  const cropImageRef = useRef(null);

  useEffect(() => {
    api.get("/seller/shop").then(({ data }) => {
      setShop({
        shopName: data.shop_name || "",
        category: data.category || "",
        description: data.description || "",
        whatsapp: data.whatsapp || "",
        pickupAddress: data.pickup_address || "",
        openingHours: data.opening_hours || "",
        deliveryZones: data.delivery_zones || "",
        status: data.status || "active",
        shopLogoUrl: data.shop_logo_url || "",
      });
      if (data.shop_logo_url) setPreview(imageSource(data.shop_logo_url));
    });
  }, []);

  const chooseLogo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCropSource(URL.createObjectURL(file));
    setZoom(1);
    setPositionX(50);
    setPositionY(50);
    event.target.value = "";
  };

  const applyLogoCrop = async () => {
    const image = cropImageRef.current;
    if (!image) return;
    setBusyLogo(true);

    try {
      const size = 700;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      const baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
      const scale = baseScale * zoom;
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const maxX = Math.max(0, width - size);
      const maxY = Math.max(0, height - size);

      context.drawImage(
        image,
        -(maxX * positionX) / 100,
        -(maxY * positionY) / 100,
        width,
        height,
      );

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png", 0.92),
      );
      const croppedLogo = new File([blob], "logo-boutique-vinnht.png", {
        type: "image/png",
      });

      setLogo(croppedLogo);
      setPreview(URL.createObjectURL(blob));
      setCropSource("");
      setMessage("Logo recadré. Enregistrez la boutique pour appliquer la modification.");
    } finally {
      setBusyLogo(false);
    }
  };

  const removeLogo = async () => {
    setBusyLogo(true);
    try {
      const { data } = await api.delete("/seller/shop/logo");
      setLogo(null);
      setPreview("");
      setShop({ ...shop, shopLogoUrl: "" });
      window.dispatchEvent(
        new CustomEvent("vinnht-shop-logo-updated", { detail: "" }),
      );
      setMessage(data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Impossible de supprimer le logo.");
    } finally {
      setBusyLogo(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    const data = new FormData();
    Object.entries(shop).forEach(([key, value]) => {
      if (key !== "shopLogoUrl") data.append(key, value || "");
    });
    if (logo) data.append("shopLogo", logo);
    const { data: response } = await api.patch("/seller/shop", data);
    setMessage(response.message);
    if (response.shop.shop_logo_url) {
      setPreview(imageSource(response.shop.shop_logo_url));
      window.dispatchEvent(
        new CustomEvent("vinnht-shop-logo-updated", {
          detail: response.shop.shop_logo_url,
        }),
      );
    }
  };

  if (!shop) return <div className="seller-empty-state">Chargement de la boutique...</div>;

  return (
    <SellerPageHeader
      eyebrow="Identité commerciale"
      title="Ma boutique"
      text="Présentez une boutique claire et professionnelle aux clients VinnHT."
    >
      {message && <div className="flow-success">{message}</div>}
      <section className="seller-shop-layout">
        <aside className="seller-shop-preview">
          <label className="seller-logo-picker">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={chooseLogo}
            />
            <span>{preview ? <img src={preview} alt="Logo boutique" /> : <Store />}</span>
            <small>
              <UploadCloud /> Choisir et recadrer
            </small>
          </label>
          {preview && (
            <button
              className="seller-logo-remove"
              type="button"
              onClick={removeLogo}
              disabled={busyLogo}
            >
              <Trash2 />
              Supprimer le logo
            </button>
          )}
          <div>
            <span>Boutique VinnHT</span>
            <h2>{shop.shopName || "Votre boutique"}</h2>
            <p>{shop.description || "Ajoutez une description pour présenter votre activité."}</p>
            <b className={`flow-status ${shop.status}`}>{shop.status}</b>
          </div>
        </aside>
        <form className="seller-shop-form" onSubmit={save}>
          <label>
            Nom de la boutique
            <input
              required
              value={shop.shopName}
              onChange={(event) => setShop({ ...shop, shopName: event.target.value })}
            />
          </label>
          <label>
            Catégorie principale
            <input
              value={shop.category}
              onChange={(event) => setShop({ ...shop, category: event.target.value })}
            />
          </label>
          <label>
            WhatsApp professionnel
            <input
              required
              minLength="8"
              placeholder="Ex. +509 37 00 12 34"
              value={shop.whatsapp}
              onChange={(event) => setShop({ ...shop, whatsapp: event.target.value })}
            />
          </label>
          <label>
            Visibilité boutique
            <select
              value={shop.status}
              onChange={(event) => setShop({ ...shop, status: event.target.value })}
            >
              <option value="active">Active</option>
              <option value="paused">En pause</option>
            </select>
          </label>
          <label className="full">
            Description
            <textarea
              rows="5"
              value={shop.description}
              onChange={(event) => setShop({ ...shop, description: event.target.value })}
            />
          </label>
          <label className="full">
            Adresse de récupération
            <input
              value={shop.pickupAddress}
              onChange={(event) => setShop({ ...shop, pickupAddress: event.target.value })}
            />
          </label>
          <label>
            Horaires d’ouverture
            <input
              placeholder="Ex. Lun-Sam, 8h00-18h00"
              value={shop.openingHours}
              onChange={(event) => setShop({ ...shop, openingHours: event.target.value })}
            />
          </label>
          <label>
            Zones desservies
            <input
              placeholder="Ex. Pétion-Ville, Delmas, Tabarre"
              value={shop.deliveryZones}
              onChange={(event) => setShop({ ...shop, deliveryZones: event.target.value })}
            />
          </label>
          <button>Enregistrer la boutique</button>
        </form>
      </section>
      {cropSource && (
        <div className="photo-crop-overlay">
          <section className="photo-crop-dialog">
            <header>
              <div>
                <span>Logo de la boutique</span>
                <h2>Recadrer votre logo</h2>
              </div>
              <button type="button" onClick={() => setCropSource("")}>
                <X />
              </button>
            </header>
            <div className="photo-crop-stage">
              <img
                ref={cropImageRef}
                src={cropSource}
                alt="Logo à recadrer"
                style={{
                  transform: `scale(${zoom})`,
                  objectPosition: `${positionX}% ${positionY}%`,
                }}
              />
            </div>
            <div className="photo-crop-controls">
              <label>
                Zoom
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                />
              </label>
              <label>
                Horizontal
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={positionX}
                  onChange={(event) => setPositionX(Number(event.target.value))}
                />
              </label>
              <label>
                Vertical
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={positionY}
                  onChange={(event) => setPositionY(Number(event.target.value))}
                />
              </label>
            </div>
            <footer>
              <button type="button" onClick={() => setCropSource("")}>
                Annuler
              </button>
              <button type="button" onClick={applyLogoCrop} disabled={busyLogo}>
                <Check />
                {busyLogo ? "Préparation..." : "Utiliser ce logo"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </SellerPageHeader>
  );
}

export function SellerProfileContent({ api, user, updateUser, onLogout }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
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
    <SellerPageHeader
      eyebrow="Identité du vendeur"
      title="Mon profil"
      text="Ajoutez une photo claire pour rassurer les clients qui échangent avec votre boutique."
    >
      <section className="seller-profile-layout">
        <aside className="seller-profile-card">
          <ProfilePhotoManager
            api={api}
            user={user}
            updateUser={updateUser}
            onMessage={setMessage}
          />
          <div>
            <span>Vendeur vérifié</span>
            <h2>{user?.name || "Vendeur VinnHT"}</h2>
            <p>{user?.email}</p>
          </div>
        </aside>

        <form className="seller-profile-form" onSubmit={save}>
          <header>
            <div>
              <span>Compte personnel</span>
              <h2>Informations du vendeur</h2>
            </div>
            {message && <strong>{message}</strong>}
          </header>

          <label>
            Nom complet
            <input
              required
              minLength="2"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>

          <label>
            Adresse email
            <input value={user?.email || ""} disabled />
          </label>

          <label className="full">
            Téléphone
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </label>

          <button disabled={saving}>
            <Check />
            {saving ? "Enregistrement..." : "Enregistrer le profil"}
          </button>
        </form>
      </section>
      <ProfileLogoutCard onLogout={onLogout} />
    </SellerPageHeader>
  );
}

export function SellerSettingsContent({ api }) {
  const defaults = {
    newOrders: true,
    lowStock: true,
    readyOrders: true,
    weeklyReport: false,
  };
  const [preferences, setPreferences] = useState(defaults);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/preferences/seller").then(({ data }) => setPreferences({ ...defaults, ...data }));
  }, []);

  const togglePreference = async (key) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    try {
      const { data } = await api.put("/preferences/seller", { preferences: next });
      setMessage(data.message);
    } catch (error) {
      setPreferences(preferences);
      setMessage(error.response?.data?.message || "Impossible d’enregistrer ce paramètre.");
    }
  };

  return (
    <SellerPageHeader
      eyebrow="Préférences vendeur"
      title="Paramètres"
      text="Choisissez les alertes utiles pour piloter votre boutique."
    >
      <section className="seller-settings-grid">
        {[
          [
            Package,
            "Nouvelles commandes",
            "Alerte dès qu’un client paie une commande.",
            "newOrders",
          ],
          [
            AlertTriangle,
            "Stock faible",
            "Alerte lorsqu’un produit atteint cinq unités.",
            "lowStock",
          ],
          [
            CheckCircle2,
            "Commandes prêtes",
            "Alerte lorsqu’une commande doit être remise au livreur.",
            "readyOrders",
          ],
          [
            BarChart3,
            "Rapport hebdomadaire",
            "Recevoir un résumé des performances.",
            "weeklyReport",
          ],
        ].map(([Icon, title, text, key]) => (
          <motion.article whileHover={{ y: -4 }} key={key}>
            <span>
              <Icon />
            </span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
            <label>
              <input
                type="checkbox"
                checked={preferences[key]}
                onChange={() => togglePreference(key)}
              />
              <i />
            </label>
          </motion.article>
        ))}
      </section>
      <section className="seller-settings-note">
        <Bell />
        <div>
          <h2>Notifications intelligentes</h2>
          <p>Les alertes email, WhatsApp et push seront connectées avant la mise en production.</p>
        </div>
      </section>
      {message && <div className="seller-message">{message}</div>}
    </SellerPageHeader>
  );
}

function SellerFinanceTable({ rows, columns }) {
  return (
    <div className="seller-finance-table">
      <table>
        <thead>
          <tr>
            {columns.map(([label]) => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map(([label, key, formatter, status]) => (
                <td key={label}>
                  {status ? (
                    <span className={`flow-status ${row[key]}`}>{row[key]}</span>
                  ) : formatter ? (
                    formatter(row[key])
                  ) : (
                    row[key]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <div className="seller-empty-state">Aucune donnée disponible.</div>}
    </div>
  );
}

export function SupervisorRequestsContent({ api }) {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");

  const load = () => api.get("/admin/seller-requests").then(({ data }) => setRequests(data));

  useEffect(() => {
    load();
  }, []);

  const details = (request) => {
    try {
      return JSON.parse(request.description || "{}");
    } catch {
      return { shopDescription: request.description };
    }
  };

  return (
    <SellerPageHeader
      eyebrow="Validation vendeurs"
      title="Demandes vendeurs"
      text="Examinez les candidatures et activez les nouvelles boutiques."
    >
      <div className="seller-request-list">
        {requests.map((request) => (
          <article key={request.id}>
            <span>
              {request.shop_logo_url ? (
                <img src={imageSource(request.shop_logo_url)} alt={request.business_name} />
              ) : (
                <Store />
              )}
            </span>
            <div>
              <small>
                {request.name} · {request.email}
              </small>
              <h3>{request.business_name}</h3>
              <p>{details(request).shopDescription || "Aucune description fournie."}</p>
            </div>
            <b className={`flow-status ${request.status}`}>{request.status}</b>
            <footer>
              <Link className="request-details-button" to={`/supervisor/seller-requests/${request.id}`}>
                <Eye /> Ouvrir le dossier de vérification
              </Link>
            </footer>
          </article>
        ))}
      </div>
    </SellerPageHeader>
  );
}

const requestFieldLabels = {
  fullName: "Nom complet déclaré",
  birthDate: "Date de naissance",
  primaryPhone: "Téléphone principal",
  secondaryPhone: "Téléphone secondaire",
  email: "Adresse email déclarée",
  fullAddress: "Adresse complète",
  city: "Ville",
  department: "Département",
  activityStatus: "Situation actuelle",
  institutionName: "École, université, entreprise ou établissement",
  activityDetails: "Fonction, niveau ou précision",
  shopName: "Nom de la boutique",
  mainCategory: "Catégorie principale",
  shopDescription: "Description de la boutique",
  pickupAddress: "Adresse de récupération",
};

const parseRequestDetails = (description) => {
  try {
    return JSON.parse(description || "{}");
  } catch {
    const legacyDescription = description || "";
    const recovered = {};
    legacyDescription
      .replace(/^\{|\}$/g, "")
      .split(",")
      .forEach((part) => {
        const separator = part.indexOf(":");
        if (separator > 0) {
          recovered[part.slice(0, separator).trim()] = part.slice(separator + 1).trim();
        }
      });
    return { ...recovered, legacyDescription };
  }
};

export function SupervisorRequestDetailContent({ api, requestId }) {
  const [request, setRequest] = useState(null);
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/admin/seller-requests/${requestId}`).then(({ data }) => setRequest(data));
  useEffect(() => { load(); }, [requestId]);

  const review = async (status) => {
    setBusy(true);
    try {
      const { data } = await api.patch(`/admin/seller-requests/${requestId}`, {
        status,
        reason: status === "rejected" ? reason : "",
      });
      setMessage(data.message);
      setRejecting(false);
      setReason("");
      load();
    } finally {
      setBusy(false);
    }
  };

  if (!request) {
    return <div className="seller-request-verification-loading">Chargement du dossier vendeur...</div>;
  }

  const details = parseRequestDetails(request.description);
  const identityFields = ["fullName", "birthDate", "primaryPhone", "secondaryPhone", "email", "fullAddress", "city", "department"];
  const activityFields = ["activityStatus", "institutionName", "activityDetails"];
  const shopFields = ["shopName", "mainCategory", "shopDescription", "pickupAddress"];
  const completenessFields = [...identityFields.filter((field) => field !== "secondaryPhone"), ...activityFields.slice(0, 2), ...shopFields];
  const completed = completenessFields.filter((field) => details[field]).length;
  const completeness = Math.round((completed / completenessFields.length) * 100);

  const FieldGroup = ({ title, icon: Icon, fields }) => (
    <section className="seller-verification-panel">
      <header><Icon /><div><small>Informations déclarées</small><h2>{title}</h2></div></header>
      <div>
        {fields.map((field) => (
          <article className={!details[field] ? "missing" : ""} key={field}>
            <small>{requestFieldLabels[field]}</small>
            <strong>{details[field] || "Information non fournie"}</strong>
          </article>
        ))}
      </div>
    </section>
  );

  return (
    <div className="seller-request-verification">
      <Link className="seller-verification-back" to="/supervisor/seller-requests">← Retour aux demandes</Link>
      <header className="seller-verification-hero">
        <div className="seller-verification-identity">
          <span>
            {request.profile_image_url ? <img src={imageSource(request.profile_image_url)} alt={request.name} /> : <UserRoundCheck />}
          </span>
          <div>
            <small>Dossier vendeur #{request.id}</small>
            <h1>{request.name}</h1>
            <p>{request.email} · {request.phone || "Téléphone non renseigné"}</p>
          </div>
        </div>
        <div className="seller-verification-status">
          <b className={`flow-status ${request.status}`}>{request.status}</b>
          <small>Soumise le {new Date(request.created_at).toLocaleDateString("fr-HT")}</small>
        </div>
      </header>

      {message && <div className="flow-success">{message}</div>}

      <section className="seller-verification-summary">
        <article><ShieldCheck /><span><small>Complétude du dossier</small><b>{completeness}%</b></span></article>
        <article><Store /><span><small>Boutique demandée</small><b>{request.business_name}</b></span></article>
        <article><UserRoundCheck /><span><small>Compte VinnHT</small><b>{request.account_status}</b></span></article>
        <article><CalendarDays /><span><small>Compte créé</small><b>{new Date(request.account_created_at).toLocaleDateString("fr-HT")}</b></span></article>
      </section>

      <div className="seller-verification-columns">
        <main>
          <FieldGroup title="Identité et coordonnées" icon={UserRoundCheck} fields={identityFields} />
          <FieldGroup title="Situation actuelle" icon={ShieldCheck} fields={activityFields} />
          <FieldGroup title="Projet de boutique" icon={Store} fields={shopFields} />
          {details.legacyDescription && (
            <section className="seller-verification-panel">
              <header><Eye /><div><small>Ancienne candidature</small><h2>Description fournie</h2></div></header>
              <p>{details.legacyDescription}</p>
            </section>
          )}
        </main>
        <aside>
          <section className="seller-verification-shop-card">
            <span>{request.shop_logo_url ? <img src={imageSource(request.shop_logo_url)} alt={request.business_name} /> : <Store />}</span>
            <small>Boutique proposée</small>
            <h2>{request.business_name}</h2>
            <p>{details.mainCategory || "Catégorie non renseignée"}</p>
          </section>
          <section className="seller-verification-checklist">
            <h2>Points de contrôle</h2>
            {[
              ["Identité cohérente", Boolean(details.fullName && request.name)],
              ["Coordonnées disponibles", Boolean(request.email && request.phone)],
              ["Situation actuelle précisée", Boolean(details.activityStatus && details.institutionName)],
              ["Projet commercial décrit", Boolean(details.shopDescription && details.mainCategory)],
              ["Adresse de récupération", Boolean(details.pickupAddress)],
              ["Conditions acceptées", Boolean(details.acceptedTerms)],
            ].map(([label, valid]) => <p className={valid ? "valid" : "missing"} key={label}><span>{valid ? "✓" : "!"}</span>{label}</p>)}
          </section>
          {request.reviewed_at && (
            <section className="seller-verification-history">
              <small>Dernière décision</small>
              <b>{request.status}</b>
              <p>{request.reviewer_name || "Superviseur VinnHT"} · {new Date(request.reviewed_at).toLocaleDateString("fr-HT")}</p>
              {request.rejection_reason && <strong>{request.rejection_reason}</strong>}
            </section>
          )}
          {request.status === "pending" && (
            <section className="seller-verification-actions">
              <button disabled={busy} onClick={() => review("approved")}><Check /> Approuver le vendeur</button>
              <button className="danger" onClick={() => setRejecting(true)}><X /> Refuser la demande</button>
            </section>
          )}
        </aside>
      </div>

      {rejecting && (
        <section className="seller-rejection-panel">
          <header><div><span>Décision motivée</span><h2>Refuser {request.business_name}</h2></div><button onClick={() => setRejecting(false)}><X /></button></header>
          <label>Motif obligatoire<textarea rows="5" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Expliquez précisément les informations à corriger." /></label>
          <button disabled={busy || reason.trim().length < 8} onClick={() => review("rejected")}>Confirmer le refus</button>
        </section>
      )}
    </div>
  );
}

export function ClientSellerRequestContent({ api }) {
  const [request, setRequest] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    businessName: "",
    category: "",
    phone: "",
    description: "",
  });

  const load = () => api.get("/seller/requests/mine").then(({ data }) => setRequest(data));

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/seller/requests", {
        businessName: form.businessName,
        description: `Catégorie: ${form.category}\nTéléphone: ${form.phone}\n${form.description}`,
      });
      setMessage("Votre demande vendeur a été envoyée.");
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible d’envoyer la demande.");
    }
  };

  return (
    <SellerPageHeader
      eyebrow="Évolution vendeur"
      title="Devenir vendeur"
      text="Présentez votre activité et commencez à vendre partout en Haïti."
    >
      <div className="seller-request-onboarding">
        <article>
          <span>
            <Store />
          </span>
          <h2>Transformez votre activité avec VinnHT</h2>
          <p>Publiez vos produits, recevez des commandes et suivez vos ventes.</p>
          <div>
            <small>Statut de la demande</small>
            <strong>{request?.status || "Aucune demande"}</strong>
          </div>
        </article>
        <form className="seller-product-form" onSubmit={submit}>
          {message && <div className="flow-success full">{message}</div>}
          {error && <div className="flow-error full">{error}</div>}
          <label>
            Nom de la boutique
            <input
              required
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            />
          </label>
          <label>
            Catégorie
            <input
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </label>
          <label>
            Téléphone WhatsApp
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label className="full">
            Description
            <textarea
              rows="6"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <button disabled={request?.status === "pending"}>
            <ShieldCheck />
            {request?.status === "pending" ? "Demande en attente" : "Envoyer la demande"}
          </button>
        </form>
      </div>
    </SellerPageHeader>
  );
}

function SellerPageHeader({ eyebrow, title, text, children }) {
  return (
    <div className="seller-flow">
      <motion.header initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </motion.header>
      {children}
    </div>
  );
}
