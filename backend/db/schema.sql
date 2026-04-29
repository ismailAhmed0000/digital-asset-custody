BEGIN;

CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('individual', 'business')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metals  (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    spot_price_usd NUMERIC(10, 2) NOT NULL CHECK (spot_price_usd > 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vaults (
   id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  location VARCHAR(120) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deposits (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  metal_id SMALLINT NOT NULL REFERENCES metals(id) ON DELETE RESTRICT,
  vault_id BIGINT REFERENCES vaults(id) ON DELETE SET NULL,
  storage_type VARCHAR(20) NOT NULL CHECK (storage_type IN ('allocated', 'unallocated')),
  quantity_oz NUMERIC(18,6) NOT NULL CHECK (quantity_oz > 0),
  deposited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bars (
  id BIGSERIAL PRIMARY KEY,
  serial_number VARCHAR(80) UNIQUE NOT NULL,
  metal_id SMALLINT NOT NULL REFERENCES metals(id) ON DELETE RESTRICT,
  vault_id BIGINT REFERENCES vaults(id) ON DELETE SET NULL,
  gross_weight_oz NUMERIC(18,6) NOT NULL CHECK (gross_weight_oz > 0),
  fine_weight_oz NUMERIC(18,6) NOT NULL CHECK (fine_weight_oz > 0),
  purity NUMERIC(5,4) NOT NULL CHECK (purity > 0 AND purity <= 1),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bar_allocations (
  id BIGSERIAL PRIMARY KEY,
  deposit_id BIGINT NOT NULL REFERENCES deposits(id) ON DELETE CASCADE,
  bar_id BIGINT NOT NULL REFERENCES bars(id) ON DELETE RESTRICT,
  allocated_weight_oz NUMERIC(18,6) NOT NULL CHECK (allocated_weight_oz > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (deposit_id, bar_id)
);

INSERT INTO metals (code, name, spot_price_usd)
VALUES
  ('GOLD', 'Gold', 2350.00),
  ('SILVER', 'Silver', 28.50),
  ('PLATINUM', 'Platinum', 980.00)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  spot_price_usd = EXCLUDED.spot_price_usd,
  updated_at = NOW();

  COMMIT;