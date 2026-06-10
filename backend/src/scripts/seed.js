import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";

const sellers = [
  ["Marché Lakay", "marche.lakay@vinnht.ht"],
  ["Tech Ayiti", "tech.ayiti@vinnht.ht"],
  ["Kay Design", "kay.design@vinnht.ht"],
];

const managementAccounts = [
  {
    name: "Administrateur VinnHT",
    email: "admin@vinnht.ht",
    password: "VinnHTAdmin2026!",
    role: "admin",
  },
  {
    name: "Superviseur VinnHT",
    email: "superviseur@vinnht.ht",
    password: "VinnHTSuper2026!",
    role: "supervisor",
  },
  {
    name: "Manager VinnHT",
    email: "manager@vinnht.ht",
    password: "VinnHTManager2026!",
    role: "manager",
  },
  {
    name: "Livreur Démo VinnHT",
    email: "livreur@vinnht.ht",
    password: "VinnHTLivreur2026!",
    role: "delivery",
  },
];

const products = [
  {
    seller: "marche.lakay@vinnht.ht",
    category: "supermarche",
    name: "Panier fraîcheur peyi",
    slug: "panier-fraicheur-peyi",
    description: "Une sélection fraîche de produits locaux pour votre maison.",
    price: 2450,
    stock: 40,
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
  },
  {
    seller: "tech.ayiti@vinnht.ht",
    category: "electronique",
    name: "Casque audio premium",
    slug: "casque-audio-premium",
    description: "Un casque confortable avec un son clair et puissant.",
    price: 7850,
    stock: 24,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
  },
  {
    seller: "kay.design@vinnht.ht",
    category: "maison-meubles",
    name: "Fauteuil contemporain",
    slug: "fauteuil-contemporain",
    description: "Un fauteuil moderne pensé pour un intérieur élégant.",
    price: 18900,
    stock: 12,
    image:
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=80",
  },
  {
    seller: "tech.ayiti@vinnht.ht",
    category: "electronique",
    name: "Smartphone reconditionné",
    slug: "smartphone-reconditionne",
    description: "Smartphone testé, vérifié et prêt pour votre quotidien.",
    price: 24500,
    stock: 18,
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
  },
];

const connection = await pool.getConnection();

try {
  await connection.beginTransaction();
  const passwordHash = await bcrypt.hash("VinnHTSeller2026!", 12);

  for (const account of managementAccounts) {
    const accountPasswordHash = await bcrypt.hash(account.password, 12);
    await connection.query(
      `INSERT INTO users (name,email,password_hash,role,status)
       VALUES (?,?,?,?,'active')
       ON DUPLICATE KEY UPDATE
        name=VALUES(name),
        password_hash=VALUES(password_hash),
        role=VALUES(role),
        status='active'`,
      [account.name, account.email, accountPasswordHash, account.role],
    );
    const [[createdAccount]] = await connection.query(
      "SELECT id FROM users WHERE email=?",
      [account.email],
    );
    await connection.query(
      "INSERT IGNORE INTO user_roles (user_id,role) VALUES (?,?)",
      [createdAccount.id, account.role],
    );
  }

  for (const [name, email] of sellers) {
    await connection.query(
      `INSERT INTO users (name,email,password_hash,role)
       VALUES (?,?,?,'seller')
       ON DUPLICATE KEY UPDATE name=VALUES(name),role='seller'`,
      [name, email, passwordHash],
    );
    const [[createdSeller]] = await connection.query(
      "SELECT id FROM users WHERE email=?",
      [email],
    );
    await connection.query(
      "INSERT IGNORE INTO user_roles (user_id,role) VALUES (?,'client'),(?,'seller')",
      [createdSeller.id, createdSeller.id],
    );
  }

  for (const product of products) {
    const [[seller]] = await connection.query(
      "SELECT id FROM users WHERE email=?",
      [product.seller],
    );
    const [[category]] = await connection.query(
      "SELECT id FROM categories WHERE slug=?",
      [product.category],
    );
    if (!seller || !category) continue;

    await connection.query(
      `INSERT INTO products
        (seller_id,category_id,name,slug,description,price,stock,image_url,status)
       VALUES (?,?,?,?,?,?,?,?,'active')
       ON DUPLICATE KEY UPDATE
        seller_id=VALUES(seller_id),
        category_id=VALUES(category_id),
        name=VALUES(name),
        description=VALUES(description),
        price=VALUES(price),
        stock=VALUES(stock),
        image_url=VALUES(image_url),
        status='active'`,
      [
        seller.id,
        category.id,
        product.name,
        product.slug,
        product.description,
        product.price,
        product.stock,
        product.image,
      ],
    );
  }

  await connection.commit();
  console.log("Catalogue de démonstration VinnHT prêt.");
} catch (error) {
  await connection.rollback();
  console.error(error);
  process.exitCode = 1;
} finally {
  connection.release();
  await pool.end();
}
