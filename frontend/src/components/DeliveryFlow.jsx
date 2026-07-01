import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ProfilePhotoManager from "./ProfilePhotoManager.jsx";
import MobileProfileActions from "./MobileProfileActions.jsx";
import { apiOrigin } from "../config/runtime.js";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Eye,
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
  CalendarDays,
  MessageCircle,
  Search,
  Wallet,
  XCircle,
} from "lucide-react";
import "../styles/delivery-flow.css";

const money = (value) => `${Number(value || 0).toLocaleString("fr-HT")} HTG`;
const imageSource = (url) =>
  url?.startsWith("/uploads") ? `${apiOrigin}${url}` : url;
const deliveryImageSource = (url) => imageSource(url) || "/vinnht-logo.png";
const useDeliveryImageFallback = (event) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = "/vinnht-logo.png";
};
const date = (value) =>
  value ? new Intl.DateTimeFormat("fr-HT", { dateStyle: "medium" }).format(new Date(value)) : "—";
const reportDate = (value) => date(value?.length === 10 ? `${value}T12:00:00` : value);

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

function DeliveryFrame({ eyebrow, title, text, children, className = "" }) {
  return (
    <section className={`delivery-flow ${className}`.trim()}>
      <header className="delivery-page-header">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </header>
      {children}
    </section>
  );
}

