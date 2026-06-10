import React from "react";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function CategoryCard({ name, slug, icon: Icon, description }) {
  return (
    <motion.div whileHover={{ y: -8 }}>
      <Link className="category-card" to={`/categories/${slug}`}>
        <div className="category-icon">
          <Icon />
        </div>
        <h3>{name}</h3>
        <p>{description}</p>
        <span>
          Explorer <ChevronRight size={16} />
        </span>
      </Link>
    </motion.div>
  );
}
