import React from "react";
import { LogOut, ShieldCheck } from "lucide-react";

export default function ProfileLogoutCard({ onLogout }) {
  return (
    <section className="profile-logout-card mobile-only">
      <span className="profile-logout-icon">
        <ShieldCheck />
      </span>
      <div>
        <small>Session sécurisée</small>
        <h2>Quitter votre espace VinnHT</h2>
        <p>Déconnectez-vous lorsque vous avez terminé, surtout sur un appareil partagé.</p>
      </div>
      <button type="button" onClick={onLogout}>
        <LogOut />
        Déconnexion
      </button>
    </section>
  );
}
