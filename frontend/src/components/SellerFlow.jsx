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
  ExternalLink,
  ImagePlus,
  MapPin,
  Package,
  Plus,
  Power,
  Search,
  Share2,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Trash2,
  Wallet,
  UploadCloud,
  Truck,
  UserRoundCheck,
  X,
} from "lucide-react";
import ProfilePhotoManager from "./ProfilePhotoManager.jsx";
import MobileProfileActions from "./MobileProfileActions.jsx";
import AccountSecuritySettings from "./AccountSecuritySettings.jsx";
import { apiOrigin } from "../config/runtime.js";
import {
  getProductAttributeFields,
  parseProductAttributes,
} from "../config/productAttributes.js";
import { shopPublicPath } from "../utils/shopUrl.js";

const imageSource = (url) => (url?.startsWith("/uploads") ? `${apiOrigin}${url}` : url);

const sellerPaymentLabels = {
  pending: "Paiement attendu",
  proof_submitted: "Preuve recue",
  paid: "Paiement valide",
  failed: "Preuve refusee",
};

const sellerNextActionLabel = (order) => {
  if (!order?.payment_proof_url) return "Attendre la preuve";
  if (order.seller_payment_status === "failed") return "Attendre une nouvelle preuve";
  if (order.seller_payment_status !== "paid") return "Valider le paiement";
  if (order.seller_status === "confirmed") return "Commencer la preparation";
  if (order.seller_status === "preparing") return "Marquer prete";
  if (order.seller_status === "ready") {
    return order.seller_delivery_user_id ? "Suivre la livraison" : "Assigner un livreur";
  }
  if (order.seller_status === "completed") return "Commande finalisee";
  if (order.seller_status === "cancelled") return "Vente annulee";
  return "Ouvrir la commande";
};

const sellerNextActionDescription = (order) => {
  if (!order?.payment_proof_url) {
    return "Le client doit encore envoyer sa preuve de paiement MonCash.";
  }
  if (order.seller_payment_status === "failed") {
    return "Le client doit envoyer une nouvelle preuve avant toute preparation.";
  }
  if (order.seller_payment_status !== "paid") {
    return "Verifiez la reference et la preuve, puis confirmez uniquement le paiement recu.";
  }
  if (order.seller_status === "confirmed") {
    return "Le paiement est valide. Vous pouvez maintenant commencer la preparation des articles.";
  }
  if (order.seller_status === "preparing") {
    return "Terminez l'emballage, puis indiquez que la commande est prete pour la livraison.";
  }
  if (order.seller_status === "ready" && !order.seller_delivery_user_id) {
    return "Choisissez maintenant un livreur rattache a votre boutique.";
  }
  if (order.seller_status === "ready" && order.seller_delivery_user_id) {
    return "La mission est transmise au livreur. Suivez son avancement jusqu'a la signature du client.";
  }
  if (order.seller_status === "completed" || order.delivery_status === "delivered") {
    return "La reception a ete confirmee. Cette commande est maintenant classee parmi les commandes livrees.";
  }
  if (order.seller_status === "cancelled") {
    return "Cette vente est annulee et ne demande plus aucune action.";
  }
  return "Consultez les informations de la commande avant de poursuivre.";
};

const isDeliveredSellerOrder = (order) =>
  order?.seller_status === "completed" || order?.delivery_status === "delivered";

const sellerWorkflowClass = (done, active) => (done ? "done" : active ? "active" : "locked");

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

