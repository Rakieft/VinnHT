UPDATE products p
JOIN categories c ON c.id=p.category_id
SET p.subcategory_slug='mixte', p.product_type_slug='tennis'
WHERE c.slug='mode'
  AND p.subcategory_slug IS NULL
  AND (LOWER(p.name) LIKE '%sneaker%' OR LOWER(p.name) LIKE '%converse%'
       OR LOWER(p.name) LIKE '%jordan%' OR LOWER(p.name) LIKE '%tennis%');

UPDATE products p
JOIN categories c ON c.id=p.category_id
SET p.subcategory_slug='femme', p.product_type_slug='robes'
WHERE c.slug='mode' AND p.subcategory_slug IS NULL AND LOWER(p.name) LIKE '%robe%';

UPDATE products p
JOIN categories c ON c.id=p.category_id
SET p.subcategory_slug='femme', p.product_type_slug='sacs'
WHERE c.slug='mode' AND p.subcategory_slug IS NULL AND LOWER(p.name) LIKE '%sac%';

UPDATE products p
JOIN categories c ON c.id=p.category_id
SET p.subcategory_slug='enfant',
    p.product_type_slug=IF(LOWER(p.name) LIKE '%chaussure%', 'chaussures-enfant', 'vetements-enfant')
WHERE c.slug='mode' AND p.subcategory_slug IS NULL
  AND (LOWER(p.name) LIKE '%enfant%' OR LOWER(p.name) LIKE '%premier pas%');

UPDATE products p
JOIN categories c ON c.id=p.category_id
SET p.subcategory_slug='mixte', p.product_type_slug='accessoires'
WHERE c.slug='mode' AND p.subcategory_slug IS NULL;

UPDATE products p
JOIN categories c ON c.id=p.category_id
SET p.subcategory_slug='informatique', p.product_type_slug='ordinateurs-portables'
WHERE c.slug='electronique' AND p.subcategory_slug IS NULL
  AND (LOWER(p.name) LIKE '%laptop%' OR LOWER(p.name) LIKE '%ordinateur%');

UPDATE products p
JOIN categories c ON c.id=p.category_id
SET p.subcategory_slug='telephones', p.product_type_slug='smartphones'
WHERE c.slug='electronique' AND p.subcategory_slug IS NULL
  AND (LOWER(p.name) LIKE '%samsung%' OR LOWER(p.name) LIKE '%iphone%'
       OR LOWER(p.name) LIKE '%telephone%' OR LOWER(p.name) LIKE '%smartphone%');

UPDATE products p
JOIN categories c ON c.id=p.category_id
SET p.subcategory_slug='audio-video', p.product_type_slug='casques'
WHERE c.slug='electronique' AND p.subcategory_slug IS NULL AND LOWER(p.name) LIKE '%casque%';

UPDATE products p
JOIN categories c ON c.id=p.category_id
SET p.subcategory_slug='meubles',
    p.product_type_slug=CASE
      WHEN LOWER(p.name) LIKE '%bureau%' THEN 'bureau'
      WHEN LOWER(p.name) LIKE '%canape%' OR LOWER(p.name) LIKE '%salon%' THEN 'salon'
      ELSE 'rangement'
    END
WHERE c.slug='maison-meubles' AND p.subcategory_slug IS NULL
  AND (LOWER(p.name) LIKE '%meuble%' OR LOWER(p.name) LIKE '%canape%'
       OR LOWER(p.name) LIKE '%chaise%' OR LOWER(p.name) LIKE '%bureau%');

UPDATE products p
JOIN categories c ON c.id=p.category_id
SET p.subcategory_slug='decoration', p.product_type_slug='luminaires'
WHERE c.slug='maison-meubles' AND p.subcategory_slug IS NULL
  AND (LOWER(p.name) LIKE '%lampe%' OR LOWER(p.name) LIKE '%luminaire%');

UPDATE products p
JOIN categories c ON c.id=p.category_id
SET p.subcategory_slug='motos', p.product_type_slug='motos'
WHERE c.slug='vehicules' AND p.subcategory_slug IS NULL AND LOWER(p.name) LIKE '%moto%';

UPDATE products p
JOIN categories c ON c.id=p.category_id
SET p.subcategory_slug='voitures', p.product_type_slug='voitures-d-occasion'
WHERE c.slug='vehicules' AND p.subcategory_slug IS NULL;

UPDATE products p
JOIN categories c ON c.id=p.category_id
SET p.subcategory_slug='produits-locaux',
    p.product_type_slug=IF(LOWER(p.name) LIKE '%mangue%' OR LOWER(p.name) LIKE '%fruit%', 'fruits', 'legumes')
WHERE c.slug='agriculture' AND p.subcategory_slug IS NULL
  AND (LOWER(p.name) LIKE '%mangue%' OR LOWER(p.name) LIKE '%fruit%'
       OR LOWER(p.name) LIKE '%tomate%' OR LOWER(p.name) LIKE '%legume%');

UPDATE products p
JOIN categories c ON c.id=p.category_id
SET p.subcategory_slug='parfums', p.product_type_slug='femme'
WHERE c.slug='beaute-soins' AND p.subcategory_slug IS NULL AND LOWER(p.name) LIKE '%parfum%';

UPDATE products p
JOIN categories c ON c.id=p.category_id
SET p.subcategory_slug='beaute', p.product_type_slug='maquillage'
WHERE c.slug='beaute-soins' AND p.subcategory_slug IS NULL AND LOWER(p.name) LIKE '%maquillage%';

UPDATE products p
JOIN categories c ON c.id=p.category_id
SET p.subcategory_slug='soins', p.product_type_slug='corps'
WHERE c.slug='beaute-soins' AND p.subcategory_slug IS NULL;

UPDATE products p
JOIN categories c ON c.id=p.category_id
SET p.subcategory_slug='alimentation',
    p.product_type_slug=CASE
      WHEN LOWER(p.name) LIKE '%riz%' THEN 'riz-et-cereales'
      WHEN LOWER(p.name) LIKE '%huile%' THEN 'huiles-et-epices'
      ELSE 'produits-frais'
    END
WHERE c.slug='supermarche' AND p.subcategory_slug IS NULL;

UPDATE products p
JOIN categories c ON c.id=p.category_id
SET p.subcategory_slug='divers', p.product_type_slug='loisirs'
WHERE c.slug='autres' AND p.subcategory_slug IS NULL;
