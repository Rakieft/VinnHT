SET @database_name = DATABASE();

SET @add_subcategory = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA=@database_name AND TABLE_NAME='products' AND COLUMN_NAME='subcategory_slug') = 0,
  'ALTER TABLE products ADD COLUMN subcategory_slug VARCHAR(120) NULL AFTER category_id',
  'SELECT 1'
);
PREPARE add_subcategory_statement FROM @add_subcategory;
EXECUTE add_subcategory_statement;
DEALLOCATE PREPARE add_subcategory_statement;

SET @add_product_type = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA=@database_name AND TABLE_NAME='products' AND COLUMN_NAME='product_type_slug') = 0,
  'ALTER TABLE products ADD COLUMN product_type_slug VARCHAR(120) NULL AFTER subcategory_slug',
  'SELECT 1'
);
PREPARE add_product_type_statement FROM @add_product_type;
EXECUTE add_product_type_statement;
DEALLOCATE PREPARE add_product_type_statement;

SET @add_taxonomy_index = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA=@database_name AND TABLE_NAME='products' AND INDEX_NAME='idx_products_taxonomy') = 0,
  'CREATE INDEX idx_products_taxonomy ON products (category_id,subcategory_slug,product_type_slug,status,stock)',
  'SELECT 1'
);
PREPARE add_taxonomy_index_statement FROM @add_taxonomy_index;
EXECUTE add_taxonomy_index_statement;
DEALLOCATE PREPARE add_taxonomy_index_statement;
