const commonConditionOptions = [
  "Neuf",
  "Comme neuf",
  "Bon état",
  "État acceptable",
  "Reconditionné",
];

export const productAttributeSchemas = {
  supermarche: [
    { key: "brand", label: "Marque", placeholder: "Ex. Bongu, Comme Il Faut" },
    {
      key: "format",
      label: "Format ou quantité",
      placeholder: "Ex. 1 kg, paquet de 12, 500 ml",
      required: true,
    },
    { key: "origin", label: "Origine", placeholder: "Ex. Haïti, Artibonite" },
    { key: "expiryDate", label: "Date d’expiration", type: "date" },
  ],
  electronique: [
    { key: "brand", label: "Marque", placeholder: "Ex. Samsung", required: true },
    { key: "model", label: "Modèle", placeholder: "Ex. Galaxy A54", required: true },
    {
      key: "condition",
      label: "État",
      type: "select",
      options: commonConditionOptions,
      required: true,
    },
    { key: "color", label: "Couleur", placeholder: "Ex. Noir" },
    { key: "capacity", label: "Capacité ou mémoire", placeholder: "Ex. 128 Go, 8 Go RAM" },
    { key: "warranty", label: "Garantie", placeholder: "Ex. 6 mois" },
  ],
  mode: [
    {
      key: "audience",
      label: "Pour",
      type: "select",
      options: ["Femme", "Homme", "Fille", "Garçon", "Unisexe"],
      required: true,
    },
    { key: "size", label: "Taille", placeholder: "Ex. M, XL, 38", required: true },
    { key: "color", label: "Couleur", placeholder: "Ex. Bleu royal", required: true },
    { key: "material", label: "Matière", placeholder: "Ex. Coton, cuir" },
    {
      key: "condition",
      label: "État",
      type: "select",
      options: commonConditionOptions,
      required: true,
    },
  ],
  "maison-meubles": [
    { key: "material", label: "Matière principale", placeholder: "Ex. Bois, métal", required: true },
    { key: "dimensions", label: "Dimensions", placeholder: "Ex. 180 × 90 × 75 cm" },
    { key: "color", label: "Couleur", placeholder: "Ex. Beige" },
    {
      key: "condition",
      label: "État",
      type: "select",
      options: commonConditionOptions,
      required: true,
    },
  ],
  vehicules: [
    { key: "brand", label: "Marque", placeholder: "Ex. Toyota", required: true },
    { key: "model", label: "Modèle", placeholder: "Ex. RAV4", required: true },
    { key: "year", label: "Année", type: "number", min: 1950, required: true },
    { key: "mileage", label: "Kilométrage", type: "number", min: 0 },
    {
      key: "fuel",
      label: "Carburant",
      type: "select",
      options: ["Essence", "Diesel", "Électrique", "Hybride", "Autre"],
      required: true,
    },
    {
      key: "transmission",
      label: "Transmission",
      type: "select",
      options: ["Automatique", "Manuelle"],
      required: true,
    },
    {
      key: "condition",
      label: "État",
      type: "select",
      options: commonConditionOptions,
      required: true,
    },
  ],
  immobilier: [
    {
      key: "listingType",
      label: "Type d’offre",
      type: "select",
      options: ["À vendre", "À louer"],
      required: true,
    },
    {
      key: "propertyType",
      label: "Type de bien",
      type: "select",
      options: ["Maison", "Appartement", "Terrain", "Local commercial", "Bureau", "Autre"],
      required: true,
    },
    { key: "area", label: "Superficie en m²", type: "number", min: 0, required: true },
    { key: "bedrooms", label: "Chambres", type: "number", min: 0 },
    { key: "bathrooms", label: "Salles de bain", type: "number", min: 0 },
    {
      key: "furnished",
      label: "Meublé",
      type: "select",
      options: ["Oui", "Non", "Partiellement"],
    },
  ],
  services: [
    { key: "serviceType", label: "Type de service", placeholder: "Ex. Réparation", required: true },
    {
      key: "deliveryMode",
      label: "Mode de prestation",
      type: "select",
      options: ["À domicile", "En boutique", "À distance", "Sur rendez-vous"],
      required: true,
    },
    { key: "availability", label: "Disponibilité", placeholder: "Ex. Lundi au samedi" },
    { key: "experience", label: "Expérience", placeholder: "Ex. 5 ans" },
  ],
  emplois: [
    { key: "jobTitle", label: "Poste proposé", placeholder: "Ex. Comptable", required: true },
    {
      key: "contractType",
      label: "Type de contrat",
      type: "select",
      options: ["Temps plein", "Temps partiel", "Contrat", "Stage", "Freelance"],
      required: true,
    },
    { key: "salary", label: "Salaire ou fourchette", placeholder: "Ex. 45 000 HTG/mois" },
    { key: "experience", label: "Expérience demandée", placeholder: "Ex. 2 ans" },
    { key: "education", label: "Niveau d’études", placeholder: "Ex. Licence" },
    { key: "deadline", label: "Date limite", type: "date" },
  ],
  agriculture: [
    { key: "productType", label: "Type de produit", placeholder: "Ex. Mangues", required: true },
    { key: "variety", label: "Variété", placeholder: "Ex. Francisque" },
    { key: "unit", label: "Unité de vente", placeholder: "Ex. Sac, caisse, kilogramme", required: true },
    { key: "harvestDate", label: "Date de récolte", type: "date" },
    { key: "origin", label: "Zone de production", placeholder: "Ex. Léogâne", required: true },
    {
      key: "organic",
      label: "Culture biologique",
      type: "select",
      options: ["Oui", "Non", "Non certifié"],
    },
  ],
  animaux: [
    { key: "species", label: "Espèce", placeholder: "Ex. Chien, poule", required: true },
    { key: "breed", label: "Race", placeholder: "Ex. Berger allemand" },
    { key: "age", label: "Âge", placeholder: "Ex. 8 mois", required: true },
    {
      key: "sex",
      label: "Sexe",
      type: "select",
      options: ["Mâle", "Femelle", "Non précisé"],
      required: true,
    },
    {
      key: "vaccinated",
      label: "Vaccination",
      type: "select",
      options: ["À jour", "Partielle", "Non vaccinée", "Non applicable"],
      required: true,
    },
  ],
  "beaute-soins": [
    { key: "brand", label: "Marque", placeholder: "Ex. Nivea" },
    { key: "productType", label: "Type de produit", placeholder: "Ex. Crème visage", required: true },
    { key: "format", label: "Contenance", placeholder: "Ex. 250 ml", required: true },
    { key: "skinType", label: "Type de peau ou cheveux", placeholder: "Ex. Peau sèche" },
    { key: "expiryDate", label: "Date d’expiration", type: "date" },
  ],
  autres: [
    { key: "brand", label: "Marque", placeholder: "Facultatif" },
    { key: "model", label: "Modèle ou référence", placeholder: "Facultatif" },
    {
      key: "condition",
      label: "État",
      type: "select",
      options: commonConditionOptions,
      required: true,
    },
  ],
};

export const getProductAttributeFields = (category) => {
  if (!category) return [];
  return (
    productAttributeSchemas[category.slug || category.category_slug] ||
    productAttributeSchemas.autres
  );
};

export const parseProductAttributes = (value) => {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export const productAttributeEntries = (product) => {
  const attributes = parseProductAttributes(product?.attributes);
  const fields =
    productAttributeSchemas[product?.category_slug] ||
    Object.keys(attributes).map((key) => ({ key, label: key }));

  return fields
    .filter((field) => attributes[field.key] !== undefined && attributes[field.key] !== "")
    .map((field) => ({
      key: field.key,
      label: field.label,
      value: attributes[field.key],
    }));
};
