import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ProfilePhotoManager from "./ProfilePhotoManager.jsx";
import ProfileLogoutCard from "./ProfileLogoutCard.jsx";
import { apiOrigin } from "../config/runtime.js";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
  Package,
  Phone,
  RefreshCw,
  ShieldCheck,
  Store,
  Truck,
  UserRound,
  Camera,
  FileSignature,
  MessageCircle,
  Search,
  XCircle,
} from "lucide-react";

const money = (value) => `${Number(value || 0).toLocaleString("fr-HT")} HTG`;
const imageSource = (url) =>
  url?.startsWith("/uploads") ? `${apiOrigin}${url}` : url;
const date = (value) =>
  value ? new Intl.DateTimeFormat("fr-HT", { dateStyle: "medium" }).format(new Date(value)) : "—";

const statusLabels = {
  assigned: "Assignée",
  picked_up: "Récupérée",
  in_transit: "En livraison",
  delivered: "Livrée",
  failed: "Échec",
  unassigned: "Non assignée",
};
const journeySteps = [
  ["assigned", "Contacter le client"],
  ["picked_up", "Récupération confirmée"],
  ["in_transit", "Livraison en cours"],
  ["delivered", "Preuve signée"],
];
const whatsappNumber = (value = "") => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 8 ? `509${digits}` : digits;
};

const deliveryGuides = {
  assigned: {
    title: "Contactez le client et la boutique",
    text: "Confirmez la disponibilité du client avant de récupérer et vérifier les articles.",
    action: "Contacter puis récupérer",
    icon: Phone,
  },
  picked_up: {
    title: "Prévenez le client",
    text: "Contactez le client avant de partir, puis démarrez officiellement la livraison.",
    action: "Commencer la livraison",
    icon: Phone,
  },
  in_transit: {
    title: "Remettez la commande au client",
    text: "À l’arrivée, demandez au client de vérifier puis de signer la réception.",
    action: "Faire signer le client",
    icon: FileSignature,
  },
  delivered: {
    title: "Livraison terminée",
    text: "La preuve de réception a été enregistrée et la mission est maintenant archivée.",
    action: "Consulter la preuve",
    icon: CheckCircle2,
  },
  failed: {
    title: "Mission signalée en échec",
    text: "Cette mission est archivée. Consultez son détail dans l’historique.",
    action: "Consulter l’historique",
    icon: XCircle,
  },
};

