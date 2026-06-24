import fs from "node:fs/promises";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v2 as cloudinary } from "cloudinary";

const storageProvider = String(process.env.IMAGE_STORAGE || "local").toLowerCase();
const cloudEnabled = () =>
  storageProvider === "cloudinary" &&
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;
const s3Enabled = () =>
  ["s3", "r2"].includes(storageProvider) &&
  process.env.S3_ENDPOINT &&
  process.env.S3_BUCKET &&
  process.env.S3_ACCESS_KEY_ID &&
  process.env.S3_SECRET_ACCESS_KEY &&
  process.env.S3_PUBLIC_URL;

if (storageProvider === "cloudinary" && !cloudEnabled()) {
  throw new Error("Configuration Cloudinary incomplète.");
}

if (["s3", "r2"].includes(storageProvider) && !s3Enabled()) {
  throw new Error(
    "Configuration S3/R2 incomplète. Vérifiez S3_ENDPOINT, S3_BUCKET, les clés et S3_PUBLIC_URL.",
  );
}

if (cloudEnabled()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const s3Client = s3Enabled()
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

const uploadToS3 = async (file, folder) => {
  const key = `vinnht/${folder}/${file.filename}`;
  const content = await fs.readFile(file.path);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: content,
      ContentType: file.mimetype,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  await fs.unlink(file.path).catch(() => {});

  return `${process.env.S3_PUBLIC_URL.replace(/\/+$/, "")}/${key}`;
};

export const storeImage = async (file, folder) => {
  if (!file) return null;
  if (s3Enabled()) return uploadToS3(file, folder);
  if (!cloudEnabled()) return `/uploads/${folder}/${file.filename}`;

  const result = await cloudinary.uploader.upload(file.path, {
    folder: `vinnht/${folder}`,
    resource_type: "image",
    overwrite: false,
  });
  await fs.unlink(file.path).catch(() => {});
  return result.secure_url;
};

export const storeImages = (files, folder) =>
  Promise.all((files || []).map((file) => storeImage(file, folder)));
