import React, { useEffect, useRef, useState } from "react";
import { Camera, Check, ShieldCheck, Trash2, X } from "lucide-react";
import { apiOrigin } from "../config/runtime.js";
import "../styles/profile-photo-manager.css";

export default function ProfilePhotoManager({ api, user, updateUser, onMessage }) {
  const [source, setSource] = useState("");
  const [zoom, setZoom] = useState(1);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);
  const [busy, setBusy] = useState(false);
  const imageRef = useRef(null);
  const currentPhoto = user?.profile_image_url
    ? user.profile_image_url.startsWith("/uploads")
      ? `${apiOrigin}${user.profile_image_url}`
      : user.profile_image_url
    : "";
  const currentPhotoWithCache = currentPhoto
    ? `${currentPhoto}${currentPhoto.includes("?") ? "&" : "?"}v=${user?.profile_image_url || ""}`
    : "";

  useEffect(() => () => {
    if (source) URL.revokeObjectURL(source);
  }, [source]);

  useEffect(() => {
    if (!source) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeWithEscape = (event) => {
      if (event.key === "Escape" && !busy) setSource("");
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeWithEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [busy, source]);

  const choose = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (source) URL.revokeObjectURL(source);
    setSource(URL.createObjectURL(file));
    setZoom(1);
    setPositionX(50);
    setPositionY(50);
  };

  const saveCrop = async () => {
    const image = imageRef.current;
    if (!image) return;
    setBusy(true);
    try {
      const size = 700;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      const baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
      const scale = baseScale * zoom;
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const maxX = Math.max(0, width - size);
      const maxY = Math.max(0, height - size);
      context.drawImage(image, -(maxX * positionX) / 100, -(maxY * positionY) / 100, width, height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) throw new Error("La photo n'a pas pu etre preparee.");
      const data = new FormData();
      data.append("profilePhoto", blob, "profil-vinnht.jpg");
      const { data: response } = await api.patch("/auth/profile", data);
      updateUser?.(response.user);
      onMessage?.("Photo recadree et enregistree.");
      setSource("");
    } catch (error) {
      onMessage?.(error.response?.data?.message || "Impossible d'enregistrer cette photo.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Supprimer votre photo de profil VinnHT ?")) return;
    setBusy(true);
    try {
      const { data } = await api.delete("/auth/profile/photo");
      updateUser?.(data.user);
      onMessage?.(data.message);
    } catch (error) {
      onMessage?.(error.response?.data?.message || "Impossible de supprimer cette photo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="vinnht-profile-photo-manager">
        <span className="vinnht-profile-photo-preview">
          {currentPhoto ? (
            <img src={currentPhotoWithCache} alt="Photo de profil" />
          ) : (
            <Camera />
          )}
        </span>
        <span className={`vinnht-profile-photo-status ${currentPhoto ? "is-ready" : "is-missing"}`}>
          {currentPhoto ? <ShieldCheck /> : <Camera />}
          {currentPhoto ? "Photo de profil prête" : "Photo de profil à ajouter"}
        </span>
        <div className="vinnht-profile-photo-actions">
          <label className={busy ? "is-disabled" : ""}>
            <Camera /> Choisir et recadrer
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={choose}
              disabled={busy}
            />
          </label>
          {currentPhoto && (
            <button className="vinnht-profile-photo-remove" type="button" onClick={remove} disabled={busy}>
              <Trash2 /> Supprimer
            </button>
          )}
        </div>
      </div>
      {source && (
        <div className="vinnht-photo-crop-overlay" role="presentation">
          <section
            className="vinnht-photo-crop-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vinnht-photo-crop-title"
          >
            <header>
              <div>
                <span>Photo de profil</span>
                <h2 id="vinnht-photo-crop-title">Recadrer votre photo</h2>
              </div>
              <button
                type="button"
                onClick={() => setSource("")}
                disabled={busy}
                aria-label="Fermer le recadrage"
              >
                <X />
              </button>
            </header>
            <div className="vinnht-photo-crop-stage">
              <img
                ref={imageRef}
                src={source}
                alt="Photo à recadrer"
                style={{
                  transform: `scale(${zoom})`,
                  objectPosition: `${positionX}% ${positionY}%`,
                }}
              />
            </div>
            <div className="vinnht-photo-crop-controls">
              <label>
                Zoom
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                />
              </label>
              <label>
                Horizontal
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={positionX}
                  onChange={(event) => setPositionX(Number(event.target.value))}
                />
              </label>
              <label>
                Vertical
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={positionY}
                  onChange={(event) => setPositionY(Number(event.target.value))}
                />
              </label>
            </div>
            <footer>
              <button type="button" onClick={() => setSource("")} disabled={busy}>
                Annuler
              </button>
              <button type="button" onClick={saveCrop} disabled={busy}>
                <Check /> {busy ? "Enregistrement..." : "Utiliser cette photo"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