function SignaturePad({ clientName, onConfirm, busy }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [signerName, setSignerName] = useState(clientName || "");
  const [notes, setNotes] = useState("");
  const [hasSignature, setHasSignature] = useState(false);

  const point = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const source = event.touches?.[0] || event;
    return {
      x: ((source.clientX - rect.left) / rect.width) * canvas.width,
      y: ((source.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (event) => {
    event.preventDefault();
    drawing.current = true;
    const context = canvasRef.current.getContext("2d");
    const current = point(event);
    context.beginPath();
    context.moveTo(current.x, current.y);
  };

  const move = (event) => {
    if (!drawing.current) return;
    event.preventDefault();
    const context = canvasRef.current.getContext("2d");
    const current = point(event);
    context.lineWidth = 4;
    context.lineCap = "round";
    context.strokeStyle = "#0f172a";
    context.lineTo(current.x, current.y);
    context.stroke();
    setHasSignature(true);
  };

  const stop = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  return (
    <section className="delivery-signature-panel">
      <header>
        <FileSignature />
        <div>
          <span>Confirmation du client</span>
          <h3>Signature de réception</h3>
          <p>Le client signe ici pour confirmer que la commande a bien été reçue.</p>
        </div>
      </header>
      <label>
        Nom de la personne qui reçoit
        <input
          required
          value={signerName}
          onChange={(event) => setSignerName(event.target.value)}
        />
      </label>
      <canvas
        ref={canvasRef}
        width="900"
        height="340"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={stop}
      />
      <label>
        Note de livraison
        <textarea
          rows="3"
          placeholder="Ex. Reçue en bon état par le client."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>
      <footer>
        <button type="button" className="secondary" onClick={clear}>
          Effacer la signature
        </button>
        <button
          type="button"
          disabled={!hasSignature || signerName.trim().length < 2 || busy}
          onClick={() =>
            onConfirm({
              signerName: signerName.trim(),
              signatureData: canvasRef.current.toDataURL("image/png"),
              notes,
            })
          }
        >
          <CheckCircle2 />
          {busy ? "Finalisation..." : "Confirmer la réception"}
        </button>
      </footer>
    </section>
  );
}

function DeliveryFrame({ eyebrow, title, text, children }) {
  return (
    <section className="delivery-flow">
      <header className="delivery-page-header">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </header>
      {children}
    </section>
  );
}

function MissionCard({ mission, onSelect }) {
  const guide = deliveryGuides[mission.status] || deliveryGuides.assigned;
  const actionLabel =
    mission.status === "delivered" && !mission.proof_confirmed_at
      ? "Voir le détail"
      : guide.action;

  return (
    <motion.article className="delivery-mission-card" whileHover={{ y: -4 }}>
      <header>
        <span className={`delivery-status ${mission.status}`}>{statusLabels[mission.status]}</span>
        <small>{mission.order_number}</small>
      </header>
      <div className="delivery-route">
        <span>
          <Store />
        </span>
        <p>
          <small>Récupération</small>
          <b>{mission.pickup_shops || "Boutique VinnHT"}</b>
          <em>{mission.pickup_addresses || "Adresse à confirmer"}</em>
        </p>
        <i />
        <span>
          <MapPin />
        </span>
        <p>
          <small>Livraison</small>
          <b>{mission.client_name}</b>
          <em>{mission.delivery_address}</em>
        </p>
      </div>
      <footer>
        <div>
          <small>{mission.item_count || 0} article(s)</small>
          <strong>{money(mission.total)}</strong>
        </div>
        <button onClick={() => onSelect(mission)}>
          {actionLabel} <ArrowRight />
        </button>
      </footer>
    </motion.article>
  );
}

export function DeliveryDashboardContent({ api, user }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/deliveries/dashboard").then(({ data: response }) => setData(response));
  }, []);

  const stats = data?.stats || {};
  const priorityMission = (data?.recent || []).find(
    (mission) => !["delivered", "failed"].includes(mission.status)
  );
  const priorityGuide = deliveryGuides[priorityMission?.status] || deliveryGuides.assigned;
  const PriorityIcon = priorityGuide.icon;

  return (
    <DeliveryFrame
      eyebrow="Centre de livraison"
      title={`Bonjour, ${user.name}`}
      text="Voici exactement ce que vous devez faire pour terminer vos livraisons."
    >
      {!user.profile_image_url && (
        <section className="delivery-profile-required">
          <Camera />
          <div>
            <h2>Complétez votre profil avant votre première mission</h2>
            <p>
              Vous pouvez consulter votre espace, mais une photo professionnelle est obligatoire
              pour commencer une livraison.
            </p>
          </div>
          <Link to="/delivery/profile">Ajouter ma photo</Link>
        </section>
      )}
      <section className="delivery-hero">
        <div>
          <span>Votre prochaine action</span>
          <h2>
            {priorityMission ? priorityGuide.title : "Aucune mission active pour le moment"}
          </h2>
          <p>
            {priorityMission
              ? `${priorityMission.order_number} · ${priorityGuide.text}`
              : "Les nouvelles commandes assignées apparaîtront ici."}
          </p>
          <Link to="/delivery/assigned">
            {priorityMission ? priorityGuide.action : "Voir mes missions"}
            <ArrowRight />
          </Link>
        </div>
        <PriorityIcon />
      </section>
      <section className="delivery-how-it-works">
        <header>
          <span>Parcours d’une mission</span>
          <h2>Une livraison, quatre actions simples</h2>
          <p>Suivez toujours cet ordre. VinnHT enregistre chaque confirmation automatiquement.</p>
        </header>
        <div>
          {[
            [Phone, "1", "Contacter", "Confirmez la disponibilité du client."],
            [Package, "2", "Récupérer", "Vérifiez les produits auprès de la boutique."],
            [Navigation, "3", "Livrer", "Remettez la commande à la bonne adresse."],
            [FileSignature, "4", "Faire signer", "Le client confirme la réception sur votre écran."],
            [Clock3, "5", "Historique", "La mission et sa preuve sont automatiquement archivées."],
          ].map(([Icon, number, title, text]) => (
            <article key={number}>
              <span>{number}</span>
              <Icon />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="delivery-stat-grid">
        {[
          [Package, "À récupérer", stats.awaiting_pickup || 0],
          [Phone, "Prêtes à démarrer", stats.ready_to_depart || 0],
          [Navigation, "En livraison", stats.in_transit || 0],
          [CheckCircle2, "Livrées", stats.delivered || 0],
        ].map(([Icon, label, value]) => (
          <motion.article whileHover={{ y: -4 }} key={label}>
            <span>
              <Icon />
            </span>
            <small>{label}</small>
            <strong>{value}</strong>
          </motion.article>
        ))}
      </section>
      <section className="delivery-recent">
        <header>
          <div>
            <span>Activité récente</span>
            <h2>Dernières missions</h2>
          </div>
          <Clock3 />
        </header>
        {(data?.recent || []).map((mission) => (
          <article key={mission.id}>
            <div>
              <b>{mission.order_number}</b>
              <small>{mission.delivery_address}</small>
            </div>
            <strong>{money(mission.total)}</strong>
            <span className={`delivery-status ${mission.status}`}>
              {statusLabels[mission.status]}
            </span>
          </article>
        ))}
        {data && !data.recent.length && (
          <div className="delivery-empty">Aucune mission assignée.</div>
        )}
        <footer className="delivery-dashboard-links">
          <Link to="/delivery/assigned">
            <Package /> Ouvrir mes missions
          </Link>
          <Link to="/delivery/history">
            <Clock3 /> Voir mon historique
          </Link>
        </footer>
      </section>
    </DeliveryFrame>
  );
}

export function DeliveryMissionsContent({ api, user, history = false }) {
  const [missions, setMissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [proof, setProof] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const detailRef = useRef(null);

  const load = () => api.get("/deliveries/mine").then(({ data }) => setMissions(data));
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (!selected) {
      setItems([]);
      setProof(null);
      setProofLoading(false);
      return;
    }
    api
      .get(`/deliveries/${selected.id}/items`)
      .then(({ data }) => setItems(data))
      .catch(() => setItems([]));
    if (selected.status === "delivered") {
      setProofLoading(true);
      api
        .get(`/deliveries/${selected.id}/proof`)
        .then(({ data }) => setProof(data))
        .catch(() => setProof(null))
        .finally(() => setProofLoading(false));
    }
    window.setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, [selected]);

  const visible = useMemo(
    () =>
      missions.filter((mission) => {
        const sectionMatch = history
          ? ["delivered", "failed"].includes(mission.status)
          : !["delivered", "failed"].includes(mission.status);
        const searchMatch = `${mission.order_number} ${mission.client_name} ${mission.delivery_address}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return sectionMatch && searchMatch;
      }),
    [missions, history, query]
  );
  const selectedGuide =
    selected?.status === "delivered" && !selected.proof_confirmed_at
      ? {
          ...deliveryGuides.delivered,
          title: "Livraison archivée",
          text: "Cette ancienne livraison ne possède pas de signature enregistrée.",
        }
      : selected
        ? deliveryGuides[selected.status] || deliveryGuides.assigned
        : deliveryGuides.assigned;
  const SelectedGuideIcon = selectedGuide.icon;

  const update = async (status, proof = {}) => {
    if (!user?.profile_image_url) {
      setMessage("Ajoutez votre photo de profil avant de modifier une livraison.");
      return;
    }
    if (
      status !== "delivered" &&
      !window.confirm("Confirmer ce changement d’étape pour cette livraison ?")
    ) {
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.patch(`/deliveries/${selected.id}/status`, {
        status,
        ...proof,
      });
      setMessage(data.message);
      setSelected(null);
      load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Impossible de mettre la livraison à jour.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DeliveryFrame
      eyebrow={history ? "Historique" : "Missions actives"}
      title={history ? "Livraisons terminées" : "Commandes assignées"}
      text={
        history
          ? "Consultez les missions déjà traitées."
          : "Suivez chaque mission depuis la récupération jusqu’au client."
      }
    >
      {message && <div className="delivery-success">{message}</div>}
      {!history && !user?.profile_image_url && (
        <section className="delivery-profile-required">
          <Camera />
          <div>
            <h2>Actions temporairement bloquées</h2>
            <p>
              Consultez vos missions librement. Ajoutez votre photo pour confirmer une
              récupération ou commencer une livraison.
            </p>
          </div>
          <Link to="/delivery/profile">Compléter mon profil</Link>
        </section>
      )}
      <label className="delivery-search">
        <Search />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher une commande, un client ou une adresse"
        />
      </label>
      <div className="delivery-mission-grid">
        {visible.map((mission) => (
          <MissionCard mission={mission} onSelect={setSelected} key={mission.id} />
        ))}
      </div>
      {!visible.length && (
        <div className="delivery-empty">Aucune livraison dans cette section.</div>
      )}
      {selected && (
        <section className="delivery-detail" ref={detailRef}>
          <header>
            <div>
              <span>Détail mission</span>
              <h2>{selected.order_number}</h2>
            </div>
            <button onClick={() => setSelected(null)}>×</button>
          </header>
          <section className={`delivery-next-action ${selected.status}`}>
            <span>
              <SelectedGuideIcon />
            </span>
            <div>
              <small>Ce que vous devez faire maintenant</small>
              <h3>{selectedGuide.title}</h3>
              <p>{selectedGuide.text}</p>
            </div>
          </section>
          <div className="delivery-detail-grid">
            <article>
              <UserRound />
              <small>Client</small>
              <b>{selected.client_name}</b>
              <a href={`tel:${selected.client_phone}`}>
                <Phone /> {selected.client_phone || "Non renseigné"}
              </a>
              {selected.client_phone && (
                <a
                  href={`https://wa.me/${whatsappNumber(selected.client_phone)}?text=${encodeURIComponent(
                    `Bonjour ${selected.client_name}, votre livreur VinnHT vous contacte au sujet de la commande ${selected.order_number}.`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle /> WhatsApp
                </a>
              )}
            </article>
            <article>
              <Store />
              <small>Boutiques</small>
              <b>{selected.pickup_shops}</b>
              <p>{selected.pickup_addresses}</p>
            </article>
            <article>
              <MapPin />
              <small>Destination</small>
              <b>{selected.delivery_address}</b>
              <p>{money(selected.total)}</p>
            </article>
          </div>
          <section className="delivery-journey">
            {journeySteps.map(([status, label], index) => {
              const currentIndex = journeySteps.findIndex(([value]) => value === selected.status);
              return (
                <article className={index <= currentIndex ? "done" : ""} key={status}>
                  <span>{index < currentIndex ? <CheckCircle2 /> : index + 1}</span>
                  <small>{label}</small>
                </article>
              );
            })}
          </section>
          <section className="delivery-items">
            <header>
              <span>Contenu de la commande</span>
              <strong>{items.length} produit(s)</strong>
            </header>
            {items.map((item) => (
              <article key={item.product_id}>
                <img src={imageSource(item.image_url)} alt={item.product_name} />
                <div>
                  <small>{item.shop_name}</small>
                  <b>{item.product_name}</b>
                  <span>Quantité : {item.quantity}</span>
                </div>
                <strong>{money(item.subtotal)}</strong>
              </article>
            ))}
          </section>
          {history && selected.status === "delivered" && proof?.signature_data && (
            <section className="delivery-proof-card">
              <div>
                <ShieldCheck />
                <span>
                  <b>Livraison reçue et signée</b>
                  {proof.signer_name} · {date(proof.confirmed_at)}
                </span>
              </div>
              <img src={proof.signature_data} alt={`Signature de ${proof.signer_name}`} />
              {proof.delivery_notes && <p>{proof.delivery_notes}</p>}
            </section>
          )}
          {history &&
            selected.status === "delivered" &&
            !proofLoading &&
            !proof?.signature_data && (
            <section className="delivery-proof-missing">
              <FileSignature />
              <div>
                <h3>Aucune signature enregistrée</h3>
                <p>
                  Cette ancienne livraison est marquée comme livrée, mais elle a été finalisée
                  avant l’activation de la preuve de réception.
                </p>
              </div>
            </section>
            )}
          {!history && (
            <footer>
              {selected.status === "assigned" && (
                <button disabled={!user?.profile_image_url} onClick={() => update("picked_up")}>
                  <Package /> Confirmer la récupération
                </button>
              )}
              {selected.status === "picked_up" && (
                <button disabled={!user?.profile_image_url} onClick={() => update("in_transit")}>
                  <Navigation /> Commencer la livraison
                </button>
              )}
              {selected.status === "in_transit" && (
                <SignaturePad
                  clientName={selected.client_name}
                  onConfirm={(proof) => update("delivered", proof)}
                  busy={busy || !user?.profile_image_url}
                />
              )}
              {["assigned", "picked_up", "in_transit"].includes(selected.status) && (
                <button
                  className="danger"
                  disabled={!user?.profile_image_url}
                  onClick={() => update("failed")}
                >
                  <XCircle /> Signaler un échec
                </button>
              )}
            </footer>
          )}
        </section>
      )}
    </DeliveryFrame>
  );
}

export function DeliveryManagementContent({ api }) {
  const [data, setData] = useState({ deliveries: [], drivers: [] });
  const [selections, setSelections] = useState({});
  const [message, setMessage] = useState("");
  const load = () =>
    api.get("/management/deliveries").then(({ data: response }) => setData(response));
  useEffect(() => {
    load();
  }, []);

  const assign = async (deliveryId) => {
    const deliveryUserId = selections[deliveryId];
    if (!deliveryUserId) return;
    const { data: response } = await api.patch(`/management/deliveries/${deliveryId}/assign`, {
      deliveryUserId,
    });
    setMessage(response.message);
    load();
  };

  return (
    <DeliveryFrame
      eyebrow="Coordination"
      title="Gestion des livraisons"
      text="Assignez les commandes prêtes aux livreurs disponibles."
    >
      {message && <div className="delivery-success">{message}</div>}
      <section className="delivery-management-list">
        {data.deliveries.map((delivery) => (
          <article key={delivery.id}>
            <span>
              <Truck />
            </span>
            <div>
              <small>{delivery.order_number}</small>
              <h3>{delivery.delivery_address}</h3>
              <p>
                {statusLabels[delivery.status]}
              </p>
            </div>
            <select
              value={selections[delivery.id] || delivery.delivery_user_id || ""}
              onChange={(event) =>
                setSelections({ ...selections, [delivery.id]: event.target.value })
              }
            >
              <option value="">Choisir un livreur</option>
              {data.drivers.map((driver) => (
                <option value={driver.id} key={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
            <button onClick={() => assign(delivery.id)}>
              <RefreshCw /> Assigner
            </button>
          </article>
        ))}
        {!data.deliveries.length && (
          <div className="delivery-empty">
            <ShieldCheck /> Aucune commande prête à assigner.
          </div>
        )}
      </section>
    </DeliveryFrame>
  );
}

export function DeliveryProfileContent({ api, user, updateUser, onLogout }) {
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(
    user?.profile_image_url ? `${apiOrigin}${user.profile_image_url}` : ""
  );
  const [message, setMessage] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const hasPhoto = Boolean(preview);

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
      setMessage("Photo de profil enregistrée.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Impossible d’enregistrer cette photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (!hasPhoto) {
      setMessage("Ajoutez votre photo avant d’enregistrer le profil.");
      return;
    }
    const data = new FormData();
    data.append("name", form.name);
    data.append("phone", form.phone);
    if (photo) data.append("profilePhoto", photo);
    const { data: response } = await api.patch("/auth/profile", data);
    updateUser(response.user);
    setMessage("Profil livreur enregistré et visible pour rassurer les clients.");
  };

  return (
    <DeliveryFrame
      eyebrow="Confiance client"
      title="Profil livreur"
      text="Votre photo et vos coordonnées permettent aux clients de reconnaître leur livreur."
    >
      <section className={`delivery-profile-alert ${hasPhoto ? "complete" : "required"}`}>
        {hasPhoto ? <ShieldCheck /> : <Camera />}
        <div>
          <h2>{hasPhoto ? "Profil visuel vérifié" : "Photo de profil obligatoire"}</h2>
          <p>
            {hasPhoto
              ? "Votre photo pourra être affichée au client pendant la livraison."
              : "Ajoutez une photo récente, nette et professionnelle avant vos prochaines missions."}
          </p>
        </div>
      </section>
      <div className="delivery-profile-layout">
        <aside className="delivery-profile-card">
          <label className="legacy-photo-picker">
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
            <span>{preview ? <img src={preview} alt="Photo du livreur" /> : <UserRound />}</span>
            <small>
              <Camera />{" "}
              {uploadingPhoto
                ? "Enregistrement..."
                : hasPhoto
                  ? "Changer la photo"
                  : "Ajouter ma photo"}
            </small>
          </label>
          <ProfilePhotoManager
            api={api}
            user={user}
            updateUser={updateUser}
            onMessage={setMessage}
          />
          <h2>{form.name || "Livreur VinnHT"}</h2>
          <p>{user?.email}</p>
          <b className={hasPhoto ? "verified" : "missing"}>
            {hasPhoto ? "Identité visuelle prête" : "Photo requise"}
          </b>
        </aside>
        <form className="delivery-profile-form" onSubmit={save}>
          <header>
            <div>
              <span>Informations professionnelles</span>
              <h2>Coordonnées du livreur</h2>
            </div>
            {message && <strong>{message}</strong>}
          </header>
          <label>
            Nom complet
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label>
            Téléphone
            <input
              required
              minLength="8"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="+509 ..."
            />
          </label>
          <label className="full">
            Adresse email
            <input value={user?.email || ""} readOnly />
          </label>
          <button disabled={!hasPhoto}>
            <ShieldCheck /> Enregistrer mon profil livreur
          </button>
        </form>
      </div>
      <ProfileLogoutCard onLogout={onLogout} />
    </DeliveryFrame>
  );
}