export function SellerProductsContent({ api }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () =>
    api
      .get("/seller/products")
      .then(({ data }) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setError("Impossible de charger vos produits pour le moment."));

  useEffect(() => {
    load();
    api
      .get("/categories")
      .then(({ data }) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!editing) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setEditing(null);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [editing]);

  const toggle = async (product) => {
    setError("");
    try {
      await api.patch(`/seller/products/${product.id}`, {
        status: product.status === "active" ? "inactive" : "active",
      });
      setMessage("Statut du produit mis a jour.");
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de modifier le statut du produit.");
    }
  };

  const visibleProducts = products.filter((product) => {
    const matchesQuery = (product.name || "").toLowerCase().includes(query.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      product.status === filter ||
      (filter === "low-stock" && Number(product.stock) <= 5);
    return matchesQuery && matchesFilter;
  });

  const saveEdit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const editedAttributes = parseProductAttributes(editing.attributes);
      await api.patch(`/seller/products/${editing.id}`, {
        name: editing.name,
        categoryId: Number(editing.category_id),
        price: Number(editing.price),
        promotionalPrice: editing.promotional_price ? Number(editing.promotional_price) : "",
        isFeatured: Boolean(editing.is_featured),
        offerEndsAt: editing.offer_ends_at || "",
        stock: Number(editing.stock),
        description: editing.description || "",
        department: editing.department || "",
        city: editing.city || "",
        attributes: Object.keys(editedAttributes).length ? editedAttributes : undefined,
      });
      setEditing(null);
      setMessage("Produit modifie avec succes.");
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de modifier le produit.");
    } finally {
      setSaving(false);
    }
  };

  const openEditor = (product) => {
    setError("");
    setMessage("");
    setAdding(false);
    setEditing({
      ...product,
      attributes: parseProductAttributes(product.attributes),
    });
  };

  const changeEditingCategory = (categoryId) => {
    const category = categories.find(
      (item) => String(item.id) === String(categoryId),
    );
    setEditing((current) => ({
      ...current,
      category_id: categoryId,
      category_name: category?.name || "",
      category_slug: category?.slug || "autres",
      attributes: {},
    }));
  };

  return (
    <SellerPageHeader
      eyebrow="Catalogue vendeur"
      title="Mes produits"
      text="Gerez vos produits, stocks et disponibilites."
    >
      {message && <div className="flow-success">{message}</div>}
      {error && <div className="flow-error">{error}</div>}
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
            setMessage("Produit ajoute avec succes.");
            load();
          }}
        />
      )}
      <div className="seller-product-grid">
        {visibleProducts.map((product) => (
          <motion.article className="product-card seller-catalog-product-card" whileHover={{ y: -5 }} key={product.id}>
            <Link className="product-media" to={`/products/${product.id}`}>
              <img src={imageSource(product.image_url)} alt={product.name} />
              {Boolean(product.is_featured) && product.promotional_price ? (
                <span className="vinnht-offer-badge" aria-label="Offre spéciale VinnHT">
                  <Sparkles size={13} />
                  Offre
                </span>
              ) : (
                <span className="seller-product-status-badge">{product.status}</span>
              )}
            </Link>
            <div className="product-body">
              <div className="product-meta">
                <span>{product.category_name || "Produit"}</span>
                <span>
                  <MapPin size={13} />
                  {product.city || "Haïti"}
                </span>
              </div>
              {Number(product.stock) <= 5 && (
                <span className="low-stock-badge">
                  <AlertTriangle />
                  {Number(product.stock) === 0
                    ? "Épuisé · invisible aux clients"
                    : "Stock faible"}
                </span>
              )}
              {Boolean(product.is_featured) && product.promotional_price && (
                <span className="flow-status confirmed">Offre speciale</span>
              )}
              <Link to={`/products/${product.id}`}>
                <h3>{product.name}</h3>
              </Link>
              <p>
                <ShieldCheck size={14} />
                Produit boutique - Stock : {product.stock}
              </p>
              <p className="seller-product-location">
                {product.department || "Departement"} - {product.city || "Ville non renseignee"}
              </p>
              <div className="product-bottom seller-product-price-row">
                <strong>
                  {Number(product.promotional_price || product.price).toLocaleString("fr-HT")} HTG
                </strong>
              </div>
            </div>
            <footer>
              <button
                type="button"
                title="Modifier"
                aria-label={`Modifier ${product.name}`}
                onClick={() => openEditor(product)}
              >
                <Edit3 />
                <span>Modifier</span>
              </button>
              <button type="button" onClick={() => toggle(product)}>
                <Power />
                {product.status === "active" ? "Desactiver" : "Activer"}
              </button>
            </footer>
          </motion.article>
        ))}
      </div>
      {editing && (
        <div
          className="seller-edit-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Modifier ${editing.name}`}
        >
          <button
            className="seller-edit-backdrop"
            type="button"
            aria-label="Fermer la modification"
            onClick={() => setEditing(null)}
          />
          <form className="seller-edit-panel" onSubmit={saveEdit}>
            <header>
              <div>
                <span>Fiche produit</span>
                <h2>Modifier {editing.name}</h2>
                <p>Les changements seront immédiatement appliqués au catalogue.</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} aria-label="Fermer">
                <X />
              </button>
            </header>

            {error && <div className="flow-error seller-edit-error">{error}</div>}

            <label>
              Nom du produit
              <input
                required
                minLength="2"
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
              />
            </label>
            <label>
              Rayon
              <select
                required
                value={editing.category_id || ""}
                onChange={(event) => changeEditingCategory(event.target.value)}
              >
                <option value="">Choisir un rayon</option>
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
                value={editing.price}
                onChange={(event) => setEditing({ ...editing, price: event.target.value })}
              />
            </label>
            <label>
              Stock
              <input
                required
                min="0"
                type="number"
                value={editing.stock}
                onChange={(event) => setEditing({ ...editing, stock: event.target.value })}
              />
              <small>
                Un stock à zéro masque automatiquement le produit côté client.
              </small>
            </label>
            <label>
              Département
              <select
                required
                value={editing.department || ""}
                onChange={(event) => setEditing({ ...editing, department: event.target.value })}
              >
                <option value="">Choisir un département</option>
                {haitiDepartments.map((department) => (
                  <option value={department} key={department}>{department}</option>
                ))}
              </select>
            </label>
            <label>
              Ville ou commune
              <input
                required
                value={editing.city || ""}
                onChange={(event) => setEditing({ ...editing, city: event.target.value })}
                placeholder="Ex. Port-au-Prince, Jacmel, Cap-Haïtien"
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
                rows="5"
                value={editing.description || ""}
                onChange={(event) => setEditing({ ...editing, description: event.target.value })}
              />
            </label>

            <section className="seller-edit-attributes">
              <div>
                <span>Caractéristiques du rayon</span>
                <p>Complétez les informations utiles aux clients.</p>
              </div>
              <div>
                {getProductAttributeFields(editing).map((field) => (
                  <ProductAttributeField
                    field={field}
                    value={editing.attributes?.[field.key] || ""}
                    onChange={(value) =>
                      setEditing({
                        ...editing,
                        attributes: {
                          ...(editing.attributes || {}),
                          [field.key]: value,
                        },
                      })
                    }
                    key={field.key}
                  />
                ))}
              </div>
            </section>

            <footer className="seller-edit-actions">
              <button type="button" onClick={() => setEditing(null)}>
                Annuler
              </button>
              <button type="submit" disabled={saving}>
                <Check />
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </footer>
          </form>
        </div>
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
    department: "Ouest",
    city: "",
  });
  const [attributes, setAttributes] = useState({});
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
      data.append("attributes", JSON.stringify(attributes));
      if (images[0]) data.append("images", images[0]);
      await api.post("/products", data);
      setMessage("Produit ajoute avec succes.");
      setForm({ name: "", categoryId: "", description: "", price: "", stock: "", department: "Ouest", city: "" });
      setAttributes({});
      setImages([]);
      setPreviews([]);
      onCreated?.();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible d'ajouter le produit.");
    }
  };

  const selectedCategory = categories.find(
    (category) => String(category.id) === String(form.categoryId),
  );
  const attributeFields = getProductAttributeFields(selectedCategory);

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
            <h2>Presentez votre produit comme une grande marque.</h2>
            <p>Des informations precises et de belles images inspirent confiance aux clients.</p>
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
              Categorie
              <select
                required
                value={form.categoryId}
                onChange={(event) => {
                  setForm({ ...form, categoryId: event.target.value });
                  setAttributes({});
                }}
              >
                <option value="">Choisir une categorie</option>
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
            title={
              selectedCategory
                ? `Détails du rayon ${selectedCategory.name}`
                : "Caractéristiques du produit"
            }
            text={
              selectedCategory
                ? "Ces informations sont adaptées à ce rayon et aideront les clients à comparer les offres."
                : "Choisissez d’abord un rayon pour afficher les informations adaptées."
            }
          >
            {attributeFields.length ? (
              attributeFields.map((field) => (
                <ProductAttributeField
                  field={field}
                  value={attributes[field.key] || ""}
                  onChange={(value) =>
                    setAttributes((current) => ({
                      ...current,
                      [field.key]: value,
                    }))
                  }
                  key={field.key}
                />
              ))
            ) : (
              <div className="seller-attribute-placeholder">
                <Package />
                <span>
                  <b>Sélectionnez un rayon</b>
                  <small>Le formulaire affichera ensuite les détails réellement utiles.</small>
                </span>
              </div>
            )}
          </ProductStudioSection>

          <ProductStudioSection
            number="03"
            title="Localisation de l'offre"
            text="Indiquez le departement et la ville depuis lesquels ce produit est disponible."
          >
            <label>
              Departement
              <select
                required
                value={form.department}
                onChange={(event) => setForm({ ...form, department: event.target.value })}
              >
                <option value="">Choisir un departement</option>
                {haitiDepartments.map((department) => (
                  <option value={department} key={department}>{department}</option>
                ))}
              </select>
            </label>
            <label>
              Ville ou commune
              <input
                required
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
                placeholder="Ex. Port-au-Prince, Gonaives, Jacmel"
              />
            </label>
          </ProductStudioSection>

          <ProductStudioSection
            number="04"
            title="Prix et disponibilite"
            text="Indiquez un prix clair et le stock reellement disponible."
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
              Quantite en stock
              <input
                required
                min="1"
                type="number"
                value={form.stock}
                onChange={(event) => setForm({ ...form, stock: event.target.value })}
                placeholder="1"
              />
              <small>Minimum 1 unité pour rendre le produit visible aux clients.</small>
            </label>
          </ProductStudioSection>

          <section className="seller-product-form-section">
            <header>
              <b>05</b>
              <div>
                <h3>Photos et description</h3>
                <p>Ajoutez une image principale nette pour presenter ce produit.</p>
              </div>
            </header>
            <label className="seller-images-upload seller-studio-upload">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setImages(file ? [file] : []);
                  setPreviews(file ? [URL.createObjectURL(file)] : []);
                }}
              />
              <span>
                <UploadCloud />
                <b>Choisir l'image principale</b>
                <small>JPG, PNG ou WebP - une seule image par produit</small>
              </span>
              {previews.length > 0 && (
                <div>
                  {previews.map((preview) => (
                    <img src={preview} alt="Image principale du produit" key={preview} />
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
                placeholder="Decrivez les caracteristiques, l'etat et les avantages du produit..."
              />
            </label>
          </section>

          <footer className="seller-product-studio-footer">
            <p>
              <ShieldCheck /> Vous pourrez modifier ou desactiver ce produit a tout moment.
            </p>
            <button>
              <Plus /> Publier le produit
            </button>
          </footer>
        </div>

        <aside className="seller-product-live-preview">
          <span>Apercu client</span>
          <div className="seller-preview-image">
            {previews[0] ? <img src={previews[0]} alt="Apercu principal" /> : <ImagePlus />}
          </div>
          <small>
            {categories.find((category) => String(category.id) === String(form.categoryId))?.name ||
              "Categorie"}
          </small>
          <h3>{form.name || "Nom de votre produit"}</h3>
          <strong>{Number(form.price || 0).toLocaleString("fr-HT")} HTG</strong>
          <p>{form.description || "La description de votre produit apparaitra ici."}</p>
          {attributeFields.slice(0, 3).map((field) =>
            attributes[field.key] ? (
              <p className="seller-preview-attribute" key={field.key}>
                <b>{field.label}</b>
                <span>{attributes[field.key]}</span>
              </p>
            ) : null
          )}
          <p className="seller-preview-location">{form.department || "Departement"} - {form.city || "Ville"}</p>
          <div>
            <CheckCircle2 /> Fiche prete a etre publiee
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
      text="Creez une fiche premium pour presenter votre produit aux clients."
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

function ProductAttributeField({ field, value, onChange }) {
  if (field.type === "select") {
    return (
      <label>
        {field.label}
        <select
          required={field.required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Choisir</option>
          {field.options.map((option) => (
            <option value={option} key={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label>
      {field.label}
      <input
        required={field.required}
        type={field.type || "text"}
        min={field.min}
        value={value}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
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
    department: "Ouest",
    city: "",
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
      setMessage("Produit ajoute avec succes.");
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
      setError(requestError.response?.data?.message || "Impossible d'ajouter le produit.");
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
          Categorie
          <select
            required
            value={form.categoryId}
            onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
          >
            <option value="">Choisir une categorie</option>
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
            <ImagePlus /> Choisir jusqu'a 5 images
          </span>
          {previews.length > 0 && (
            <div>
              {previews.map((preview) => (
                <img src={preview} alt="Apercu produit" key={preview} />
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
      text="Creez une fiche claire pour presenter votre produit aux clients."
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
  const recentSales = data?.recentSales || [];
  const cards = [
    [Package, "Produits actifs", stats.active_products || 0, "Votre catalogue en ligne"],
    [AlertTriangle, "Stocks faibles", stats.low_stock_products || 0, "Produits a reapprovisionner"],
    [Clock3, "A preparer", stats.awaiting_preparation || 0, "Commandes payees a traiter"],
    [CheckCircle2, "Pretes", stats.ready_orders || 0, "En attente de livraison"],
  ];

  return (
    <SellerPageHeader
      eyebrow="Centre de pilotage"
      title={`Bonjour, ${user.name}`}
      text="Pilotez votre boutique, preparez vos commandes et suivez vos performances."
    >
      <section className="seller-dashboard-hero">
        <div>
          <span>Performance de votre boutique</span>
          <h2>{money(stats.net_sales)}</h2>
          <p>Revenu net estime apres commission, sans fonction de retrait configuree.</p>
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
            <span>Activite recente</span>
            <h2>Dernieres ventes</h2>
          </div>
          <TrendingUp />
        </header>
        <div className="seller-finance-list">
          {recentSales.map((sale) => (
            <article key={sale.id}>
              <div>
                <strong>{sale.order_number}</strong>
                <small>{shortDate(sale.created_at)}</small>
              </div>
              <b>{money(sale.net_amount)}</b>
              <span className={`flow-status ${sale.status}`}>{sale.status}</span>
            </article>
          ))}
          {data ? (!recentSales.length && <p>Aucune vente pour le moment.</p>) : <p>Chargement des ventes...</p>}
        </div>
      </section>
    </SellerPageHeader>
  );
}

export function SellerOrdersContent({ api }) {
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [assigningDriverId, setAssigningDriverId] = useState("");
  const [showPaymentProof, setShowPaymentProof] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [driverForm, setDriverForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    zones: "",
    vehicleType: "",
  });

  const load = async () => {
    const [{ data: orderRows }, { data: driverRows }] = await Promise.all([
      api.get("/seller/orders"),
      api.get("/seller/delivery-drivers"),
    ]);
    setOrders(orderRows);
    setDrivers(driverRows);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setAssigningDriverId(selected?.seller_delivery_user_id || "");
    setShowPaymentProof(false);
    setRejectReason("");
  }, [selected]);

  useEffect(() => {
    if (!selected) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelected(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selected]);

  const updateStatus = async (saleId, status) => {
    const { data } = await api.patch(`/seller/sales/${saleId}/status`, { status });
    setMessage(data.message);
    setSelected((current) =>
      current?.sale_id === saleId
        ? {
            ...current,
            seller_status: status,
          }
        : current
    );
    load();
  };

  const createDriver = async (event) => {
    event.preventDefault();
    const { data } = await api.post("/seller/delivery-drivers", driverForm);
    setMessage(data.message);
    setDriverForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      zones: "",
      vehicleType: "",
    });
    setShowDriverForm(false);
    load();
  };

  const validatePayment = async (saleId) => {
    const { data } = await api.patch(`/seller/sales/${saleId}/payment/validate`);
    setMessage(data.message);
    setSelected((current) =>
      current?.sale_id === saleId
        ? {
            ...current,
            seller_payment_status: data.sellerPaymentStatus,
            payment_status: data.paymentStatus,
            seller_status: current.seller_status === "pending" ? "confirmed" : current.seller_status,
            payment_validated_at: new Date().toISOString(),
            payment_rejection_reason: null,
            payment_rejected_at: null,
          }
        : current
    );
    load();
  };

  const rejectPayment = async (saleId) => {
    const reason = rejectReason.trim();
    if (reason.length < 8) {
      setMessage("Expliquez le motif du refus en au moins 8 caracteres.");
      return;
    }
    const { data } = await api.patch(`/seller/sales/${saleId}/payment/reject`, { reason });
    setMessage(data.message);
    setSelected((current) =>
      current?.sale_id === saleId
        ? {
            ...current,
            seller_payment_status: data.sellerPaymentStatus,
            payment_rejection_reason: data.rejectionReason,
            payment_rejected_at: new Date().toISOString(),
          }
        : current
    );
    setRejectReason("");
    load();
  };

  const assignDriver = async () => {
    if (!selected || !assigningDriverId) return;
    const { data } = await api.patch(`/seller/sales/${selected.sale_id}/assign-driver`, {
      deliveryUserId: Number(assigningDriverId),
    });
    setMessage(data.message);
    const assignedDriver = drivers.find((driver) => Number(driver.id) === Number(assigningDriverId));
    setSelected({
      ...selected,
      seller_delivery_user_id: Number(assigningDriverId),
      seller_delivery_name: assignedDriver?.name || selected.seller_delivery_name,
      seller_delivery_phone: assignedDriver?.phone || selected.seller_delivery_phone,
      seller_delivery_status: "assigned",
    });
    load();
  };

  const visible = orders.filter((order) => {
    const delivered = isDeliveredSellerOrder(order);

    if (filter === "all") return !delivered;
    if (filter === "completed") return delivered;

    return !delivered && order.seller_status === filter;
  });
  const selectedPaymentStatus = selected?.seller_payment_status || "pending";
  const selectedPaymentIsValid = selectedPaymentStatus === "paid";
  const selectedCanValidatePayment = Boolean(
    selected?.payment_proof_url && selectedPaymentStatus === "proof_submitted"
  );
  const selectedCanRejectPayment = selectedCanValidatePayment;

  return (
    <SellerPageHeader
      eyebrow="Operations boutique"
      title="Commandes recues"
      text="Preparez uniquement les produits vendus par votre boutique."
    >
      {message && <div className="flow-success">{message}</div>}
      <div className="seller-catalog-toolbar seller-orders-toolbar">
        <div>
          {[
            ["all", "Commandes actives"],
            ["pending", "Paiement en attente"],
            ["confirmed", "A preparer"],
            ["preparing", "En preparation"],
            ["ready", "Pretes"],
            ["completed", "Livrees"],
            ["cancelled", "Annulees"],
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
        <button
          type="button"
          className="seller-small-action"
          onClick={() => setShowDriverForm((current) => !current)}
        >
          {showDriverForm ? <X /> : <Plus />}
          {showDriverForm ? "Fermer" : "Ajouter un livreur"}
        </button>
      </div>
      {showDriverForm && (
        <form className="seller-driver-form seller-driver-form-compact" onSubmit={createDriver}>
          <input
            value={driverForm.name}
            onChange={(event) => setDriverForm({ ...driverForm, name: event.target.value })}
            placeholder="Nom complet"
            required
          />
          <input
            value={driverForm.email}
            onChange={(event) => setDriverForm({ ...driverForm, email: event.target.value })}
            placeholder="Email livreur"
            type="email"
            required
          />
          <input
            value={driverForm.phone}
            onChange={(event) => setDriverForm({ ...driverForm, phone: event.target.value })}
            placeholder="Telephone"
          />
          <input
            value={driverForm.password}
            onChange={(event) => setDriverForm({ ...driverForm, password: event.target.value })}
            placeholder="Mot de passe temporaire"
            type="password"
            minLength={8}
            required
          />
          <input
            value={driverForm.zones}
            onChange={(event) => setDriverForm({ ...driverForm, zones: event.target.value })}
            placeholder="Zones couvertes"
          />
          <input
            value={driverForm.vehicleType}
            onChange={(event) => setDriverForm({ ...driverForm, vehicleType: event.target.value })}
            placeholder="Moto, voiture, camion..."
          />
          <button type="submit">
            <Plus /> Enregistrer le livreur
          </button>
        </form>
      )}
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
              <div className="seller-order-status-stack">
                <span className={`flow-status ${order.seller_status}`}>{order.seller_status}</span>
                <span className={`flow-status ${order.seller_payment_status || "pending"}`}>
                  {sellerPaymentLabels[order.seller_payment_status] || "Paiement attendu"}
                </span>
              </div>
            </header>
            <div className="seller-order-items">
              {(order.items || []).map((item) => (
                <div key={item.product_id}>
                  <img src={imageSource(item.image_url)} alt={item.name} />
                  <span>
                    <strong>{item.name}</strong>
                    <small>Quantite : {item.quantity}</small>
                  </span>
                  <b>{money(item.subtotal)}</b>
                </div>
              ))}
            </div>
            <div className="seller-order-next-step">
              <small>Etape suivante</small>
              <strong>{sellerNextActionLabel(order)}</strong>
            </div>
            <footer>
              <strong>{money(order.gross_amount)}</strong>
              <button onClick={() => setSelected(order)}>
                <Eye /> {sellerNextActionLabel(order)}
              </button>
            </footer>
          </motion.article>
        ))}
        {!visible.length && <div className="seller-empty-state">Aucune commande ici.</div>}
      </section>
      {selected && (
        <div
          className="seller-order-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
        <motion.section
          className="seller-order-detail seller-order-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="seller-order-modal-title"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <header>
            <div>
              <span>Detail commande</span>
              <h2 id="seller-order-modal-title">{selected.order_number}</h2>
            </div>
            <button type="button" onClick={() => setSelected(null)} aria-label="Fermer le detail">
              <X />
            </button>
          </header>
          <div className="seller-order-modal-content">
          <section className="seller-modal-next-action">
            <span><Sparkles /></span>
            <div>
              <small>Prochaine etape</small>
              <strong>{sellerNextActionLabel(selected)}</strong>
              <p>{sellerNextActionDescription(selected)}</p>
            </div>
          </section>
          <section className="seller-order-workflow">
            {[
              [
                "Paiement",
                sellerPaymentLabels[selectedPaymentStatus] || selectedPaymentStatus,
                selectedPaymentIsValid,
                selectedCanValidatePayment || !selected.payment_proof_url || selectedPaymentStatus === "failed",
              ],
              [
                "Preparation",
                selected.seller_status === "preparing"
                  ? "En cours"
                  : ["ready", "completed"].includes(selected.seller_status)
                    ? "Terminee"
                    : "A lancer",
                ["preparing", "ready", "completed"].includes(selected.seller_status),
                selectedPaymentIsValid && selected.seller_status === "confirmed",
              ],
              [
                "Livreur",
                selected.seller_delivery_name || "A assigner",
                Boolean(selected.seller_delivery_user_id),
                selectedPaymentIsValid && selected.seller_status === "ready" && !selected.seller_delivery_user_id,
              ],
              [
                "Livraison",
                selected.seller_delivery_status || selected.delivery_status || "En attente",
                selected.seller_status === "completed" || selected.delivery_status === "delivered",
                selected.seller_delivery_user_id && selected.seller_status === "ready",
              ],
            ].map(([title, note, done, active]) => (
              <article className={sellerWorkflowClass(done, active)} key={title}>
                <span>{done ? <CheckCircle2 /> : active ? <Clock3 /> : <ShieldCheck />}</span>
                <div>
                  <small>{title}</small>
                  <strong>{note}</strong>
                </div>
              </article>
            ))}
          </section>
          <div className="seller-order-information">
            <article>
              <small>Client</small>
              <strong>{selected.client_name}</strong>
              <span>{selected.client_phone || "Telephone non renseigne"}</span>
            </article>
            <article>
              <small>Livraison</small>
              <strong>{selected.delivery_address}</strong>
            </article>
            <article>
              <small>Paiement vendeur</small>
              <strong>{sellerPaymentLabels[selectedPaymentStatus] || selectedPaymentStatus}</strong>
              <span>Global : {selected.payment_status || "pending"}</span>
            </article>
            <article>
              <small>Livreur boutique</small>
              <strong>{selected.seller_delivery_name || "Non assigné"}</strong>
              <span>
                {selected.seller_delivery_phone || selected.seller_delivery_status || "Aucune mission boutique"}
              </span>
            </article>
            {(selected.seller_status === "completed" ||
              selected.seller_delivery_status === "delivered" ||
              selected.delivery_status === "delivered") && (
              <article className="seller-delivery-confirmed">
                <small>Preuve de reception</small>
                <strong>Commande finalisee</strong>
                <span>
                  Signee par {selected.seller_delivery_signer_name || selected.delivery_signer_name || "le client"}
                  {selected.seller_delivery_confirmed_at || selected.delivery_confirmed_at
                     ? ` le ${shortDate(selected.seller_delivery_confirmed_at || selected.delivery_confirmed_at)}`
                    : ""}
                </span>
              </article>
            )}
          </div>
          {selected.payment_proof_url && (
            <section className="seller-payment-proof-card">
              <div>
                <small>Preuve MonCash recue</small>
                <strong>{sellerPaymentLabels[selectedPaymentStatus] || selectedPaymentStatus}</strong>
                <p>
                  Reference : {selected.payment_reference || "Non renseignee"}
                  {selected.payment_submitted_at ? ` - ${shortDate(selected.payment_submitted_at)}` : ""}
                </p>
                {selected.payment_proof_note && <p>Note client : {selected.payment_proof_note}</p>}
              </div>
              <button type="button" className="seller-proof-toggle" onClick={() => setShowPaymentProof((current) => !current)}>
                <Eye /> {showPaymentProof ? "Masquer la preuve" : "Voir la preuve"}
              </button>
              {showPaymentProof && (
                <div className="seller-payment-proof-preview">
                  <img src={imageSource(selected.payment_proof_url)} alt="Preuve de paiement MonCash" />
                </div>
              )}
              {selected.payment_rejection_reason && (
                <div className="seller-payment-rejection-note">
                  <AlertTriangle />
                  <span>
                    <b>Preuve refusee</b>
                    {selected.payment_rejection_reason}
                  </span>
                </div>
              )}
              {selectedCanValidatePayment && (
                <button type="button" onClick={() => validatePayment(selected.sale_id)}>
                  <CheckCircle2 /> Valider le paiement
                </button>
              )}
              {selectedCanRejectPayment && (
                <div className="seller-payment-reject-box">
                  <label>
                    Motif si la preuve est incorrecte
                    <textarea
                      rows="3"
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                      placeholder="Ex. montant incomplet, numero MonCash incorrect, capture illisible..."
                    />
                  </label>
                  <button
                    type="button"
                    className="reject"
                    onClick={() => rejectPayment(selected.sale_id)}
                    disabled={rejectReason.trim().length < 8}
                  >
                    <X /> Refuser la preuve
                  </button>
                </div>
              )}
              {selectedPaymentIsValid && (
                <span className="seller-payment-validated">
                  <ShieldCheck /> Paiement valide par votre boutique
                </span>
              )}
            </section>
          )}
          {!selected.payment_proof_url && (
            <section className="seller-payment-proof-card muted">
              <div>
                <small>Preuve MonCash</small>
                <strong>En attente du client</strong>
                <p>Cette commande ne peut pas etre preparee avant reception et validation de la preuve.</p>
              </div>
            </section>
          )}
          {selectedPaymentIsValid && ["confirmed", "preparing", "ready"].includes(selected.seller_status) && (
            <section className="seller-command-center">
              <div>
                <small>Action vendeur</small>
                <strong>{sellerNextActionLabel(selected)}</strong>
                <p>
                  Suivez l'ordre : paiement valide, preparation, commande prete, puis assignation au livreur.
                </p>
              </div>
              {["confirmed", "preparing"].includes(selected.seller_status) && (
                <button
                  type="button"
                  onClick={() =>
                    updateStatus(
                      selected.sale_id,
                      selected.seller_status === "confirmed" ? "preparing" : "ready"
                    )
                  }
                >
                  <CheckCircle2 />
                  {selected.seller_status === "confirmed"
                    ? "Commencer la preparation"
                    : "Marquer prete pour livraison"}
                </button>
              )}
            </section>
          )}
          {selectedPaymentIsValid && selected.seller_status === "ready" && (
            <section className="seller-driver-assignment">
              <div>
                <small>Assigner la livraison</small>
                <strong>Choisir un livreur de votre boutique</strong>
                <p>
                  Le livreur verra cette mission dans son espace livreur et devra faire signer le client.
                </p>
              </div>
              <select
                value={assigningDriverId}
                onChange={(event) => setAssigningDriverId(event.target.value)}
              >
                <option value="">Sélectionner un livreur</option>
                {drivers.map((driver) => (
                  <option value={driver.id} key={driver.id}>
                    {driver.name} {driver.vehicle_type ? `- ${driver.vehicle_type}` : ""}
                  </option>
                ))}
              </select>
              {drivers.length ? (
                <button type="button" onClick={assignDriver} disabled={!assigningDriverId}>
                  <Truck /> Assigner au livreur
                </button>
              ) : (
                <button type="button" onClick={() => setShowDriverForm(true)}>
                  <Plus /> Ajouter un livreur
                </button>
              )}
            </section>
          )}
          {["confirmed", "preparing"].includes(selected.seller_status) &&
            selectedPaymentIsValid && (
              <footer>
                <button onClick={() => updateStatus(selected.sale_id, "cancelled")}>
                  <X /> Annuler ma vente
                </button>
              </footer>
            )}
          </div>
        </motion.section>
        </div>
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
          <small>Revenu net estime</small>
          <h2>{money(totals.net)}</h2>
          <p>Montant cumule apres deduction des commissions VinnHT.</p>
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
      text="Consultez vos ventes et revenus estimes. Les retraits seront definis ulterieurement."
    >
      <section className="seller-payout-banner">
        <span>
          <Wallet />
        </span>
        <div>
          <small>Revenu net estime</small>
          <h2>{money(netTotal)}</h2>
          <p>Aucune demande de retrait ni methode de paiement n'est configuree.</p>
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
  const [shareFeedback, setShareFeedback] = useState("");
  const cropImageRef = useRef(null);

  useEffect(() => {
    api.get("/seller/shop").then(({ data }) => {
      setShop({
        sellerId: data.seller_id,
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
      setMessage("Logo recadre. Enregistrez la boutique pour appliquer la modification.");
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
    setShop((currentShop) => ({
      ...currentShop,
      sellerId: response.shop.seller_id || currentShop.sellerId,
      shopLogoUrl: response.shop.shop_logo_url || currentShop.shopLogoUrl,
    }));
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

  const publicPath = shopPublicPath(shop);
  const publicUrl = publicPath ? `${window.location.origin}${publicPath}` : "";

  const shareShop = async () => {
    if (!publicUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: shop.shopName || "Boutique VinnHT",
          text: `Découvrez ${shop.shopName || "ma boutique"} sur VinnHT.`,
          url: publicUrl,
        });
        setShareFeedback("Boutique partagée");
      } else {
        await navigator.clipboard.writeText(publicUrl);
        setShareFeedback("Lien copié");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        setShareFeedback("Partage indisponible");
      }
    }

    window.setTimeout(() => setShareFeedback(""), 2200);
  };

  return (
    <SellerPageHeader
      eyebrow="Identite commerciale"
      title="Ma boutique"
      text="Presentez une boutique claire et professionnelle aux clients VinnHT."
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
            <p>{shop.description || "Ajoutez une description pour presenter votre activite."}</p>
            <b className={`flow-status ${shop.status}`}>{shop.status}</b>
          </div>
          {publicPath && (
            <section className="seller-shop-public-link">
              <small>Adresse publique de votre boutique</small>
              <strong title={publicUrl}>{publicUrl}</strong>
              <div>
                <Link to={publicPath} target="_blank" rel="noreferrer">
                  <ExternalLink />
                  Voir ma boutique
                </Link>
                <button type="button" onClick={shareShop}>
                  <Share2 />
                  {shareFeedback || "Partager"}
                </button>
              </div>
            </section>
          )}
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
            Visibilite boutique
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
            Adresse de recuperation
            <input
              value={shop.pickupAddress}
              onChange={(event) => setShop({ ...shop, pickupAddress: event.target.value })}
            />
          </label>
          <label>
            Horaires d'ouverture
            <input
              placeholder="Ex. Lun-Sam, 8h00-18h00"
              value={shop.openingHours}
              onChange={(event) => setShop({ ...shop, openingHours: event.target.value })}
            />
          </label>
          <label>
            Zones desservies
            <input
              placeholder="Ex. Petion-Ville, Delmas, Tabarre"
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
                alt="Logo a recadrer"
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
                {busyLogo ? "Preparation..." : "Utiliser ce logo"}
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
      setMessage(error.response?.data?.message || "Impossible de mettre le profil a jour.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SellerPageHeader
      eyebrow="Identite du vendeur"
      title="Mon profil"
      text="Ajoutez une photo claire pour rassurer les clients qui echangent avec votre boutique."
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
            <span>Vendeur verifie</span>
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
            Telephone
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
      <MobileProfileActions onLogout={onLogout} settingsPath="/seller/settings" />
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
      setMessage(error.response?.data?.message || "Impossible d'enregistrer ce parametre.");
    }
  };

  return (
    <SellerPageHeader
      eyebrow="Preferences vendeur"
      title="Parametres"
      text="Choisissez les alertes utiles pour piloter votre boutique."
    >
      <section className="seller-settings-grid">
        {[
          [
            Package,
            "Nouvelles commandes",
            "Alerte des qu'un client paie une commande.",
            "newOrders",
          ],
          [
            AlertTriangle,
            "Stock faible",
            "Alerte lorsqu'un produit atteint cinq unites.",
            "lowStock",
          ],
          [
            CheckCircle2,
            "Commandes pretes",
            "Alerte lorsqu'une commande doit etre remise au livreur.",
            "readyOrders",
          ],
          [
            BarChart3,
            "Rapport hebdomadaire",
            "Recevoir un resume des performances.",
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
          <p>Ces choix contrôlent les alertes affichées dans votre espace vendeur VinnHT.</p>
        </div>
      </section>
      <AccountSecuritySettings api={api} onMessage={setMessage} />
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
      {!rows.length && <div className="seller-empty-state">Aucune donnee disponible.</div>}
    </div>
  );
}

export function SupervisorRequestsContent({ api }) {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const load = () =>
    api
      .get("/admin/seller-requests", {
        params: {
          q: query.trim() || undefined,
          status: status === "all" ? undefined : status,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page: pagination.page,
          limit: 12,
        },
      })
      .then(({ data }) => {
        setRequests(data.items || []);
        setSummary(data.summary || {});
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
      })
      .catch((requestError) =>
        setError(requestError.response?.data?.message || "Impossible de charger les demandes.")
      );

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [query, status, dateFrom, dateTo, pagination.page]);

  const resetPage = (setter) => (event) => {
    setter(event.target.value);
    setPagination((current) => ({ ...current, page: 1 }));
  };

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
      {message && <div className="flow-success">{message}</div>}
      {error && <div className="flow-error">{error}</div>}
      <section className="manager-request-summary">
        {[
          [Clock3, "En attente", summary.pending],
          [CheckCircle2, "Approuvées", summary.approved],
          [X, "Refusées", summary.rejected],
          [Store, "Total", Object.values(summary).reduce((total, value) => total + Number(value || 0), 0)],
        ].map(([Icon, label, value]) => (
          <article key={label}><Icon /><span><small>{label}</small><b>{Number(value || 0)}</b></span></article>
        ))}
      </section>
      <section className="manager-request-filters">
        <label className="seller-search-field">
          <Search />
          <input value={query} onChange={resetPage(setQuery)} placeholder="Nom, boutique, email, téléphone ou numéro" />
        </label>
        <select value={status} onChange={resetPage(setStatus)}>
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvées</option>
          <option value="rejected">Refusées</option>
        </select>
        <input type="date" value={dateFrom} onChange={resetPage(setDateFrom)} aria-label="Date de début" />
        <input type="date" value={dateTo} onChange={resetPage(setDateTo)} aria-label="Date de fin" />
      </section>
      <div className="manager-request-count">{pagination.total} demande(s) trouvée(s)</div>
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
                {request.name} - {request.email}
              </small>
              <h3>{request.business_name}</h3>
              <p>{details(request).shopDescription || "Aucune description fournie."}</p>
              <small>Soumise le {new Date(request.created_at).toLocaleDateString("fr-HT")}</small>
              {request.reviewed_at && (
                <small>Décision : {request.reviewer_name || "Manager VinnHT"} · {new Date(request.reviewed_at).toLocaleDateString("fr-HT")}</small>
              )}
            </div>
            <b className={`flow-status ${request.status}`}>{request.status}</b>
            <footer>
              <Link className="request-details-button" to={`/manager/seller-requests/${request.id}`}>
                <Eye /> Ouvrir le dossier de verification
              </Link>
            </footer>
          </article>
        ))}
      </div>
      {!requests.length && <div className="seller-empty-state">Aucune demande ne correspond aux filtres.</div>}
      {pagination.pages > 1 && (
        <nav className="manager-pagination">
          <button disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}>
            Précédent
          </button>
          <span>Page {pagination.page} sur {pagination.pages}</span>
          <button disabled={pagination.page >= pagination.pages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}>
            Suivant
          </button>
        </nav>
      )}
    </SellerPageHeader>
  );
}

const requestFieldLabels = {
  fullName: "Nom complet declare",
  birthDate: "Date de naissance",
  primaryPhone: "Telephone principal",
  secondaryPhone: "Telephone secondaire",
  email: "Adresse email declaree",
  fullAddress: "Adresse complete",
  city: "Ville",
  department: "Departement",
  activityStatus: "Situation actuelle",
  institutionName: "Ecole, universite, entreprise ou etablissement",
  activityDetails: "Fonction, niveau ou precision",
  shopName: "Nom de la boutique",
  shopDescription: "Description de la boutique",
  pickupAddress: "Adresse de recuperation",
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
    const action = status === "approved" ? "approuver" : "refuser";
    if (!window.confirm(`Confirmer : ${action} la demande de ${request.business_name} ?`)) return;
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
  const shopFields = ["shopName", "shopDescription", "pickupAddress"];
  const completenessFields = [...identityFields.filter((field) => field !== "secondaryPhone"), ...activityFields.slice(0, 2), ...shopFields];
  const completed = completenessFields.filter((field) => details[field]).length;
  const completeness = Math.round((completed / completenessFields.length) * 100);

  const FieldGroup = ({ title, icon: Icon, fields }) => (
    <section className="seller-verification-panel">
      <header><Icon /><div><small>Informations declarees</small><h2>{title}</h2></div></header>
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
      <Link className="seller-verification-back" to="/manager/seller-requests">{"<-"} Retour aux demandes</Link>
      <header className="seller-verification-hero">
        <div className="seller-verification-identity">
          <span>
            {request.profile_image_url ? <img src={imageSource(request.profile_image_url)} alt={request.name} /> : <UserRoundCheck />}
          </span>
          <div>
            <small>Dossier vendeur #{request.id}</small>
            <h1>{request.name}</h1>
            <p>{request.email} - {request.phone || "Telephone non renseigne"}</p>
          </div>
        </div>
        <div className="seller-verification-status">
          <b className={`flow-status ${request.status}`}>{request.status}</b>
          <small>Soumise le {new Date(request.created_at).toLocaleDateString("fr-HT")}</small>
        </div>
      </header>

      {message && <div className="flow-success">{message}</div>}

      <section className="seller-verification-summary">
        <article><ShieldCheck /><span><small>Completude du dossier</small><b>{completeness}%</b></span></article>
        <article><Store /><span><small>Boutique demandee</small><b>{request.business_name}</b></span></article>
        <article><UserRoundCheck /><span><small>Compte VinnHT</small><b>{request.account_status}</b></span></article>
        <article><CalendarDays /><span><small>Compte cree</small><b>{new Date(request.account_created_at).toLocaleDateString("fr-HT")}</b></span></article>
      </section>

      <div className="seller-verification-columns">
        <main>
          <FieldGroup title="Identite et coordonnees" icon={UserRoundCheck} fields={identityFields} />
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
            <small>Boutique proposee</small>
            <h2>{request.business_name}</h2>
            <p>Boutique multirayons VinnHT</p>
          </section>
          <section className="seller-verification-checklist">
            <h2>Points de controle</h2>
            {[
              ["Identite coherente", Boolean(details.fullName && request.name)],
              ["Coordonnees disponibles", Boolean(request.email && request.phone)],
              ["Situation actuelle precisee", Boolean(details.activityStatus && details.institutionName)],
              ["Projet commercial decrit", Boolean(details.shopDescription)],
              ["Adresse de recuperation", Boolean(details.pickupAddress)],
              [
                request.terms_accepted_at
                  ? `Conditions ${request.terms_version} acceptees le ${new Date(request.terms_accepted_at).toLocaleDateString("fr-HT")}`
                  : "Conditions vendeur acceptees",
                Boolean(request.terms_accepted_at && request.terms_version),
              ],
            ].map(([label, valid]) => <p className={valid ? "valid" : "missing"} key={label}><span>{valid ? "OK" : "!"}</span>{label}</p>)}
          </section>
          {request.reviewed_at && (
            <section className="seller-verification-history">
              <small>Derniere decision</small>
              <b>{request.status}</b>
              <p>{request.reviewer_name || "Manager VinnHT"} - {new Date(request.reviewed_at).toLocaleDateString("fr-HT")}</p>
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
          <header><div><span>Decision motivee</span><h2>Refuser {request.business_name}</h2></div><button onClick={() => setRejecting(false)}><X /></button></header>
          <label>Motif obligatoire<textarea rows="5" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Expliquez precisement les informations a corriger." /></label>
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
        description: `Categorie: ${form.category}\nTelephone: ${form.phone}\n${form.description}`,
      });
      setMessage("Votre demande vendeur a ete envoyee.");
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible d'envoyer la demande.");
    }
  };

  return (
    <SellerPageHeader
      eyebrow="Evolution vendeur"
      title="Devenir vendeur"
      text="Presentez votre activite et commencez a vendre partout en Haiti."
    >
      <div className="seller-request-onboarding">
        <article>
          <span>
            <Store />
          </span>
          <h2>Transformez votre activite avec VinnHT</h2>
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
            Categorie
            <input
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </label>
          <label>
            Telephone WhatsApp
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
