import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";

const account = {
  name: "Jean Boutique Demo",
  email: "vendeur.demo@vinnht.ht",
  phone: "37001234",
  password: "VinnHTVendeur2026!",
};

const products = [
  {
    category: "electronique",
    name: "Montre connectée VinnHT",
    slug: "montre-connectee-vinnht-demo",
    description: "Montre connectée élégante pour suivre vos activités quotidiennes.",
    price: 6500,
    stock: 16,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "mode",
    name: "Sac premium Lakay",
    slug: "sac-premium-lakay-demo",
    description: "Sac moderne et résistant, pensé pour le quotidien.",
    price: 4200,
    stock: 4,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
  },
];

const connection = await pool.getConnection();

try {
  await connection.beginTransaction();
  const passwordHash = await bcrypt.hash(account.password, 12);
  await connection.query(
    `INSERT INTO users (name,email,phone,password_hash,role,status)
     VALUES (?,?,?,?,'seller','active')
     ON DUPLICATE KEY UPDATE
      name=VALUES(name),
      phone=VALUES(phone),
      password_hash=VALUES(password_hash),
      role='seller',
      status='active'`,
    [account.name, account.email, account.phone, passwordHash],
  );

  const [[seller]] = await connection.query(
    "SELECT id FROM users WHERE email=?",
    [account.email],
  );
  await connection.query(
    "INSERT IGNORE INTO user_roles (user_id,role) VALUES (?,'client'),(?,'seller')",
    [seller.id, seller.id],
  );

  await connection.query(
    `INSERT INTO seller_profiles
      (seller_id,shop_name,category,description,whatsapp,pickup_address,status)
     VALUES (?,?,?,?,?,?,'active')
     ON DUPLICATE KEY UPDATE
      shop_name=VALUES(shop_name),
      category=VALUES(category),
      description=VALUES(description),
      whatsapp=VALUES(whatsapp),
      pickup_address=VALUES(pickup_address),
      status='active'`,
    [
      seller.id,
      "Boutique Horizon",
      "Électronique & Mode",
      "Une boutique de démonstration premium pour découvrir l’espace vendeur VinnHT.",
      "+509 37 00 12 34",
      "Delmas 60, Port-au-Prince",
    ],
  );

  for (const product of products) {
    const [[category]] = await connection.query(
      "SELECT id FROM categories WHERE slug=?",
      [product.category],
    );
    await connection.query(
      `INSERT INTO products
        (seller_id,category_id,name,slug,description,price,stock,image_url,status)
       VALUES (?,?,?,?,?,?,?,?,'active')
       ON DUPLICATE KEY UPDATE
        seller_id=VALUES(seller_id),
        category_id=VALUES(category_id),
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
  console.log(`Compte vendeur créé : ${account.email}`);
} catch (error) {
  await connection.rollback();
  console.error(error);
  process.exitCode = 1;
} finally {
  connection.release();
  await pool.end();
}
