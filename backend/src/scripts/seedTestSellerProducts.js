import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../config/database.js";

const backendDirectory = fileURLToPath(new URL("../../", import.meta.url));
const productImageDirectory = path.join(backendDirectory, "uploads", "products");

const imageUrl = (photoId) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=900&h=900&q=72`;

const products = [
  {
    sellerEmail: "vendeur01@vinnht.test",
    category: "mode",
    name: "Sneakers Converse Chuck 70 noir",
    slug: "test-lakay-mode-converse-chuck-70-noir",
    description: "Sneakers montantes confortables pour une tenue urbaine et quotidienne.",
    price: 8500,
    stock: 14,
    department: "Ouest",
    city: "Petion-Ville",
    attributes: {
      audience: "Unisexe",
      size: "38 a 44",
      color: "Noir",
      material: "Toile et caoutchouc",
      condition: "Neuf",
    },
    image: imageUrl("photo-1542291026-7eec264c27ff"),
    filename: "test-lakay-mode-converse.jpg",
  },
  {
    sellerEmail: "vendeur01@vinnht.test",
    category: "mode",
    name: "Robe midi elegante femme",
    slug: "test-lakay-mode-robe-midi-elegante",
    description: "Robe midi elegante, legere et adaptee aux sorties comme aux receptions.",
    price: 6200,
    stock: 9,
    department: "Ouest",
    city: "Petion-Ville",
    attributes: {
      audience: "Femme",
      size: "S a XL",
      color: "Bleu royal",
      material: "Polyester premium",
      condition: "Neuf",
    },
    image: imageUrl("photo-1595777457583-95e059d581b8"),
    filename: "test-lakay-mode-robe-midi.jpg",
  },
  {
    sellerEmail: "vendeur01@vinnht.test",
    category: "mode",
    name: "Sac a main cuir caramel",
    slug: "test-lakay-mode-sac-main-cuir",
    description: "Sac a main structure avec plusieurs compartiments et finition soignee.",
    price: 7300,
    stock: 11,
    department: "Ouest",
    city: "Petion-Ville",
    attributes: {
      audience: "Femme",
      size: "Moyen",
      color: "Caramel",
      material: "Cuir synthetique",
      condition: "Neuf",
    },
    image: imageUrl("photo-1584917865442-de89df76afd3"),
    filename: "test-lakay-mode-sac-cuir.jpg",
  },
  {
    sellerEmail: "vendeur02@vinnht.test",
    category: "electronique",
    name: "Samsung Galaxy A15 128 Go",
    slug: "test-tech-ayiti-samsung-galaxy-a15",
    description: "Telephone double SIM avec ecran lumineux, grande autonomie et stockage genereux.",
    price: 28500,
    stock: 8,
    department: "Ouest",
    city: "Delmas",
    attributes: {
      brand: "Samsung",
      model: "Galaxy A15",
      condition: "Neuf",
      color: "Bleu nuit",
      capacity: "128 Go, 6 Go RAM",
      warranty: "6 mois",
    },
    image: imageUrl("photo-1511707171634-5f897ff02aa9"),
    filename: "test-tech-ayiti-galaxy-a15.jpg",
  },
  {
    sellerEmail: "vendeur02@vinnht.test",
    category: "electronique",
    name: "Laptop HP EliteBook 840 G7",
    slug: "test-tech-ayiti-hp-elitebook-840-g7",
    description: "Ordinateur portable professionnel rapide pour etudes, travail et visioconferences.",
    price: 87500,
    stock: 5,
    department: "Ouest",
    city: "Delmas",
    attributes: {
      brand: "HP",
      model: "EliteBook 840 G7",
      condition: "Reconditionne",
      color: "Argent",
      capacity: "SSD 512 Go, 16 Go RAM",
      warranty: "3 mois",
    },
    image: imageUrl("photo-1496181133206-80ce9b88a853"),
    filename: "test-tech-ayiti-hp-elitebook.jpg",
  },
  {
    sellerEmail: "vendeur02@vinnht.test",
    category: "electronique",
    name: "Casque Bluetooth JBL Tune 510BT",
    slug: "test-tech-ayiti-jbl-tune-510bt",
    description: "Casque sans fil pliable avec son puissant et autonomie longue duree.",
    price: 9500,
    stock: 18,
    department: "Ouest",
    city: "Delmas",
    attributes: {
      brand: "JBL",
      model: "Tune 510BT",
      condition: "Neuf",
      color: "Noir",
      capacity: "Autonomie 40 heures",
      warranty: "3 mois",
    },
    image: imageUrl("photo-1505740420928-5e560c06d30e"),
    filename: "test-tech-ayiti-jbl-casque.jpg",
  },
  {
    sellerEmail: "vendeur03@vinnht.test",
    category: "supermarche",
    name: "Panier de fruits frais locaux",
    slug: "test-marche-fraicheur-panier-fruits",
    description: "Assortiment de fruits frais selectionnes pour la maison et les jus naturels.",
    price: 2500,
    stock: 20,
    department: "Artibonite",
    city: "Saint-Marc",
    attributes: {
      brand: "Marche Fraicheur",
      format: "Panier de 5 kg",
      origin: "Artibonite, Haiti",
      expiryDate: "2026-07-15",
    },
    image: imageUrl("photo-1610832958506-aa56368176cf"),
    filename: "test-marche-fraicheur-fruits.jpg",
  },
  {
    sellerEmail: "vendeur03@vinnht.test",
    category: "supermarche",
    name: "Sac de riz premium 25 kg",
    slug: "test-marche-fraicheur-riz-premium-25kg",
    description: "Riz blanc de bonne qualite pour les familles, restaurants et evenements.",
    price: 6800,
    stock: 30,
    department: "Artibonite",
    city: "Saint-Marc",
    attributes: {
      brand: "Riz Lakay",
      format: "Sac de 25 kg",
      origin: "Artibonite, Haiti",
      expiryDate: "2027-06-30",
    },
    image: imageUrl("photo-1586201375761-83865001e31c"),
    filename: "test-marche-fraicheur-riz.jpg",
  },
  {
    sellerEmail: "vendeur03@vinnht.test",
    category: "supermarche",
    name: "Huile vegetale 1.5 litre",
    slug: "test-marche-fraicheur-huile-vegetale",
    description: "Huile vegetale raffinee adaptee a la cuisson quotidienne et aux fritures.",
    price: 1200,
    stock: 42,
    department: "Artibonite",
    city: "Saint-Marc",
    attributes: {
      brand: "Bon Gout",
      format: "Bouteille de 1.5 litre",
      origin: "Haiti",
      expiryDate: "2027-03-31",
    },
    image: imageUrl("photo-1474979266404-7eaacbcd87c5"),
    filename: "test-marche-fraicheur-huile.jpg",
  },
  {
    sellerEmail: "vendeur04@vinnht.test",
    category: "maison-meubles",
    name: "Canape moderne trois places",
    slug: "test-maison-kreyol-canape-trois-places",
    description: "Canape confortable au design moderne pour salon familial ou espace professionnel.",
    price: 65000,
    stock: 4,
    department: "Nord",
    city: "Cap-Haitien",
    attributes: {
      material: "Bois et tissu",
      dimensions: "210 x 90 x 85 cm",
      color: "Beige",
      condition: "Neuf",
    },
    image: imageUrl("photo-1555041469-a586c61ea9bc"),
    filename: "test-maison-kreyol-canape.jpg",
  },
  {
    sellerEmail: "vendeur04@vinnht.test",
    category: "maison-meubles",
    name: "Chaise de bureau ergonomique",
    slug: "test-maison-kreyol-chaise-bureau",
    description: "Chaise reglable avec dossier confortable pour bureau, etudes et teletravail.",
    price: 18000,
    stock: 7,
    department: "Nord",
    city: "Cap-Haitien",
    attributes: {
      material: "Metal et maille respirante",
      dimensions: "65 x 65 x 120 cm",
      color: "Noir",
      condition: "Neuf",
    },
    image: imageUrl("photo-1503602642458-232111445657"),
    filename: "test-maison-kreyol-chaise.jpg",
  },
  {
    sellerEmail: "vendeur04@vinnht.test",
    category: "maison-meubles",
    name: "Lampadaire minimaliste salon",
    slug: "test-maison-kreyol-lampadaire-salon",
    description: "Lampadaire decoratif avec lumiere douce pour salon, chambre ou bureau.",
    price: 8500,
    stock: 12,
    department: "Nord",
    city: "Cap-Haitien",
    attributes: {
      material: "Metal",
      dimensions: "Hauteur 165 cm",
      color: "Noir et or",
      condition: "Neuf",
    },
    image: imageUrl("photo-1507473885765-e6ed057f782c"),
    filename: "test-maison-kreyol-lampadaire.jpg",
  },
  {
    sellerEmail: "vendeur05@vinnht.test",
    category: "beaute-soins",
    name: "Kit maquillage complet professionnel",
    slug: "test-beaute-caraibe-kit-maquillage",
    description: "Ensemble de maquillage polyvalent pour usage personnel ou professionnel.",
    price: 5500,
    stock: 16,
    department: "Sud-Est",
    city: "Jacmel",
    attributes: {
      brand: "Caraibe Beauty",
      productType: "Kit maquillage",
      format: "Coffret de 18 pieces",
      skinType: "Tous types de peau",
      expiryDate: "2028-01-31",
    },
    image: imageUrl("photo-1596462502278-27bfdc403348"),
    filename: "test-beaute-caraibe-maquillage.jpg",
  },
  {
    sellerEmail: "vendeur05@vinnht.test",
    category: "beaute-soins",
    name: "Lotion hydratante corps 400 ml",
    slug: "test-beaute-caraibe-lotion-hydratante",
    description: "Lotion nourrissante pour une peau douce et hydratee tout au long de la journee.",
    price: 2200,
    stock: 25,
    department: "Sud-Est",
    city: "Jacmel",
    attributes: {
      brand: "Nivea",
      productType: "Lotion corporelle",
      format: "400 ml",
      skinType: "Peau seche",
      expiryDate: "2027-11-30",
    },
    image: imageUrl("photo-1556228578-8c89e6adf883"),
    filename: "test-beaute-caraibe-lotion.jpg",
  },
  {
    sellerEmail: "vendeur05@vinnht.test",
    category: "beaute-soins",
    name: "Parfum oriental femme 100 ml",
    slug: "test-beaute-caraibe-parfum-oriental",
    description: "Parfum elegant aux notes florales et orientales avec longue tenue.",
    price: 7800,
    stock: 10,
    department: "Sud-Est",
    city: "Jacmel",
    attributes: {
      brand: "Lattafa",
      productType: "Eau de parfum",
      format: "100 ml",
      skinType: "Tous types de peau",
      expiryDate: "2029-05-31",
    },
    image: imageUrl("photo-1541643600914-78b084683601"),
    filename: "test-beaute-caraibe-parfum.jpg",
  },
  {
    sellerEmail: "vendeur06@vinnht.test",
    category: "agriculture",
    name: "Caisse de tomates fraiches",
    slug: "test-agro-lakay-caisse-tomates",
    description: "Tomates fraiches recoltees localement, adaptees aux familles et restaurants.",
    price: 3500,
    stock: 22,
    department: "Centre",
    city: "Hinche",
    attributes: {
      productType: "Tomates",
      variety: "Roma",
      unit: "Caisse de 12 kg",
      harvestDate: "2026-06-25",
      origin: "Hinche",
      organic: "Non certifie",
    },
    image: imageUrl("photo-1592924357228-91a4daadcfea"),
    filename: "test-agro-lakay-tomates.jpg",
  },
  {
    sellerEmail: "vendeur06@vinnht.test",
    category: "agriculture",
    name: "Mangues Francisque selectionnees",
    slug: "test-agro-lakay-mangues-francisque",
    description: "Mangues Francisque parfumees, selectionnees pour consommation ou transformation.",
    price: 3000,
    stock: 19,
    department: "Centre",
    city: "Hinche",
    attributes: {
      productType: "Mangues",
      variety: "Francisque",
      unit: "Caisse de 10 kg",
      harvestDate: "2026-06-24",
      origin: "Plateau Central",
      organic: "Non certifie",
    },
    image: imageUrl("photo-1553279768-865429fa0078"),
    filename: "test-agro-lakay-mangues.jpg",
  },
  {
    sellerEmail: "vendeur06@vinnht.test",
    category: "agriculture",
    name: "Panier de legumes assortis",
    slug: "test-agro-lakay-legumes-assortis",
    description: "Selection de legumes frais pour repas familiaux, hotels et restaurants.",
    price: 2200,
    stock: 26,
    department: "Centre",
    city: "Hinche",
    attributes: {
      productType: "Legumes assortis",
      variety: "Saison",
      unit: "Panier de 7 kg",
      harvestDate: "2026-06-26",
      origin: "Hinche",
      organic: "Non certifie",
    },
    image: imageUrl("photo-1597362925123-77861d3fbac7"),
    filename: "test-agro-lakay-legumes.jpg",
  },
  {
    sellerEmail: "vendeur07@vinnht.test",
    category: "mode",
    name: "Ensemble coton enfant deux pieces",
    slug: "test-ti-moun-ensemble-coton-enfant",
    description: "Ensemble confortable et resistant pour les sorties et activites quotidiennes.",
    price: 4500,
    stock: 17,
    department: "Sud",
    city: "Les Cayes",
    attributes: {
      audience: "Unisexe",
      size: "4 a 10 ans",
      color: "Multicolore",
      material: "Coton",
      condition: "Neuf",
    },
    image: imageUrl("photo-1519238263530-99bdd11df2ea"),
    filename: "test-ti-moun-ensemble.jpg",
  },
  {
    sellerEmail: "vendeur07@vinnht.test",
    category: "autres",
    name: "Jeu de blocs educatifs 80 pieces",
    slug: "test-ti-moun-blocs-educatifs",
    description: "Blocs colores pour stimuler la creativite, la logique et la motricite des enfants.",
    price: 2500,
    stock: 21,
    department: "Sud",
    city: "Les Cayes",
    attributes: {
      brand: "Kids Play",
      model: "Creative 80",
      condition: "Neuf",
    },
    image: imageUrl("photo-1594787318286-3d835c1d207f"),
    filename: "test-ti-moun-blocs.jpg",
  },
  {
    sellerEmail: "vendeur07@vinnht.test",
    category: "mode",
    name: "Chaussures souples premier pas",
    slug: "test-ti-moun-chaussures-premier-pas",
    description: "Chaussures legeres et souples pour accompagner les premiers pas en securite.",
    price: 3200,
    stock: 13,
    department: "Sud",
    city: "Les Cayes",
    attributes: {
      audience: "Unisexe",
      size: "20 a 26",
      color: "Beige",
      material: "Tissu et semelle souple",
      condition: "Neuf",
    },
    image: imageUrl("photo-1514090458221-65bb69cf63e6"),
    filename: "test-ti-moun-chaussures.jpg",
  },
  {
    sellerEmail: "vendeur08@vinnht.test",
    category: "vehicules",
    name: "Toyota Corolla 2016 automatique",
    slug: "test-auto-plus-toyota-corolla-2016",
    description: "Berline fiable et economique, climatisee et entretenue regulierement.",
    price: 1250000,
    stock: 1,
    department: "Artibonite",
    city: "Gonaives",
    attributes: {
      brand: "Toyota",
      model: "Corolla",
      year: 2016,
      mileage: 98000,
      fuel: "Essence",
      transmission: "Automatique",
      condition: "Bon etat",
    },
    image: imageUrl("photo-1492144534655-ae79c964c9d7"),
    filename: "test-auto-plus-corolla.jpg",
  },
  {
    sellerEmail: "vendeur08@vinnht.test",
    category: "vehicules",
    name: "Honda CR-V 2018 AWD",
    slug: "test-auto-plus-honda-crv-2018",
    description: "SUV familial spacieux avec camera de recul, climatisation et traction integrale.",
    price: 2150000,
    stock: 1,
    department: "Artibonite",
    city: "Gonaives",
    attributes: {
      brand: "Honda",
      model: "CR-V AWD",
      year: 2018,
      mileage: 76000,
      fuel: "Essence",
      transmission: "Automatique",
      condition: "Comme neuf",
    },
    image: imageUrl("photo-1503376780353-7e6692767b70"),
    filename: "test-auto-plus-honda-crv.jpg",
  },
  {
    sellerEmail: "vendeur08@vinnht.test",
    category: "vehicules",
    name: "Moto Yamaha FZ 2021",
    slug: "test-auto-plus-yamaha-fz-2021",
    description: "Moto maniable et economique pour les trajets quotidiens et les livraisons.",
    price: 285000,
    stock: 2,
    department: "Artibonite",
    city: "Gonaives",
    attributes: {
      brand: "Yamaha",
      model: "FZ",
      year: 2021,
      mileage: 18500,
      fuel: "Essence",
      transmission: "Manuelle",
      condition: "Bon etat",
    },
    image: imageUrl("photo-1558981806-ec527fa84c39"),
    filename: "test-auto-plus-yamaha-fz.jpg",
  },
];

const downloadImage = async (product) => {
  const destination = path.join(productImageDirectory, product.filename);

  try {
    const existing = await fs.stat(destination);
    if (existing.size > 10_000) return;
  } catch {
    // The image will be downloaded below.
  }

  const response = await fetch(product.image, {
    headers: {
      Accept: "image/jpeg",
      "User-Agent": "VinnHT-Test-Catalog/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Image indisponible pour ${product.name}: ${response.status}`);
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());
  if (imageBuffer.length < 10_000) {
    throw new Error(`Image invalide pour ${product.name}.`);
  }

  await fs.writeFile(destination, imageBuffer);
};

