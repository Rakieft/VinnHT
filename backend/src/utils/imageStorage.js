import fs from "node:fs/promises";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v2 as cloudinary } from "cloudinary";

const requestedStorageProvider = String(process.env.IMAGE_STORAGE || "local").toLowerCase();
const warnedFallbackProviders = new Set();

const cloudEnabled = () =>
  requestedStorageProvider === "cloudinary" &&
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

const s3Enabled = () =>
  ["s3", "r2"].includes(requestedStorageProvider) &&
  process.env.S3_ENDPOINT &&
  process.env.S3_BUCKET &&
  process.env.S3_ACCESS_KEY_ID &&
  process.env.S3_SECRET_ACCESS_KEY &&
  process.env.S3_PUBLIC_URL;

const warnStorageFallback = (provider, reason) => {
  if (warnedFallbackProviders.has(provider)) return;
  warnedFallbackProviders.add(provider);
  console.warn(`[VinnHT] ${reason} Bascule automatique vers le stockage local.`);
};

const strictImageStorage = process.env.IMAGE_STORAGE_STRICT === "true";

const resolveImageStorageProvider = () => {
  if (requestedStorageProvider === "cloudinary" && !cloudEnabled()) {
    if (strictImageStorage) {
      throw new Error("Configuration Cloudinary incomplète.");
    }
    warnStorageFallback(
      "cloudinary",
      "Configuration Cloudinary incomplète.",
    );
    return "local";
  }

  if (["s3", "r2"].includes(requestedStorageProvider) && !s3Enabled()) {
    if (strictImageStorage) {
      throw new Error(
        "Configuration S3/R2 incomplète. Vérifiez S3_ENDPOINT, S3_BUCKET, les clés et S3_PUBLIC_URL.",
      );
    }
    warnStorageFallback(
      requestedStorageProvider,
      "Configuration S3/R2 incomplète.",
    );
    return "local";
  }

  return requestedStorageProvider;
};

export const resolvedImageStorageProvider = resolveImageStorageProvider();

if (resolvedImageStorageProvider === "cloudinary") {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const s3Client = resolvedImageStorageProvider === "s3" || resolvedImageStorageProvider === "r2"
  ? new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    })
  : null;

const removeTempFile = async (filePath) => {
  if (!filePath) return;
  await fs.unlink(filePath).catch(() => {});
};

const uploadToS3 = async (file, folder) => {
  const key = `vinnht/${folder}/${file.filename}`;
  const content = await fs.readFile(file.path);

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: content,
        ContentType: file.mimetype,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return `${process.env.S3_PUBLIC_URL.replace(/\/+$/, "")}/${key}`;
  } finally {
    await removeTempFile(file.path);
  }
};

const uploadToCloudinary = async (file, folder) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `vinnht/${folder}`,
      resource_type: "image",
      overwrite: false,
    });
    return result.secure_url;
  } finally {
    await removeTempFile(file.path);
  }
};

export const storeImage = async (file, folder) => {
  if (!file) return null;
  if (resolvedImageStorageProvider === "s3" || resolvedImageStorageProvider === "r2") {
    return uploadToS3(file, folder);
  }
  if (resolvedImageStorageProvider === "cloudinary") {
    return uploadToCloudinary(file, folder);
  }
  return `/uploads/${folder}/${file.filename}`;
};

export const storeImages = (files, folder) =>
  Promise.all((files || []).map((file) => storeImage(file, folder)));