function MissionCard({ mission, onSelect, history = false, onProof }) {
  const guide = deliveryGuides[mission.status] || deliveryGuides.assigned;
  const actionLabel =
    mission.status === "delivered" && !mission.proof_confirmed_at
       ? "Voir le détail"
      : guide.action;

  if (history) {
    return (
      <motion.article className="delivery-mission-card compact" whileHover={{ y: -2 }}>
        <header>
          <div>
            <span className={`delivery-status ${mission.status}`}>
              {statusLabels[mission.status]}
            </span>
            <strong>{mission.order_number}</strong>
          </div>
          <time>{date(mission.delivered_at || mission.assigned_at)}</time>
        </header>
        <div className="delivery-history-summary">
          <span><Store /></span>
          <p>
            <small>Boutique</small>
            <b>{mission.pickup_shops || "Boutique VinnHT"}</b>
          </p>
          <span><UserRound /></span>
          <p>
            <small>Client</small>
            <b>{mission.client_name}</b>
          </p>
        </div>
        <footer>
          <div>
            <small>{mission.item_count || 0} article(s)</small>
            <strong>{money(mission.total)}</strong>
          </div>
          <div className="delivery-history-actions">
            <button className="secondary" onClick={() => onSelect(mission)}>
              Détails
            </button>
            {mission.status === "delivered" && (
              <button onClick={() => onProof(mission)}>
                <Eye /> Consulter la preuve
              </button>
            )}
          </div>
        </footer>
      </motion.article>
    );
  }

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
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/deliveries/dashboard")
      .then(({ data: response }) => setData(response))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message ||
            "Impossible de charger le tableau de bord livreur.",
        ),
      );
  }, []);

  useEffect(() => {
    api
      .get("/deliveries/weekly-report")
      .then(({ data: response }) => setWeeklyReport(response))
      .catch(() => setWeeklyReport(null));
  }, []);

  const stats = data?.stats || {};
  const recentMissions = data?.recent || [];
  const priorityMission = data?.priority || null;
  const priorityGuide = priorityMission ? deliveryGuides[priorityMission.status] || deliveryGuides.assigned : deliveryGuides.assigned;
  const PriorityIcon = priorityGuide.icon;

  return (
    <DeliveryFrame
      className="delivery-dashboard"
      eyebrow="Centre de livraison"
      title={`Bonjour, ${user.name}`}
      text="Voici exactement ce que vous devez faire pour terminer vos livraisons."
    >
      {!data && !error && <div className="delivery-empty">Chargement de vos missions...</div>}
      {error && <div className="delivery-success error">{error}</div>}
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
      <section className="delivery-weekly-report">
        <header>
          <div>
            <span>Rapport personnel</span>
            <h2>Votre semaine en temps réel</h2>
          </div>
          <CalendarDays />
        </header>
        {weeklyReport ? (
          <>
            <div className="delivery-weekly-report-grid">
              <article className="primary">
                <Wallet />
                <span>
                  <small>Salaire confirmé</small>
                  <strong>{money(weeklyReport.confirmedEarnings)}</strong>
                  <em>{weeklyReport.confirmedDeliveries} livraison(s) confirmée(s)</em>
                </span>
              </article>
              <article>
                <Clock3 />
                <span>
                  <small>En attente du client</small>
                  <strong>{money(weeklyReport.pendingEarnings)}</strong>
                  <em>{weeklyReport.pendingDeliveries} réception(s) à confirmer</em>
                </span>
              </article>
            </div>
            <div className="delivery-weekly-days">
              {weeklyReport.days.map((day) => (
                <span className={day.amount > 0 ? "active" : ""} key={day.date}>
                  <i style={{ "--delivery-day-level": `${Math.max(day.level, 8)}%` }} />
                  <b>{day.label}</b>
                  <small>{Number(day.amount || 0).toLocaleString("fr-HT")}</small>
                </span>
              ))}
            </div>
            <footer>
              <span>
                Du {reportDate(weeklyReport.periodStart)} au {reportDate(weeklyReport.periodEnd)}
              </span>
              <b>Clôture automatique dimanche</b>
            </footer>
          </>
        ) : (
          <div className="delivery-empty">Chargement de votre rapport...</div>
        )}
      </section>
      <section className="delivery-recent">
        <header>
          <div>
            <span>Activité récente</span>
            <h2>3 dernières livraisons</h2>
          </div>
          <Clock3 />
        </header>
        {recentMissions.map((mission) => (
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
        {data && !recentMissions.length && (
          <div className="delivery-empty">Aucune livraison terminée pour le moment.</div>
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
  const [proofMission, setProofMission] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messageType, setMessageType] = useState("success");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/deliveries/mine");
      setMissions(Array.isArray(data) ? data : []);
    } catch (error) {
      setMissions([]);
      setMessageType("error");
      setMessage(
        error.response?.data?.message || "Impossible de charger vos missions.",
      );
    } finally {
      setLoading(false);
    }
  };
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
  }, [selected]);

  useEffect(() => {
    if (!selected && !proofMission) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      if (proofMission) setProofMission(null);
      else setSelected(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selected, proofMission]);

  const openProof = async (mission) => {
    setProofMission(mission);
    setProof(null);
    setProofLoading(true);
    try {
      const { data } = await api.get(`/deliveries/${mission.id}/proof`);
      setProof(data);
    } catch {
      setProof(null);
    } finally {
      setProofLoading(false);
    }
  };

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
          title: "Livraison archivee",
          text: "Cette ancienne livraison ne possede pas de signature enregistree.",
        }
      : selected
        ? deliveryGuides[selected.status] || deliveryGuides.assigned
        : deliveryGuides.assigned;
  const SelectedGuideIcon = selectedGuide.icon;

  const update = async (status, proof = {}) => {
    if (!user.profile_image_url) {
      setMessageType("error");
      setMessage("Ajoutez votre photo de profil avant de modifier une livraison.");
      return;
    }
    if (
      status !== "delivered" &&
      !window.confirm("Confirmer ce changement d’étape pour cette livraison ")
    ) {
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.patch(`/deliveries/${selected.id}/status`, {
        status,
        ...proof,
      });
      setMessageType("success");
      setMessage(data.message);
      setSelected(null);
      await load();
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Impossible de mettre la livraison à jour.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DeliveryFrame
      eyebrow={history ? "Historique" : "Missions actives"}
      title={history ? "Livraisons terminees" : "Commandes assignees"}
      text={
        history
           ? "Consultez vos missions terminées. Elles restent visibles pendant 60 jours."
          : "Suivez chaque mission depuis la récupération jusqu’au client."
      }
    >
      {message && <div className={`delivery-success ${messageType}`}>{message}</div>}
      {!history && !user.profile_image_url && (
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
      <div className={`delivery-mission-grid ${history ? "history" : ""}`}>
        {visible.map((mission) => (
          <MissionCard
            mission={mission}
            onSelect={setSelected}
            onProof={openProof}
            history={history}
            key={mission.id}
          />
        ))}
      </div>
      {loading && <div className="delivery-empty">Chargement des livraisons...</div>}
      {!loading && !visible.length && (
        <div className="delivery-empty">Aucune livraison dans cette section.</div>
      )}
      {selected && (
        <div
          className="delivery-detail-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
        <section
          className="delivery-detail delivery-detail-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delivery-detail-title"
        >
          <header>
            <div>
              <span>Détail mission</span>
              <h2 id="delivery-detail-title">{selected.order_number}</h2>
            </div>
            <button aria-label="Fermer le détail" onClick={() => setSelected(null)}>×</button>
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
                <img
                  src={deliveryImageSource(item.image_url)}
                  alt={item.product_name}
                  onError={useDeliveryImageFallback}
                />
                <div>
                  <small>{item.shop_name}</small>
                  <b>{item.product_name}</b>
                  <span>Quantité : {item.quantity}</span>
                </div>
                <strong>{money(item.subtotal)}</strong>
              </article>
            ))}
          </section>
          {history && selected.status === "delivered" && (
            <button className="delivery-open-proof" onClick={() => openProof(selected)}>
              <Eye /> Consulter la preuve de réception
            </button>
          )}
          {!history && (
            <footer>
              {selected.status === "assigned" && (
                <button disabled={!user.profile_image_url} onClick={() => update("picked_up")}>
                  <Package /> Confirmer la récupération
                </button>
              )}
              {selected.status === "picked_up" && (
                <button disabled={!user.profile_image_url} onClick={() => update("in_transit")}>
                  <Navigation /> Commencer la livraison
                </button>
              )}
              {selected.status === "in_transit" && (
                <SignaturePad
                  clientName={selected.client_name}
                  onConfirm={(proof) => update("delivered", proof)}
                  busy={busy || !user.profile_image_url}
                />
              )}
              {["assigned", "picked_up", "in_transit"].includes(selected.status) && (
                <button
                  className="danger"
                  disabled={!user.profile_image_url}
                  onClick={() => update("failed")}
                >
                  <XCircle /> Signaler un échec
                </button>
              )}
            </footer>
          )}
        </section>
        </div>
      )}
      {proofMission && (
        <div
          className="delivery-proof-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setProofMission(null);
          }}
        >
          <section
            className="delivery-proof-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delivery-proof-title"
          >
            <header>
              <div>
                <ShieldCheck />
                <span>
                  <small>Preuve de réception</small>
                  <h2 id="delivery-proof-title">{proofMission.order_number}</h2>
                </span>
              </div>
              <button aria-label="Fermer la preuve" onClick={() => setProofMission(null)}>×</button>
            </header>
            {proofLoading ? (
              <div className="delivery-proof-modal-state">Chargement de la preuve...</div>
            ) : proof?.signature_data ? (
              <>
                <div className="delivery-proof-meta">
                  <span><small>Réceptionnaire</small><b>{proof.signer_name}</b></span>
                  <span><small>Date</small><b>{date(proof.confirmed_at)}</b></span>
                </div>
                <img src={proof.signature_data} alt={`Signature de ${proof.signer_name}`} />
                {proof.delivery_notes && <p>{proof.delivery_notes}</p>}
              </>
            ) : (
              <div className="delivery-proof-modal-state missing">
                <FileSignature />
                <b>Aucune signature enregistrée</b>
                <span>Cette livraison a été finalisée avant l’activation des preuves numériques.</span>
              </div>
            )}
          </section>
        </div>
      )}
    </DeliveryFrame>
  );
}