await fs.mkdir(productImageDirectory, { recursive: true });

for (let index = 0; index < products.length; index += 4) {
  await Promise.all(products.slice(index, index + 4).map(downloadImage));
}

const connection = await pool.getConnection();

try {
  await connection.beginTransaction();

  const [sellerRows] = await connection.query(
    `SELECT id,email
     FROM users
     WHERE email IN (${products
       .map((product) => product.sellerEmail)
       .filter((email, index, emails) => emails.indexOf(email) === index)
       .map(() => "?")
       .join(",")})`,
    [...new Set(products.map((product) => product.sellerEmail))],
  );
  const sellerIds = new Map(sellerRows.map((seller) => [seller.email, seller.id]));

  const [categoryRows] = await connection.query("SELECT id,slug FROM categories");
  const categoryIds = new Map(categoryRows.map((category) => [category.slug, category.id]));

  for (const product of products) {
    const sellerId = sellerIds.get(product.sellerEmail);
    const categoryId = categoryIds.get(product.category);

    if (!sellerId) throw new Error(`Vendeur introuvable: ${product.sellerEmail}`);
    if (!categoryId) throw new Error(`Rayon introuvable: ${product.category}`);

    await connection.query(
      `INSERT INTO products
        (seller_id,category_id,name,slug,description,attributes,price,stock,department,city,image_url,status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,'active')
       ON DUPLICATE KEY UPDATE
        seller_id=VALUES(seller_id),
        category_id=VALUES(category_id),
        name=VALUES(name),
        description=VALUES(description),
        attributes=VALUES(attributes),
        price=VALUES(price),
        stock=VALUES(stock),
        department=VALUES(department),
        city=VALUES(city),
        image_url=VALUES(image_url),
        status='active'`,
      [
        sellerId,
        categoryId,
        product.name,
        product.slug,
        product.description,
        JSON.stringify(product.attributes),
        product.price,
        product.stock,
        product.department,
        product.city,
        `/uploads/products/${product.filename}`,
      ],
    );
  }

  const [[verification]] = await connection.query(
    `SELECT
      COUNT(*) products,
      COUNT(DISTINCT seller_id) sellers,
      SUM(status='active' AND stock>0) visible_products
     FROM products
     WHERE slug LIKE 'test-%'`,
  );

  if (
    Number(verification.products) < products.length ||
    Number(verification.sellers) !== 8 ||
    Number(verification.visible_products) < products.length
  ) {
    throw new Error("La verification du catalogue vendeur de test a echoue.");
  }

  await connection.commit();
  console.log(
    `${products.length} produits actifs crees pour ${verification.sellers} boutiques.`,
  );
} catch (error) {
  await connection.rollback();
  console.error(error);
  process.exitCode = 1;
} finally {
  connection.release();
  await pool.end();
}
