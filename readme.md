# Digital Asset Custody Platform

Full-stack web app for managing physical precious-metal custody. Covers customer accounts, deposits, withdrawals, and asset valuation across allocated and unallocated storage.

Built for Bare Metals Pvt — Assessment 2.

---

## Stack

- **Frontend** — React 19, Vite, Tailwind CSS, Axios
- **Backend** — Node.js, Express 5
- **Database** — PostgreSQL

---

## Setup

You'll need Node.js v18+ and PostgreSQL on port 5432.

**Clone**

```bash
git clone <your-repo-url>
cd digital-asset-custody
```

**Database**

```bash
createdb bare_metals_db
psql -h localhost -U <your-pg-username> -d bare_metals_db -f backend/db/schema.sql
```

**Environment** — create `backend/.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=<your-pg-username>
DB_PASSWORD=<your-pg-password>
DB_NAME=bare_metals_db
```

**Backend** (port 3000)

```bash
cd backend
npm install
npm run dev   # or npm start for production
```

**Frontend** (port 5173)

```bash
cd frontend
npm install
npm run dev
```

---

## Architecture

```
React (Vite, :5173)  ◄──── HTTP/JSON ────►  Express API (:3000)  ────►  PostgreSQL
```

---

## Data Model

```
customers         id, name, email, type (retail | institutional)

metals            id, code (GOLD | SILVER | PLATINUM), name, spot_price_usd

vaults            id, name, location, is_active

deposits          id, deposit_number, customer_id, metal_id, vault_id,
                  storage_type (allocated | unallocated), quantity_kg, deposited_at

bars              id, serial_number, metal_id, vault_id,
                  gross_weight_kg, fine_weight_kg, purity, status (active | withdrawn)
                  — allocated storage only

bar_allocations   id, deposit_id, bar_id, allocated_weight_kg
                  — links a deposit to a specific bar

withdrawals       id, customer_id, metal_id, bar_id (nullable),
                  deposit_id (nullable), storage_type, quantity_kg, withdrawn_at
```

---

## API

Base URL: `http://localhost:3000/api`

---

**Customers**

```
GET  /customers         list all
POST /customers         create
GET  /customers/:id     get one (includes their deposits)
```

```json
// POST /customers
{
  "full_name": "Alice Smith",
  "email": "alice@example.com",
  "type": "retail"
}
```

`type` is either `"retail"` or `"institutional"`.

---

**Metals**

```
GET /metals     list all with spot prices
```

---

**Deposits**

```
POST /deposits
```

```json
// unallocated (pooled)
{
  "customer_id": 1,
  "metal_id": 1,
  "storage_type": "unallocated",
  "quantity_kg": 5.0
}

// allocated (specific bar)
{
  "customer_id": 2,
  "metal_id": 1,
  "storage_type": "allocated",
  "quantity_kg": 12.441,
  "serial_number": "BAR-AU-0042"
}
```

---

**Withdrawals**

```
POST /withdrawals
```

```json
// unallocated
{
  "customer_id": 1,
  "metal_id": 1,
  "storage_type": "unallocated",
  "quantity_kg": 2.0
}

// allocated (specific bar)
{
  "customer_id": 2,
  "metal_id": 1,
  "storage_type": "allocated",
  "quantity_kg": 12.441,
  "bar_id": 3
}
```

---

**Accounts**

```
GET /accounts/:id/portfolio      current holdings with USD valuation
GET /accounts/:id/transactions   full deposit + withdrawal history
```

---

## Design Decisions

**Quantities in kg** — the assessment specifies kg throughout. Spot prices are stored as USD per kg.

**Customer ID = Account ID** — each customer has one account, so `customer.id` is used directly across portfolio and transaction endpoints.

**Retail → Unallocated, Institutional → Allocated** — follows the case study, but the API doesn't enforce it strictly, which leaves room for edge cases.

**Allocated deposits create a bar** — a `bars` row is inserted and linked via `bar_allocations` so ownership is always traceable to a specific deposit.

**Purity defaults to 1.0** — bars are assumed 99.99% fine in this prototype. The schema supports arbitrary purity values.

**Unallocated balance computed at query time** — no separate balance table. Available balance = total deposited − total withdrawn per customer/metal pair.

**Gold, Silver, Platinum pre-seeded** — `schema.sql` inserts them so the app works out of the box.

---

## Edge Cases

1. **Duplicate bar serial number** — `bars.serial_number` is unique. Returns 409 with an error message.

2. **Unallocated withdrawal exceeds balance** — controller checks net available before writing. Returns 400 with `available_kg` and `requested_kg`.

3. **Withdrawing an already-withdrawn bar** — `bars.status` flips to `withdrawn` after a withdrawal. Any repeat attempt returns 400.

4. **Withdrawing someone else's bar** — ownership is verified via `bar_allocations → deposits`. Returns 403 if it doesn't match.

5. **Zero or negative quantity** — both controllers reject this with 422. The DB backs it up with a `CHECK (quantity_kg > 0)` constraint.

6. **Non-existent customer or metal** — both are looked up before inserting. Returns 404 if either is missing.

7. **Deleting a customer with deposits** — `deposits.customer_id` is `ON DELETE RESTRICT`, so Postgres blocks the delete at the DB level even if you bypass the API.
