import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";

const sellers = [
  {
    name: "Nadege Pierre",
    email: "vendeur01@vinnht.test",
    phone: "37002001",
    password: "VinnHT-Test01!2026",
    shopName: "Lakay Mode",
    description: "Boutique de mode et accessoires pour toute la famille.",
    pickupAddress: "Petion-Ville, Ouest",
  },
  {
    name: "Samuel Joseph",
    email: "vendeur02@vinnht.test",
    phone: "37002002",
    password: "VinnHT-Test02!2026",
    shopName: "Tech Ayiti",
    description: "Technologie, appareils et accessoires pour le quotidien.",
    pickupAddress: "Delmas, Ouest",
  },
  {
    name: "Ruth Jean",
    email: "vendeur03@vinnht.test",
    phone: "37002003",
    password: "VinnHT-Test03!2026",
    shopName: "Marche Fraicheur",
    description: "Produits alimentaires, boissons et articles essentiels.",
    pickupAddress: "Saint-Marc, Artibonite",
  },
  {
    name: "Peterson Louis",
    email: "vendeur04@vinnht.test",
    phone: "37002004",
    password: "VinnHT-Test04!2026",
    shopName: "Maison Kreyol",
    description: "Articles pour la maison, decoration et mobilier.",
    pickupAddress: "Cap-Haitien, Nord",
  },
  {
    name: "Stephanie Charles",
    email: "vendeur05@vinnht.test",
    phone: "37002005",
    password: "VinnHT-Test05!2026",
    shopName: "Beaute Caraibe",
    description: "Produits de beaute, soins personnels et bien-etre.",
    pickupAddress: "Jacmel, Sud-Est",
  },
  {
    name: "Wilson Etienne",
    email: "vendeur06@vinnht.test",
    phone: "37002006",
    password: "VinnHT-Test06!2026",
    shopName: "Agro Lakay",
    description: "Produits agricoles et equipements pour producteurs locaux.",
    pickupAddress: "Hinche, Centre",
  },
  {
    name: "Melissa Francois",
    email: "vendeur07@vinnht.test",
    phone: "37002007",
    password: "VinnHT-Test07!2026",
    shopName: "Boutique Ti Moun",
    description: "Vetements, jeux et accessoires pour enfants.",
    pickupAddress: "Les Cayes, Sud",
  },
  {
    name: "David Saint-Fleur",
    email: "vendeur08@vinnht.test",
    phone: "37002008",
    password: "VinnHT-Test08!2026",
    shopName: "Auto Plus Haiti",
    description: "Pieces, accessoires et services pour vehicules.",
    pickupAddress: "Gonaives, Artibonite",
  },
];

const connection = await pool.getConnection();

try {
  await connection.beginTransaction();

  for (const seller of sellers) {
    const passwordHash = await bcrypt.hash(seller.password, 12);

    await connection.query(
      `INSERT INTO users (name,email,phone,password_hash,role,status)
       VALUES (?,?,?,?,?,'active')
       ON DUPLICATE KEY UPDATE
        name=VALUES(name),
        phone=VALUES(phone),
        password_hash=VALUES(password_hash),
        role='seller',
        status='active'`,
      [seller.name, seller.email, seller.phone, passwordHash, "seller"],
    );

    const [[account]] = await connection.query(
      "SELECT id FROM users WHERE email=?",
      [seller.email],
    );

    await connection.query(
      "INSERT IGNORE INTO user_roles (user_id,role) VALUES (?,'client'),(?,'seller')",
      [account.id, account.id],
    );

    await connection.query(
      `INSERT INTO seller_profiles
        (seller_id,shop_name,category,description,whatsapp,moncash_number,
         moncash_account_name,pickup_address,opening_hours,delivery_zones,status)
       VALUES (?,?,?,?,?,?,?,?,?,?,'active')
       ON DUPLICATE KEY UPDATE
        shop_name=VALUES(shop_name),
        category=NULL,
        description=VALUES(description),
        whatsapp=VALUES(whatsapp),
        moncash_number=VALUES(moncash_number),
        moncash_account_name=VALUES(moncash_account_name),
        pickup_address=VALUES(pickup_address),
        opening_hours=VALUES(opening_hours),
        delivery_zones=VALUES(delivery_zones),
        status='active'`,
      [
        account.id,
        seller.shopName,
        null,
        seller.description,
        seller.phone,
        seller.phone,
        seller.name,
        seller.pickupAddress,
        "Lundi-Samedi, 8h-18h",
        seller.pickupAddress,
      ],
    );
  }

  const emails = sellers.map((seller) => seller.email);
  const [createdAccounts] = await connection.query(
    `SELECT
      u.id,
      u.email,
      sp.shop_name,
      GROUP_CONCAT(ur.role ORDER BY ur.role) roles
     FROM users u
     JOIN seller_profiles sp ON sp.seller_id=u.id
     JOIN user_roles ur ON ur.user_id=u.id
     WHERE u.email IN (${emails.map(() => "?").join(",")})
     GROUP BY u.id,u.email,sp.shop_name
     ORDER BY u.email`,
    emails,
  );

  const accountsAreValid =
    createdAccounts.length === sellers.length &&
    createdAccounts.every((account) => account.roles === "client,seller");

  if (!accountsAreValid) {
    throw new Error("La verification des comptes vendeurs de test a echoue.");
  }

  await connection.commit();
  console.table(
    sellers.map(({ email, password, shopName }) => ({ email, password, shopName })),
  );
} catch (error) {
  await connection.rollback();
  console.error(error);
  process.exitCode = 1;
} finally {
  connection.release();
  await pool.end();
}
