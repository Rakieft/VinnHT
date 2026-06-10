import { motion } from "framer-motion";
import React from "react";
import { ArrowRight, Check, MapPin, Search, ShoppingBag, Sparkles } from "lucide-react";
import CountUp from "react-countup";
import { Link } from "react-router-dom";

export function AnimatedSection({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.65, delay }}
    >
      {children}
    </motion.div>
  );
}
export function Button({ children, to, variant = "primary", className = "", ...props }) {
  const content = <>{children}</>;
  return to ? (
    <Link className={`button ${variant} ${className}`} to={to}>
      {content}
    </Link>
  ) : (
    <button className={`button ${variant} ${className}`} {...props}>
      {content}
    </button>
  );
}
export function Badge({ children, tone = "blue" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function SearchBar() {
  return (
    <div className="search-bar">
      <Search />
      <input aria-label="Rechercher" placeholder="Que recherchez-vous aujourd’hui ?" />
      <span>
        <MapPin /> Tout Haïti
      </span>
      <button>
        <Search /> Rechercher
      </button>
    </div>
  );
}
export function StatCard({
  icon: Icon = Sparkles,
  label,
  value,
  suffix = "",
  note = "+12% ce mois",
  count,
}) {
  return (
    <motion.article className="stat-card" whileHover={{ y: -5 }}>
      <div className="stat-icon">
        <Icon />
      </div>
      <span>{label}</span>
      <strong>
        {count !== undefined ? (
          <>
            <CountUp end={count} duration={2} />
            {suffix}
          </>
        ) : (
          value
        )}
      </strong>
      <small>{note}</small>
    </motion.article>
  );
}
export function EmptyState({ title = "Rien à afficher pour le moment" }) {
  return (
    <div className="empty-state">
      <span>
        <ShoppingBag />
      </span>
      <h3>{title}</h3>
      <p>Explorez VinnHT pour découvrir les meilleures offres du marché.</p>
      <Button to="/categories">
        Explorer maintenant <ArrowRight />
      </Button>
    </div>
  );
}
export function OrderStatusTimeline() {
  return (
    <div className="order-timeline">
      {["Commande reçue", "Confirmée", "En préparation", "En livraison"].map((label, index) => (
        <div className={index < 2 ? "done" : ""} key={label}>
          <span>{index < 2 ? <Check /> : index + 1}</span>
          <b>{label}</b>
        </div>
      ))}
    </div>
  );
}
export function Loader() {
  return (
    <div className="loader">
      <span />
      <span />
      <span />
    </div>
  );
}
