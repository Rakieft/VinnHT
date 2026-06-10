import React, { useEffect, useMemo, useState } from "react";
import ProfilePhotoManager from "./ProfilePhotoManager.jsx";
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
  XCircle,
} from "lucide-react";

const money = (value) => `${Number(value || 0).toLocaleString("fr-HT")} HTG`;
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
          Voir mission <ArrowRight />
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
  return (
    <DeliveryFrame
      eyebrow="Centre de livraison"
      title={`Bonjour, ${user.name}`}
      text="Organisez vos missions et gardez chaque client informé."
    >
      <section className="delivery-hero">
        <div>
          <span>Mission prioritaire</span>
          <h2>{stats.in_transit || 0} livraison(s) actuellement en route</h2>
          <p>Finalisez chaque étape dans l’ordre pour garantir un suivi fiable.</p>
        </div>
        <Truck />
      </section>
      <section className="delivery-stat-grid">
        {[
          [Package, "À récupérer", stats.awaiting_pickup || 0],
          [Navigation, "En livraison", stats.in_transit || 0],
          [CheckCircle2, "Livrées", stats.delivered || 0],
          [XCircle, "Échecs", stats.failed || 0],
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
      </section>
    </DeliveryFrame>
  );
}

export function DeliveryMissionsContent({ api, history = false }) {
  const [missions, setMissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");

  const load = () => api.get("/deliveries/mine").then(({ data }) => setMissions(data));
  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(
    () =>
      missions.filter((mission) =>
        history
          ? ["delivered", "failed"].includes(mission.status)
          : !["delivered", "failed"].includes(mission.status)
      ),
    [missions, history]
  );

  const update = async (status) => {
    const { data } = await api.patch(`/deliveries/${selected.id}/status`, { status });
    setMessage(data.message);
    setSelected(null);
    load();
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
      <div className="delivery-mission-grid">
        {visible.map((mission) => (
          <MissionCard mission={mission} onSelect={setSelected} key={mission.id} />
        ))}
      </div>
      {!visible.length && (
        <div className="delivery-empty">Aucune livraison dans cette section.</div>
      )}
      {selected && (
        <section className="delivery-detail">
          <header>
            <div>
              <span>Détail mission</span>
              <h2>{selected.order_number}</h2>
            </div>
            <button onClick={() => setSelected(null)}>×</button>
          </header>
          <div className="delivery-detail-grid">
            <article>
              <UserRound />
              <small>Client</small>
              <b>{selected.client_name}</b>
              <a href={`tel:${selected.client_phone}`}>
                <Phone /> {selected.client_phone || "Non renseigné"}
              </a>
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
          {!history && (
            <footer>
              {selected.status === "assigned" && (
                <button onClick={() => update("picked_up")}>
                  <Package /> Confirmer la récupération
                </button>
              )}
              {selected.status === "picked_up" && (
                <button onClick={() => update("in_transit")}>
                  <Navigation /> Commencer la livraison
                </button>
              )}
              {selected.status === "in_transit" && (
                <button onClick={() => update("delivered")}>
                  <CheckCircle2 /> Confirmer la livraison
                </button>
              )}
              {["assigned", "picked_up", "in_transit"].includes(selected.status) && (
                <button className="danger" onClick={() => update("failed")}>
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
                {money(delivery.total)} · {statusLabels[delivery.status]}
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

export function DeliveryProfileContent({ api, user, updateUser }) {
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(
    user?.profile_image_url ? `http://localhost:5056${user.profile_image_url}` : ""
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
      setPreview(`http://localhost:5056${response.user.profile_image_url}?v=${Date.now()}`);
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
    </DeliveryFrame>
  );
}
