import React from "react";
import { Link } from "react-router-dom";
import { LogOut, Settings, ShieldCheck } from "lucide-react";

export default function MobileProfileActions({ onLogout, settingsPath }) {
  return (
    <section className="profile-logout-card mobile-only">
      <span className="profile-logout-icon">
        <ShieldCheck />
      </span>
      <div>
        <small>Compte et sécurité</small>
        <h2>Gérer votre espace VinnHT</h2>
        <p>Modifiez vos paramètres ou fermez votre session sur cet appareil.</p>
      </div>
      <footer>
        <Link to={settingsPath}>
          <Settings />
          Paramètres
        </Link>
        <button type="button" onClick={onLogout}>
          <LogOut />
          Déconnexion
        </button>
      </footer>
    </section>
  );
}
