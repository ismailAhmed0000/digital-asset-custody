-- Run once if your DB still enforces type IN ('individual','business'):
--   psql -h localhost -U YOUR_USER -d bare_metals_db -f db/migrate_customer_type_to_retail_institutional.sql

BEGIN;

UPDATE customers SET type = 'retail' WHERE type = 'individual';
UPDATE customers SET type = 'institutional' WHERE type = 'business';

ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_type_check;

ALTER TABLE customers
  ADD CONSTRAINT customers_type_check
  CHECK (type IN ('retail', 'institutional'));

COMMIT;
