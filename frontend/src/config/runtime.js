export const apiOrigin = import.meta.env.VITE_API_ORIGIN || "http://localhost:5056";

export const assetUrl = (url) =>
  url?.startsWith("/uploads") ? `${apiOrigin}${url}` : url;