export function DeliveryManagementContent({ api }) {
  const [data, setData] = useState({ deliveries: [], drivers: [], departments: [], stats: {} });
  const [selections, setSelections] = useState({});
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [department, setDepartment] = useState("all");
  const [driverId, setDriverId] = useState("all");
  const [selectedProof, setSelectedProof] = useState(null);
  const load = () =>
    api.get("/management/deliveries", {
      params: {
        q: query.trim() || undefined,
        status: status === "all" ? undefined : status,
        department: department === "all" ? undefined : department,
        driverId: driverId === "all" ? undefined : driverId,
      },
    }).then(({ data: response }) => setData(response));
  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [query, status, department, driverId]);

  const assign = async (deliveryId) => {
    const deliveryUserId = selections[deliveryId];
    if (!deliveryUserId) return;
    const { data: response } = await api.patch(`/management/deliveries/${deliveryId}/assign`, {
      deliveryUserId,
    });
    setMessage(response.message);
    load();
  };

  const openProof = async (deliveryId) => {
    const { data: proof } = await api.get(`/management/deliveries/${deliveryId}/proof`);
    setSelectedProof(proof);
  };

  return (
    <DeliveryFrame
      eyebrow="Coordination"
      title="Gestion des livraisons"
      text="Assignez les commandes prêtes aux livreurs disponibles."
    >
      {message && <div className="delivery-success">{message}</div>}
      <section className="manager-delivery-summary">
        {[
          [Truck, "Non assignées", data.stats?.unassigned],
          [Package, "Assignées", data.stats?.assigned],
          [Navigation, "En livraison", data.stats?.in_transit],
          [XCircle, "Échecs", data.stats?.failed],
        ].map(([Icon, label, value]) => (
          <article key={label}><Icon /><span><small>{label}</small><b>{Number(value || 0)}</b></span></article>
        ))}
      </section>
      <section className="manager-delivery-filters">
        <label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Commande, client, adresse ou livreur" /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">Tous les statuts</option>
          <option value="unassigned">Non assignées</option>
          <option value="assigned">Assignées</option>
          <option value="picked_up">Récupérées</option>
          <option value="in_transit">En livraison</option>
          <option value="delivered">Livrées</option>
          <option value="failed">Échecs</option>
        </select>
        <select value={department} onChange={(event) => setDepartment(event.target.value)}>
          <option value="all">Tous départements</option>
          {(data.departments || []).map((item) => <option value={item} key={item}>{item}</option>)}
        </select>
        <select value={driverId} onChange={(event) => setDriverId(event.target.value)}>
          <option value="all">Tous les livreurs</option>
          {data.drivers.map((driver) => <option value={driver.id} key={driver.id}>{driver.name}</option>)}
        </select>
      </section>
      <section className="delivery-management-list">
        {data.deliveries.map((delivery) => (
          <article className={Number(delivery.elapsed_hours) >= 24 && delivery.status !== "delivered" ? "late" : ""} key={delivery.id}>
            <span>
              <Truck />
            </span>
            <div>
              <small>{delivery.order_number}</small>
              <h3>{delivery.delivery_address}</h3>
              <p>
                {statusLabels[delivery.status]} · {delivery.client_name} · {delivery.department}
              </p>
              <small>{Number(delivery.elapsed_hours || 0)} h depuis la création ou l’assignation</small>
              {delivery.has_proof ? (
                <button className="delivery-proof-available" onClick={() => openProof(delivery.id)}>
                  <Eye /> Voir la preuve
                </button>
              ) : null}
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
            {["unassigned", "assigned"].includes(delivery.status) ? (
              <button onClick={() => assign(delivery.id)}>
                <RefreshCw /> {delivery.delivery_user_id ? "Réassigner" : "Assigner"}
              </button>
            ) : (
              <span className={`delivery-management-status ${delivery.status}`}>
                {statusLabels[delivery.status]}
              </span>
            )}
          </article>
        ))}
        {!data.deliveries.length && (
          <div className="delivery-empty">
            <ShieldCheck /> Aucune commande prête à assigner.
          </div>
        )}
      </section>
      {selectedProof && (
        <section className="manager-proof-modal">
          <header>
            <div><FileSignature /><span><small>{selectedProof.order_number}</small><h2>Preuve de livraison</h2></span></div>
            <button onClick={() => setSelectedProof(null)}><XCircle /></button>
          </header>
          <img src={selectedProof.signature_data} alt={`Signature de ${selectedProof.signer_name}`} />
          <div>
            <p><b>Signataire</b><span>{selectedProof.signer_name}</span></p>
            <p><b>Client</b><span>{selectedProof.client_name}</span></p>
            <p><b>Livreur</b><span>{selectedProof.delivery_name || "Non renseigné"}</span></p>
            <p><b>Confirmée le</b><span>{date(selectedProof.confirmed_at)}</span></p>
          </div>
          {selectedProof.delivery_notes && <p>{selectedProof.delivery_notes}</p>}
        </section>
      )}
    </DeliveryFrame>
  );
}

