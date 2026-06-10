import React from "react";
import { MapPin, ShieldCheck, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Badge from "./Badge.jsx";

export default function ProductCard({ product, onAdd }) {
  return (
    <motion.article className="product-card" whileHover={{ y: -8 }}>
      <Link className="product-media" to={`/products/${product.id}`}>
        <img src={product.image_url} alt={product.name} />
        <Badge tone="gold">Tendance</Badge>
      </Link>
      <div className="product-body">
        <div className="product-meta">
          <span>{product.category_name}</span>
          <span>
            <MapPin size={13} />
            {product.city}
          </span>
        </div>
        <h3>{product.name}</h3>
        <p>
          <ShieldCheck size={14} /> Vendeur vérifié
        </p>
        <div className="product-bottom">
          <strong>{Number(product.price).toLocaleString("fr-HT")} HTG</strong>
          <button className="round-btn" onClick={() => onAdd?.(product)}>
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
