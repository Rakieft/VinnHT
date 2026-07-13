import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  BriefcaseBusiness,
  GraduationCap,
  Package,
  ShieldCheck,
  Store,
  UploadCloud,
  UserCheck,
  X,
} from "lucide-react";
import { apiOrigin } from "../../config/runtime.js";
import "../../styles/seller-flow.css";

const SELLER_TERMS_VERSION = "2026-07-10-v6";
const terms = [
  "Je certifie que toutes les informations fournies sont exactes et à jour.",
  "J’accepte que VinnHT vérifie mon profil avant l’approbation de mon espace vendeur.",
  "J’accepte que ma photo de profil soit obligatoire et visible par les acheteurs.",
  "J’accepte que mon nom, ma ville et le nom de ma boutique soient visibles publiquement sur VinnHT.",
  "Je confirme que le numéro MonCash déclaré est mon vrai numéro ou celui officiellement utilisé par ma boutique.",
  "Je confirme que le nom du titulaire MonCash déclaré correspond exactement au nom réel affiché sur ce compte.",
  "Je comprends qu’une erreur, un faux nom ou un faux numéro MonCash peut bloquer ma demande, mes paiements ou entraîner la suspension de mon espace vendeur.",
  "J’accepte qu’une commission VinnHT de 4% soit retenue sur mes revenus validés par la plateforme.",
  "Je m’engage à vendre uniquement des produits légaux, authentiques et conformes aux règles de VinnHT.",
  "Je m’engage à publier des photos réelles, des prix exacts et des descriptions honnêtes.",
  "Je m’engage à maintenir mes stocks à jour et à préparer les commandes dans les délais annoncés.",
  "Je comprends que VinnHT fournit des outils de suivi mais n’est pas le transporteur : ma boutique et le livreur choisi restent responsables de l’exécution matérielle de la livraison.",
  "Je comprends que le retrait en boutique est gratuit et que le choix Livraison ajoute 500 HTG à ma vente pour le service de mon livreur.",
  "Je comprends que les clients paient VinnHT, que seule l’administration valide la preuve et que mes fonds sont libérés après confirmation de réception.",
  "Je m’engage à protéger les informations des clients et à les utiliser uniquement pour traiter leurs commandes.",
  "Je comprends que VinnHT peut refuser, suspendre ou désactiver mon espace vendeur en cas de fraude, fausses informations, produits interdits ou mauvais comportement.",
  "Je comprends que VinnHT peut demander des informations supplémentaires pour confirmer mon profil ou ma boutique.",
  "Je reste responsable de la légalité, de la qualité, de l’authenticité et de la sécurité des produits que je propose.",
  "Je m’engage à respecter les règles VinnHT applicables aux annulations, retours, remboursements et produits défectueux.",
  "Je garantis disposer des droits nécessaires sur les marques, images, descriptions et autres contenus publiés.",
  "Je m’engage à collaborer avec VinnHT lors d’une plainte, d’une suspicion de fraude ou d’une contestation de paiement.",
  "Je comprends que VinnHT agit comme plateforme intermédiaire et que mes obligations fiscales, commerciales et réglementaires restent sous ma responsabilité.",
  "J’accepte les conditions générales pour devenir vendeur sur VinnHT.",
];

const initialForm = {
  fullName: "",
  birthDate: "",
  primaryPhone: "",
  secondaryPhone: "",
  email: "",
  fullAddress: "",
  city: "",
  department: "",
  profilePhoto: null,
  activityStatus: "",
  institutionName: "",
  activityDetails: "",
  shopName: "",
  shopDescription: "",
  shopLogo: null,
  pickupAddress: "",
  moncashNumber: "",
  moncashAccountName: "",
};

const requiredLabels = {
  fullName: "Nom complet",
  birthDate: "Date de naissance",
  primaryPhone: "Téléphone principal",
  email: "Email",
  fullAddress: "Adresse complète",
  city: "Ville",
  department: "Département",
  profilePhoto: "Photo de profil",
  activityStatus: "Statut actuel",
  institutionName: "École, université, entreprise ou établissement",
  shopName: "Nom de la boutique",
  shopDescription: "Description de la boutique",
  pickupAddress: "Adresse de récupération",
  moncashNumber: "Numéro MonCash",
  moncashAccountName: "Nom du titulaire MonCash",
};

