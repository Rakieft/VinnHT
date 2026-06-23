import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";

const backendDirectory = fileURLToPath(new URL("../../", import.meta.url));
const uploadDirectories = {
  products: path.join(backendDirectory, "uploads", "products"),
  profiles: path.join(backendDirectory, "uploads", "profiles"),
  shops: path.join(backendDirectory, "uploads", "shops"),
  payments: path.join(backendDirectory, "uploads", "payments"),
};

Object.values(uploadDirectories).forEach((directory) => {
  fs.mkdirSync(directory, { recursive: true });
});

const createStorage = (directory, fallbackName) =>
  multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, directory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    callback(null, `${Date.now()}-${safeName || fallbackName}${extension}`);
  },
});

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const uploadProductImages = multer({
  storage: createStorage(uploadDirectories.products, "produit"),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, callback) => {
    if (!imageTypes.has(file.mimetype)) {
      return callback(new Error("Format image non supporté. Utilisez JPG, PNG ou WebP."));
    }
    callback(null, true);
  },
}).array("images", 5);

const createImageUpload = (storage) =>
  multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
      if (!imageTypes.has(file.mimetype)) {
        return callback(new Error("Format image non supporté. Utilisez JPG, PNG ou WebP."));
      }
      callback(null, true);
    },
  });

export const uploadProfileImage = createImageUpload(
  createStorage(uploadDirectories.profiles, "profil"),
).single("profilePhoto");

export const uploadPaymentProof = createImageUpload(
  createStorage(uploadDirectories.payments, "preuve-paiement"),
).single("paymentProof");

export const uploadSellerImages = multer({
  storage: multer.diskStorage({
    destination: (_req, file, callback) => {
      const directory =
        file.fieldname === "profilePhoto"
          ? uploadDirectories.profiles
          : uploadDirectories.shops;
      callback(null, directory);
    },
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${file.fieldname}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, callback) => {
    if (!imageTypes.has(file.mimetype)) {
      return callback(new Error("Format image non supporté. Utilisez JPG, PNG ou WebP."));
    }
    callback(null, true);
  },
}).fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "shopLogo", maxCount: 1 },
]);