export function DeliveryProfileContent({ api, user, updateUser, onLogout }) {
  const [form, setForm] = useState({ name: user.name || "", phone: user.phone || "" });
  const [professional, setProfessional] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const hasPhoto = Boolean(user.profile_image_url);
  const association = professional?.association || null;

  useEffect(() => {
    api
      .get("/deliveries/profile")
      .then(({ data }) => setProfessional(data))
      .catch(() => setProfessional({ association: null, stats: {} }));
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const data = new FormData();
    data.append("name", form.name.trim());
    data.append("phone", form.phone.trim());
    try {
      const { data: response } = await api.patch("/auth/profile", data);
      updateUser(response.user);
      setMessage("Profil livreur enregistré et visible pour rassurer les clients.");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Impossible d’enregistrer le profil livreur.",
      );
    } finally {
      setSaving(false);
    }
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
          <h2>{hasPhoto ? "Profil visuel verifie" : "Photo de profil obligatoire"}</h2>
          <p>
            {hasPhoto
               ? "Votre photo pourra être affichée au client pendant la livraison."
              : "Ajoutez une photo récente, nette et professionnelle avant vos prochaines missions."}
          </p>
        </div>
      </section>
      <div className="delivery-profile-layout">
        <aside className="delivery-profile-card">
          <ProfilePhotoManager
            api={api}
            user={user}
            updateUser={updateUser}
            onMessage={setMessage}
          />
          <h2>{form.name || "Livreur VinnHT"}</h2>
          <p>{user.email}</p>
          <b className={hasPhoto ? "verified" : "missing"}>
            {hasPhoto ? "Identité visuelle prête" : "Photo requise"}
          </b>
          <div className="delivery-profile-trust-list">
            <span className={hasPhoto ? "done" : ""}>
              <ShieldCheck /> Photo reconnaissable
            </span>
            <span className={form.phone.trim().length >= 8 ? "done" : ""}>
              <Phone /> Téléphone joignable
            </span>
            <span className={association?.status === "active" ? "done" : ""}>
              <Store /> Boutique associée
            </span>
          </div>
        </aside>
        <div className="delivery-profile-main">
          <form className="delivery-profile-form" onSubmit={save}>
            <header>
              <div>
                <span>Informations professionnelles</span>
                <h2>Coordonnées du livreur</h2>
              </div>
              <Link to="/delivery/settings">Paramètres et sécurité</Link>
            </header>
            {message && (
              <p
                className={`delivery-profile-message ${
                  message.toLowerCase().includes("impossible") ? "error" : ""
                }`}
              >
                {message}
              </p>
            )}
            <label>
              Nom complet
              <input
                required
                minLength="2"
                maxLength="120"
                autoComplete="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>
            <label>
              Téléphone
              <input
                required
                minLength="8"
                maxLength="30"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="+509 ..."
              />
            </label>
            <label className="full">
              Adresse email
              <input value={user.email || ""} readOnly />
            </label>
            <button disabled={saving}>
              <ShieldCheck /> {saving ? "Enregistrement..." : "Enregistrer mes informations"}
            </button>
          </form>
          <section className="delivery-employer-card">
            <header>
              <div>
                <span>Cadre professionnel</span>
                <h2>Votre boutique de rattachement</h2>
              </div>
              <b className={association?.status === "active" ? "active" : "inactive"}>
                {association?.status === "active" ? "Actif" : "Non associé"}
              </b>
            </header>
            {association ? (
              <div className="delivery-employer-grid">
                <article className="shop">
                  <span>
                    {association.shop_logo_url ? (
                      <img src={deliveryImageSource(association.shop_logo_url)} alt={association.shop_name} />
                    ) : (
                      <Store />
                    )}
                  </span>
                  <p><small>Boutique</small><strong>{association.shop_name}</strong></p>
                </article>
                <article><MapPin /><p><small>Zone</small><strong>{association.zones || association.delivery_zones || "À préciser par la boutique"}</strong></p></article>
                <article><Truck /><p><small>Transport</small><strong>{association.vehicle_type || "Non renseigné"}</strong></p></article>
                <article><CalendarDays /><p><small>Missions livrées</small><strong>{professional?.stats?.delivered || 0}</strong></p></article>
              </div>
            ) : (
              <div className="delivery-employer-empty">
                <Store />
                <div>
                  <h3>Aucune boutique associée</h3>
                  <p>Votre boutique employeuse doit créer ou rattacher votre compte livreur.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
      <MobileProfileActions onLogout={onLogout} settingsPath="/delivery/settings" />
    </DeliveryFrame>
  );
}