export default function BecomeSellerPage({ api, user, updateUser }) {
  const [form, setForm] = useState(() => ({
    ...initialForm,
    fullName: user.name || "",
    email: user.email || "",
    primaryPhone: user.phone || "",
    profilePhoto: user.profile_image_url || null,
    moncashNumber: user.phone || "",
    moncashAccountName: user.name || "",
  }));
  const [request, setRequest] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [accepted, setAccepted] = useState([]);
  const [previews, setPreviews] = useState({
    profilePhoto: user.profile_image_url ? `${apiOrigin}${user.profile_image_url}` : "",
  });

  useEffect(() => {
    api
      .get("/seller/requests/mine")
      .then(({ data }) => setRequest(data))
      .catch(() => setRequest(null));
  }, [api]);

  const allTermsAccepted = accepted.length === terms.length;

  const sellerRequestData = useMemo(
    () => ({
      ...form,
      profilePhoto:
        form.profilePhoto instanceof File ? form.profilePhoto.name : form.profilePhoto || "",
      shopLogo: form.shopLogo instanceof File ? form.shopLogo.name : "",
      status: "pending",
    }),
    [form]
  );

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const setFile = (field, file) => {
    setField(field, file || null);
    setPreviews((current) => ({
      ...current,
      [field]: file ? URL.createObjectURL(file) : "",
    }));
  };

  const validate = () => {
    const nextErrors = {};

    for (const [field, label] of Object.entries(requiredLabels)) {
      if (!form[field]) nextErrors[field] = `${label} est obligatoire.`;
    }

    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = "Adresse email invalide.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openConfirmation = (event) => {
    event.preventDefault();
    setMessage("");
    setApiError("");
    if (validate()) setModalOpen(true);
  };

  const confirmSubmit = async () => {
    if (!allTermsAccepted || !validate()) return;
    setApiError("");

    try {
      const requestFormData = new FormData();
      const requestDetails = { ...sellerRequestData };
      delete requestDetails.profilePhoto;
      delete requestDetails.shopLogo;
      requestFormData.append("businessName", sellerRequestData.shopName);
      requestFormData.append("moncashNumber", sellerRequestData.moncashNumber);
      requestFormData.append("moncashAccountName", sellerRequestData.moncashAccountName);
      requestFormData.append("description", JSON.stringify(requestDetails, null, 2));
      requestFormData.append("termsAccepted", "true");
      requestFormData.append("termsVersion", SELLER_TERMS_VERSION);
      if (form.profilePhoto instanceof File) {
        requestFormData.append("profilePhoto", form.profilePhoto);
      }
      if (form.shopLogo instanceof File) {
        requestFormData.append("shopLogo", form.shopLogo);
      }
      await api.post("/seller/requests", requestFormData);
      const { data: refreshedSession } = await api.get("/auth/me");
      if (refreshedSession.user) updateUser(refreshedSession.user);
      const { data } = await api.get("/seller/requests/mine");
      setRequest(data);
      setMessage("Votre demande vendeur a été envoyée avec succès.");
      setModalOpen(false);
    } catch (error) {
      setApiError(error.response?.data?.message || "Impossible d’envoyer votre demande vendeur.");
      setModalOpen(false);
    }
  };

  return (
    <div className="become-seller-page">
      <motion.section
        className="seller-hero"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <span>VinnHT vendeur vérifié</span>
          <h1>Devenez vendeur sur VinnHT</h1>
          <p>
            Développez votre activité, vendez partout en Haïti et inspirez confiance aux acheteurs
            grâce à un profil vérifié.
          </p>
          <div className="seller-hero-actions">
            <a href="#seller-request-form">Commencer ma demande</a>
            <button type="button" onClick={() => setModalOpen(true)}>
              Voir les conditions
            </button>
          </div>
        </div>
        <div className="seller-hero-visual">
          {[Store, ShieldCheck, UserCheck, Package].map((Icon, index) => (
            <motion.span
              animate={{ y: [0, index % 2 ? 8 : -8, 0] }}
              transition={{ duration: 4 + index * 0.4, repeat: Infinity }}
              key={index}
            >
              <Icon />
            </motion.span>
          ))}
        </div>
      </motion.section>

      <section className="seller-benefits-grid">
        {[
          [
            Store,
            "Vendez partout en Haïti",
            "Présentez vos produits aux clients de plusieurs villes et départements.",
          ],
          [
            UserCheck,
            "Profil vendeur vérifié",
            "Votre photo, vos informations et votre boutique aident les acheteurs à vous faire confiance.",
          ],
          [
            Package,
            "Gestion simple",
            "Ajoutez vos produits, gérez vos commandes et suivez vos ventes depuis votre dashboard.",
          ],
          [
            ShieldCheck,
            "Paiement sécurisé",
            "Le client paie VinnHT. Après réception confirmée, vos fonds sont transférés vers le compte MonCash déclaré.",
          ],
        ].map(([Icon, title, text]) => (
          <motion.article whileHover={{ y: -5 }} key={title}>
            <span>
              <Icon />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </motion.article>
        ))}
      </section>

      {(message || request) && (
        <section className="seller-success-card">
          <CheckCircle2 />
          <div>
            <h2>{message || "Votre demande vendeur est enregistrée."}</h2>
            <p>
              L’équipe VinnHT examinera vos informations. Vous recevrez une réponse après validation
              par un manager ou un administrateur.
            </p>
            <strong>Statut de la demande : {request.status || "En attente d’approbation"}</strong>
          </div>
        </section>
      )}

      {apiError && <div className="seller-form-error">{apiError}</div>}

      <form
        id="seller-request-form"
        className="seller-verification-form"
        onSubmit={openConfirmation}
      >
        <FormSection
          icon={UserCheck}
          title="Informations personnelles"
          note="Une photo de profil réelle est obligatoire pour inspirer confiance aux acheteurs."
        >
          <TextField
            label="Nom complet"
            field="fullName"
            form={form}
            errors={errors}
            onChange={setField}
          />
          <TextField
            label="Date de naissance"
            field="birthDate"
            type="date"
            form={form}
            errors={errors}
            onChange={setField}
          />
          <TextField
            label="Téléphone principal"
            field="primaryPhone"
            form={form}
            errors={errors}
            onChange={setField}
          />
          <TextField
            label="Téléphone secondaire facultatif"
            field="secondaryPhone"
            form={form}
            errors={errors}
            onChange={setField}
          />
          <TextField
            label="Email"
            field="email"
            type="email"
            form={form}
            errors={errors}
            onChange={setField}
          />
          <TextField
            label="Adresse complète"
            field="fullAddress"
            form={form}
            errors={errors}
            onChange={setField}
          />
          <TextField label="Ville" field="city" form={form} errors={errors} onChange={setField} />
          <TextField
            label="Département"
            field="department"
            form={form}
            errors={errors}
            onChange={setField}
          />
          <FileField
            label="Photo de profil récente"
            field="profilePhoto"
            errors={errors}
            previews={previews}
            onChange={setFile}
            round
          />
        </FormSection>

        <FormSection
          icon={GraduationCap}
          title="Votre situation actuelle"
          note="Dites-nous simplement ce que vous faites actuellement. Cette information aide VinnHT à mieux comprendre votre profil."
        >
          <div className="seller-status-selector full">
            {[
              ["Étudiant", GraduationCap, "Université ou faculté"],
              ["Écolier", GraduationCap, "École ou lycée"],
              ["Employé", BriefcaseBusiness, "Entreprise ou établissement"],
              ["Entrepreneur", Store, "Entreprise ou activité"],
              ["Autre", UserCheck, "Précisez votre situation"],
            ].map(([status, Icon, helper]) => (
              <button
                className={form.activityStatus === status ? "active" : ""}
                type="button"
                onClick={() => setField("activityStatus", status)}
                key={status}
              >
                <Icon />
                <span>
                  <b>{status}</b>
                  <small>{helper}</small>
                </span>
              </button>
            ))}
            {errors.activityStatus && (
              <small className="status-error">{errors.activityStatus}</small>
            )}
          </div>
          <TextField
            label={
              form.activityStatus === "Etudiant"
                ? "Dans quelle universite etudiez-vous"
                : form.activityStatus === "Ecolier"
                  ? "Dans quelle ecole etudiez-vous"
                  : form.activityStatus === "Employe"
                    ? "Dans quel etablissement travaillez-vous"
                    : form.activityStatus === "Entrepreneur"
                      ? "Quel est le nom de votre entreprise ou activite"
                      : "Ecole, universite, entreprise ou etablissement"
            }
            field="institutionName"
            form={form}
            errors={errors}
            onChange={setField}
          />
          <label>
            Fonction, niveau d’études ou précision facultative
            <input
              value={form.activityDetails}
              onChange={(event) => setField("activityDetails", event.target.value)}
              placeholder="Ex : étudiant en informatique, responsable de boutique..."
            />
          </label>
        </FormSection>

        <FormSection
          icon={Store}
          title="Informations boutique"
          note="Une boutique VinnHT peut vendre dans plusieurs rayons. Vous choisirez le rayon adapté chaque fois que vous publierez un produit."
        >
          <TextField
            label="Nom de la boutique"
            field="shopName"
            form={form}
            errors={errors}
            onChange={setField}
          />
          <label className="full">
            Description de la boutique
            <textarea
              rows="6"
              value={form.shopDescription}
              onChange={(event) => setField("shopDescription", event.target.value)}
            />
            {errors.shopDescription && <small>{errors.shopDescription}</small>}
          </label>
          <FileField
            label="Logo boutique facultatif"
            field="shopLogo"
            errors={errors}
            previews={previews}
            onChange={setFile}
            optional
            round
          />
          <TextField
            label="Adresse de récupération des commandes"
            field="pickupAddress"
            form={form}
            errors={errors}
            onChange={setField}
          />
          <TextField
            label="Numéro MonCash pour recevoir vos fonds"
            field="moncashNumber"
            form={form}
            errors={errors}
            onChange={setField}
          />
          <TextField
            label="Nom complet affiché sur le compte MonCash"
            field="moncashAccountName"
            form={form}
            errors={errors}
            onChange={setField}
          />
          <div className="seller-vendor-principles full">
            <article>
              <b>MonCash réel obligatoire</b>
              <p>Le numéro MonCash et le nom du titulaire doivent être vrais, exacts et utilisables pour recevoir vos paiements.</p>
            </article>
            <article>
              <b>Commission VinnHT · 4%</b>
              <p>VinnHT retiendra une commission de 4% sur les revenus validés avant tout transfert vers votre compte MonCash.</p>
            </article>
          </div>
          <p className="seller-moncash-help full">
            Vérifiez attentivement ces informations. VinnHT les utilisera pour transférer vos fonds
            après confirmation de la réception par le client. Un faux nom ou un faux numéro MonCash peut bloquer votre demande ou suspendre votre espace vendeur.
          </p>
        </FormSection>

        <button className="seller-submit-button" type="submit">
          Continuer vers les conditions
        </button>
      </form>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="seller-terms-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="seller-terms-modal"
              initial={{ opacity: 0, y: 28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
            >
              <button className="terms-close" onClick={() => setModalOpen(false)} type="button">
                <X />
              </button>
              <span>
                <ShieldCheck />
              </span>
              <h2>Conditions pour devenir vendeur VinnHT</h2>
              <p>
                Votre formulaire est prêt. Lisez et acceptez toutes les conditions avant son envoi
                définitif. Version {SELLER_TERMS_VERSION}.
              </p>
              <div className="seller-terms-alert">
                <article>
                  <b>Compte MonCash vérifiable</b>
                  <span>Le numéro et le nom déclarés doivent correspondre à un vrai compte pouvant recevoir vos transferts.</span>
                </article>
                <article>
                  <b>Commission plateforme</b>
                  <span>VinnHT appliquera une commission fixe de 4% sur vos revenus validés.</span>
                </article>
              </div>
              <div className="terms-checklist">
                {terms.map((term, index) => (
                  <label key={term}>
                    <input
                      type="checkbox"
                      checked={accepted.includes(index)}
                      onChange={() =>
                        setAccepted((current) =>
                          current.includes(index)
                             ? current.filter((item) => item !== index)
                            : [...current, index]
                        )
                      }
                    />
                    {term}
                  </label>
                ))}
              </div>
              <footer>
                <button type="button" onClick={() => setModalOpen(false)}>
                  Annuler
                </button>
                <button type="button" disabled={!allTermsAccepted} onClick={confirmSubmit}>
                  Accepter et envoyer la demande
                </button>
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FormSection({ icon: Icon, title, note, children }) {
  return (
    <section className="seller-form-section">
      <header>
        <span>
          <Icon />
        </span>
        <div>
          <h2>{title}</h2>
          {note && <p>{note}</p>}
        </div>
      </header>
      <div className="seller-form-grid">{children}</div>
    </section>
  );
}

function TextField({ label, field, form, errors, onChange, type = "text" }) {
  return (
    <label>
      {label}
      <input
        type={type}
        value={form[field]}
        onChange={(event) => onChange(field, event.target.value)}
      />
      {errors[field] && <small>{errors[field]}</small>}
    </label>
  );
}

function FileField({ label, field, errors, previews, onChange, optional = false, round = false }) {
  return (
    <label className={`seller-file-field ${round ? "round" : ""}`}>
      {label}
      <input
        type="file"
        accept="image/*"
        onChange={(event) => onChange(field, event.target.files?.[0])}
      />
      <div>
        {previews[field] ? (
          <img src={previews[field]} alt={`Aperçu ${label}`} />
        ) : (
          <span>
            <UploadCloud />
            Importer une image
          </span>
        )}
      </div>
      {!optional && errors[field] && <small>{errors[field]}</small>}
    </label>
  );
}

