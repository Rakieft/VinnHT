import React from "react";
import { LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ menu = [], user, onLogout }) {
  const location = useLocation();
  return (
    <aside className="sidebar">
      <Link className="brand light" to="/">
        <img src="/vinnht-logo.png" alt="Logo VinnHT" />
        <b>VinnHT</b>
      </Link>
      <div className="profile">
        <div>
          <b>{user?.name}</b>
          <span>{user?.role}</span>
        </div>
      </div>
      <nav>
        {menu.map(([label, path, Icon]) => (
          <Link className={location.pathname === path ? "active" : ""} to={path} key={path}>
            <Icon size={19} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <button className="sidebar-logout" onClick={onLogout}>
        <LogOut size={18} /> Déconnexion
      </button>
    </aside>
  );
}
