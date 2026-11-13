ALTER TABLE seed_lots ADD COLUMN price_per_kg REAL NOT NULL DEFAULT 0 CHECK(price_per_kg>=0);
INSERT INTO schema_migrations(version) VALUES(2);
