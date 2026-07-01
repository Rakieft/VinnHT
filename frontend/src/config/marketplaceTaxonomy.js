export const marketplaceTaxonomy = [
  {
    name: "Supermarché",
    slug: "supermarche",
    icon: "basket",
    groups: [
      { name: "Alimentation", slug: "alimentation", types: ["Riz & céréales", "Farine & pâtes", "Huiles & épices", "Conserves", "Produits frais"] },
      { name: "Boissons", slug: "boissons", types: ["Eau", "Jus", "Boissons gazeuses", "Café & thé"] },
      { name: "Hygiène", slug: "hygiene", types: ["Hygiène personnelle", "Bébé", "Papier & mouchoirs", "Soins du corps"] },
      { name: "Entretien", slug: "entretien", types: ["Lessive", "Nettoyage maison", "Vaisselle", "Désodorisants"] },
    ],
  },
  {
    name: "Électronique",
    slug: "electronique",
    icon: "smartphone",
    groups: [
      { name: "Téléphones", slug: "telephones", types: ["Smartphones", "Téléphones simples", "Tablettes", "Montres connectées"] },
      { name: "Informatique", slug: "informatique", types: ["Ordinateurs portables", "Ordinateurs de bureau", "Écrans", "Imprimantes", "Réseau"] },
      { name: "Audio & vidéo", slug: "audio-video", types: ["Casques", "Écouteurs", "Enceintes", "Téléviseurs", "Projecteurs"] },
      { name: "Accessoires", slug: "accessoires-electroniques", types: ["Chargeurs", "Câbles", "Coques", "Stockage", "Claviers & souris"] },
    ],
  },
  {
    name: "Mode",
    slug: "mode",
    icon: "bag",
    groups: [
      { name: "Femme", slug: "femme", types: ["Robes", "Hauts", "Pantalons", "Jupes", "Chaussures", "Sacs", "Bijoux"] },
      { name: "Homme", slug: "homme", types: ["Chemises", "T-shirts", "Pantalons", "Costumes", "Chaussures", "Tennis", "Montres"] },
      { name: "Enfant", slug: "enfant", types: ["Vêtements enfant", "Bébé", "Chaussures enfant", "Accessoires enfant"] },
      { name: "Mixte", slug: "mixte", types: ["Tennis", "Vêtements sport", "Casquettes", "Sacs à dos", "Accessoires"] },
    ],
  },
  {
    name: "Maison & Meubles",
    slug: "maison-meubles",
    icon: "sofa",
    groups: [
      { name: "Meubles", slug: "meubles", types: ["Salon", "Chambre", "Bureau", "Rangement", "Meubles enfant"] },
      { name: "Cuisine", slug: "cuisine", types: ["Électroménager", "Ustensiles", "Vaisselle", "Rangement cuisine"] },
      { name: "Décoration", slug: "decoration", types: ["Luminaires", "Rideaux", "Tapis", "Décoration murale"] },
      { name: "Literie", slug: "literie", types: ["Matelas", "Draps", "Oreillers", "Couvertures"] },
    ],
  },
  {
    name: "Véhicules",
    slug: "vehicules",
    icon: "car",
    groups: [
      { name: "Voitures", slug: "voitures", types: ["Berlines", "SUV", "Pick-up", "Utilitaires", "Voitures d'occasion"] },
      { name: "Motos", slug: "motos", types: ["Motos", "Scooters", "Tricycles", "Motos d'occasion"] },
      { name: "Pièces", slug: "pieces", types: ["Moteur", "Freinage", "Pneus & jantes", "Carrosserie", "Électricité"] },
      { name: "Accessoires", slug: "accessoires-vehicules", types: ["Casques", "Audio auto", "Entretien", "Sécurité"] },
    ],
  },
  {
    name: "Immobilier",
    slug: "immobilier",
    icon: "building",
    groups: [
      { name: "À vendre", slug: "a-vendre", types: ["Maisons", "Appartements", "Immeubles", "Locaux commerciaux"] },
      { name: "À louer", slug: "a-louer", types: ["Maisons", "Appartements", "Chambres", "Bureaux"] },
      { name: "Terrains", slug: "terrains", types: ["Résidentiel", "Agricole", "Commercial", "Industriel"] },
      { name: "Saisonnier", slug: "saisonnier", types: ["Vacances", "Événements", "Courte durée"] },
    ],
  },
  {
    name: "Services",
    slug: "services",
    icon: "briefcase",
    groups: [
      { name: "Maison", slug: "services-maison", types: ["Plomberie", "Électricité", "Nettoyage", "Construction", "Déménagement"] },
      { name: "Numérique", slug: "services-numeriques", types: ["Design", "Développement", "Marketing", "Réparation informatique"] },
      { name: "Événement", slug: "evenement", types: ["Traiteur", "Photographie", "Décoration", "Sonorisation"] },
      { name: "Transport", slug: "transport", types: ["Livraison", "Taxi", "Location véhicule", "Transport marchandises"] },
    ],
  },
  {
    name: "Emplois",
    slug: "emplois",
    icon: "users",
    groups: [
      { name: "Emplois", slug: "emplois-offres", types: ["Temps plein", "Temps partiel", "Contrat", "Travail temporaire"] },
      { name: "Freelance", slug: "freelance", types: ["Numérique", "Création", "Conseil", "Services professionnels"] },
      { name: "Début de carrière", slug: "debut-carriere", types: ["Stages", "Apprentissage", "Premier emploi"] },
      { name: "Formations", slug: "formations", types: ["Professionnelle", "Langues", "Informatique", "Entrepreneuriat"] },
    ],
  },
  {
    name: "Agriculture",
    slug: "agriculture",
    icon: "sprout",
    groups: [
      { name: "Cultures", slug: "cultures", types: ["Semences", "Plants", "Récoltes", "Engrais", "Protection des cultures"] },
      { name: "Élevage", slug: "elevage", types: ["Volaille", "Bovins", "Caprins", "Porcins", "Aquaculture"] },
      { name: "Matériel", slug: "materiel-agricole", types: ["Outils", "Machines", "Irrigation", "Stockage"] },
      { name: "Produits locaux", slug: "produits-locaux", types: ["Fruits", "Légumes", "Céréales", "Produits transformés"] },
    ],
  },
  {
    name: "Animaux",
    slug: "animaux",
    icon: "heart",
    groups: [
      { name: "Animaux", slug: "animaux-domestiques", types: ["Chiens", "Chats", "Oiseaux", "Poissons", "Autres animaux"] },
      { name: "Alimentation", slug: "alimentation-animaux", types: ["Chiens", "Chats", "Oiseaux", "Élevage"] },
      { name: "Soins", slug: "soins-animaux", types: ["Hygiène", "Santé", "Toilettage"] },
      { name: "Accessoires", slug: "accessoires-animaux", types: ["Colliers", "Cages", "Aquariums", "Jouets"] },
    ],
  },
  {
    name: "Beauté & Soins",
    slug: "beaute-soins",
    icon: "sparkles",
    groups: [
      { name: "Beauté", slug: "beaute", types: ["Maquillage", "Ongles", "Accessoires beauté"] },
      { name: "Cheveux", slug: "cheveux", types: ["Produits capillaires", "Perruques", "Tresses", "Appareils coiffants"] },
      { name: "Parfums", slug: "parfums", types: ["Femme", "Homme", "Mixte", "Brumes"] },
      { name: "Soins", slug: "soins", types: ["Visage", "Corps", "Bien-être", "Hygiène"] },
    ],
  },
  {
    name: "Autres",
    slug: "autres",
    icon: "grid",
    groups: [
      { name: "Fournitures", slug: "fournitures", types: ["Scolaires", "Bureau", "Livres", "Impression"] },
      { name: "Artisanat", slug: "artisanat", types: ["Art local", "Décoration", "Cadeaux", "Personnalisation"] },
      { name: "Occasions", slug: "occasions", types: ["Produits d'occasion", "Collections", "Antiquités"] },
      { name: "Divers", slug: "divers", types: ["Nouveautés", "Loisirs", "Autres produits"] },
    ],
  },
];

export const taxonomySlug = (label = "") =>
  String(label)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const getTaxonomyRayon = (slug) =>
  marketplaceTaxonomy.find((rayon) => rayon.slug === slug) || null;

export const getTaxonomyGroup = (rayonSlug, groupSlug) =>
  getTaxonomyRayon(rayonSlug)?.groups.find((group) => group.slug === groupSlug) || null;

export const getTaxonomyTypeLabel = (rayonSlug, groupSlug, typeSlug) =>
  getTaxonomyGroup(rayonSlug, groupSlug)?.types.find(
    (type) => taxonomySlug(type) === typeSlug,
  ) || "";
