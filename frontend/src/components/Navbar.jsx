import React from "react";
import { Menu, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar({ cartCount = 0, actions }) {
  return (
    <header className="navbar">
      <Link className="brand" to="/">
        <img src="/vinnht-logo.png" alt="Logo VinnHT" />
        <b>VinnHT</b>
      </Link>
      <nav className="nav-links">
        <Link to="/">Accueil</Link>
        <Link to="/categories">Rayons</Link>
        <Link to="/contact">Contact</Link>
        {actions}
      </nav>
      <div className="nav-actions">
        <Link className="cart-link" to="/cart">
          <ShoppingCart />
          <b>{cartCount}</b>
        </Link>
        <button className="icon-btn mobile-only">
          <Menu />
        </button>
      </div>
    </header>
  );
}
