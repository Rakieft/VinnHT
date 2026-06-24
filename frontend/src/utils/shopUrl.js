export const shopUrlSlug = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "boutique";

export const shopPublicPath = (shop = {}) => {
  const sellerId = shop.seller_id || shop.sellerId || shop.id;

  if (!sellerId) return "";

  const shopName = shop.shop_name || shop.shopName || shop.name;
  return `/shops/${shopUrlSlug(shopName)}-${sellerId}`;
};

export const shopSellerIdFromParam = (value = "") => {
  const match = String(value).match(/(?:^|-)(\d+)$/);
  return match ? match[1] : "";
};
