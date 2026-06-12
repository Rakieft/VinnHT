import fs from "node:fs/promises";
import { v2 as cloudinary } from "cloudinary";

const cloudEnabled = () =>
  process.env.IMAGE_STORAGE === "cloudinary" &&
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (cloudEnabled()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const storeImage = async (file, folder) => {
  if (!file) return null;
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
