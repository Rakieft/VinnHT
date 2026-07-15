import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  Building2,
  Car,
  ChevronDown,
  ChevronRight,
  Grid3X3,
  Heart,
  ListFilter,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Sofa,
  Sparkles,
  Sprout,
  Users,
  X,
} from "lucide-react";
import {
  getTaxonomyGroup,
  getTaxonomyRayon,
  getTaxonomyTypeLabel,
  marketplaceTaxonomy,
  taxonomySlug,
} from "../config/marketplaceTaxonomy.js";

const taxonomyIcons = {
  bag: ShoppingBag,
  basket: ShoppingBasket,
  briefcase: BriefcaseBusiness,
  building: Building2,
  car: Car,
  grid: Grid3X3,
  heart: Heart,
  smartphone: Smartphone,
  sofa: Sofa,
  sparkles: Sparkles,
  sprout: Sprout,
  users: Users,
};

const selectionText = (category, subcategory, productType) => {
  const rayon = getTaxonomyRayon(category);
  const group = getTaxonomyGroup(category, subcategory);
  const type = getTaxonomyTypeLabel(category, subcategory, productType);
  return [rayon?.name, group?.name, type].filter(Boolean).join(" › ") || "Tous les produits";
};

export default function CatalogTaxonomy({
  category,
  subcategory,
  productType,
  offersOnly,
  onSelectAll,
  onSelectRayon,
  onSelectGroup,
  onSelectType,
}) {
  const [openRayon, setOpenRayon] = useState(category || "");
  const [openGroup, setOpenGroup] = useState(subcategory || "");
  const [flyoutPosition, setFlyoutPosition] = useState({ top: 92, left: 0 });
  const [mobileOpen, setMobileOpen] = useState(false);
  const selectedText = useMemo(
    () => offersOnly
      ? "Offres spéciales"
      : selectionText(category, subcategory, productType),
    [category, subcategory, productType, offersOnly],
  );

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const revealRayon = (rayon, trigger) => {
    if (trigger) {
      const bounds = trigger.getBoundingClientRect();
      const viewportTop = 82;
      const estimatedFlyoutHeight = 350;
      const maximumTop = Math.max(
        viewportTop,
        window.innerHeight - estimatedFlyoutHeight - 12,
      );
      setFlyoutPosition({
        top: Math.min(Math.max(bounds.top, viewportTop), maximumTop),
        left: bounds.right - 1,
      });
    }
    setOpenRayon(rayon.slug);
    setOpenGroup(
      rayon.groups.some((group) => group.slug === subcategory)
        ? subcategory
        : rayon.groups[0]?.slug || "",
    );
  };

  const chooseAll = () => {
    onSelectAll();
    setMobileOpen(false);
  };

  const chooseRayon = (rayon) => {
    onSelectRayon(rayon.slug);
    setOpenRayon("");
    setMobileOpen(false);
  };

  const chooseGroup = (rayon, group) => {
    onSelectGroup(rayon.slug, group.slug);
    setOpenGroup(group.slug);
    setOpenRayon("");
    setMobileOpen(false);
  };

  const chooseType = (rayon, group, type) => {
    onSelectType(rayon.slug, group.slug, taxonomySlug(type));
    setOpenRayon("");
    setMobileOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="catalog-mobile-taxonomy-trigger"
        onClick={() => setMobileOpen(true)}
      >
        <span><ListFilter /></span>
        <div>
          <small>Rayon sélectionné</small>
          <strong>{selectedText}</strong>
        </div>
        <ChevronRight />
      </button>

      <aside className="catalog-taxonomy" aria-label="Rayons du catalogue">
        <header>
          <span><Grid3X3 /></span>
          <div>
            <small>Grand marché VinnHT</small>
            <strong>Rayons</strong>
          </div>
        </header>
        <Link
          to="/products?offers=true"
          className={offersOnly ? "catalog-taxonomy-offers active" : "catalog-taxonomy-offers"}
          onClick={onSelectAll}
        >
          <span><Sparkles /></span>
          <div>
            <strong>Offres spéciales</strong>
            <small>À découvrir</small>
          </div>
          <ChevronRight />
        </Link>
        <Link
          to="/products"
          className={!category && !offersOnly ? "catalog-taxonomy-all active" : "catalog-taxonomy-all"}
          onClick={onSelectAll}
        >
          Tous les produits
        </Link>
        <nav>
          {marketplaceTaxonomy.map((rayon) => {
            const Icon = taxonomyIcons[rayon.icon] || ShoppingBag;
            const activeGroup =
              rayon.groups.find((group) => group.slug === openGroup) || rayon.groups[0];
            const isOpen = openRayon === rayon.slug;
            return (
              <div
                className={`catalog-taxonomy-rayon${isOpen ? " open" : ""}`}
                onMouseLeave={() => setOpenRayon("")}
                key={rayon.slug}
              >
                <button
                  type="button"
                  className={category === rayon.slug ? "active" : ""}
                  onClick={() => chooseRayon(rayon)}
                  onMouseEnter={(event) => revealRayon(rayon, event.currentTarget)}
                  onFocus={(event) => revealRayon(rayon, event.currentTarget)}
                  aria-expanded={isOpen}
                >
                  <span><Icon /></span>
                  <strong>{rayon.name}</strong>
                  <ChevronRight />
                </button>
                {isOpen && (
                  <div className="catalog-taxonomy-flyout" style={flyoutPosition}>
                    <div className="catalog-taxonomy-flyout-heading">
                      <span><Icon /></span>
                      <div>
                        <small>Rayon</small>
                        <h3>{rayon.name}</h3>
                      </div>
                      <button type="button" onClick={() => chooseRayon(rayon)}>
                        Tout voir
                      </button>
                    </div>
                    <div className="catalog-taxonomy-columns">
                      <div className="catalog-taxonomy-groups">
                        {rayon.groups.map((group) => (
                          <button
                            type="button"
                            className={subcategory === group.slug ? "active" : ""}
                            onMouseEnter={() => setOpenGroup(group.slug)}
                            onFocus={() => setOpenGroup(group.slug)}
                            onClick={() => chooseGroup(rayon, group)}
                            key={group.slug}
                          >
                            {group.name}
                            <ChevronRight />
                          </button>
                        ))}
                      </div>
                      <div className="catalog-taxonomy-types">
                        <header>
                          <div>
                            <small>Sous-rayon</small>
                            <strong>{activeGroup?.name}</strong>
                          </div>
                          {activeGroup && (
                            <button type="button" onClick={() => chooseGroup(rayon, activeGroup)}>
                              Voir tout
                            </button>
                          )}
                        </header>
                        <div>
                          {(activeGroup?.types || []).map((type) => {
                            const typeSlug = taxonomySlug(type);
                            return (
                              <button
                                type="button"
                                className={productType === typeSlug ? "active" : ""}
                                onClick={() => chooseType(rayon, activeGroup, type)}
                                key={typeSlug}
                              >
                                {type}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {mobileOpen && (
        <div className="catalog-taxonomy-mobile-layer" role="dialog" aria-modal="true">
          <button
            type="button"
            className="catalog-taxonomy-mobile-backdrop"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer les rayons"
          />
          <motion.section
            className="catalog-taxonomy-mobile-sheet"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <header>
              <div>
                <small>Grand marché VinnHT</small>
                <h2>Choisir un rayon</h2>
              </div>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Fermer">
                <X />
              </button>
            </header>
            <div className="catalog-taxonomy-mobile-scroll">
              <Link
                to="/products?offers=true"
                className={offersOnly
                  ? "catalog-taxonomy-mobile-offers active"
                  : "catalog-taxonomy-mobile-offers"}
                onClick={chooseAll}
              >
                <span><Sparkles /></span>
                <div>
                  <strong>Offres spéciales</strong>
                  <small>Profiter des promotions actives</small>
                </div>
                <ChevronRight />
              </Link>
              <Link
                to="/products"
                className={!category && !offersOnly
                  ? "catalog-taxonomy-mobile-all active"
                  : "catalog-taxonomy-mobile-all"}
                onClick={chooseAll}
              >
                <Grid3X3 /> Tous les produits
              </Link>
              {marketplaceTaxonomy.map((rayon) => {
                const Icon = taxonomyIcons[rayon.icon] || ShoppingBag;
                return (
                  <details open={category === rayon.slug} key={rayon.slug}>
                    <summary>
                      <span><Icon /></span>
                      <strong>{rayon.name}</strong>
                      <ChevronDown />
                    </summary>
                    <button type="button" onClick={() => chooseRayon(rayon)}>
                      Tout le rayon {rayon.name}
                    </button>
                    {rayon.groups.map((group) => (
                      <details open={subcategory === group.slug} key={group.slug}>
                        <summary>
                          <strong>{group.name}</strong>
                          <ChevronDown />
                        </summary>
                        <button type="button" onClick={() => chooseGroup(rayon, group)}>
                          Tout voir dans {group.name}
                        </button>
                        <div>
                          {group.types.map((type) => (
                            <button
                              type="button"
                              className={productType === taxonomySlug(type) ? "active" : ""}
                              onClick={() => chooseType(rayon, group, type)}
                              key={taxonomySlug(type)}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </details>
                    ))}
                  </details>
                );
              })}
            </div>
          </motion.section>
        </div>
      )}
    </>
  );
}
