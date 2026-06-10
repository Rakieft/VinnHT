import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <Link className="brand light" to="/">
          <img src="/vinnht-logo.png" alt="Logo VinnHT" />
          <b>VinnHT</b>
        </Link>
        <p>Le marché numérique d’Haïti.</p>
      </div>
      <div>
        <h4>Marketplace</h4>
        <Link to="/categories">Rayons</Link>
        <Link to="/contact">Support</Link>
      </div>
    </footer>
  );
}
