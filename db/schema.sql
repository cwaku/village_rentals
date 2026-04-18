-- Village Rentals — database schema
-- Member 1 owns this file's structure and the categories + equipment tables.
-- Members 2 and 3 APPEND their tables below the marked sections.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  category_id   INTEGER PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS equipment (
  equipment_id  INTEGER PRIMARY KEY,
  category_id   INTEGER NOT NULL REFERENCES categories(category_id),
  name          TEXT NOT NULL,
  description   TEXT,
  daily_rate    REAL NOT NULL CHECK (daily_rate >= 0),
  status        TEXT NOT NULL DEFAULT 'AVAILABLE'
                CHECK (status IN ('AVAILABLE','RENTED','SOLD','DAMAGED'))
);

-- ============================================================
-- Member 2: append `customers` table below this line.
-- Expected columns (from Part A):
--   customer_id   INTEGER PRIMARY KEY,
--   last_name     TEXT NOT NULL,
--   first_name    TEXT NOT NULL,
--   contact_phone TEXT,
--   email         TEXT,
--   is_banned     INTEGER NOT NULL DEFAULT 0,
--   has_discount  INTEGER NOT NULL DEFAULT 0
-- ============================================================


-- ============================================================
-- Member 3: append `rentals` and `rental_items` tables below this line.
-- Expected:
--   rentals(rental_id PK, customer_id FK -> customers,
--           date_created TEXT, rental_date TEXT, return_date TEXT,
--           total_cost REAL)
--   rental_items(rental_item_id PK, rental_id FK -> rentals,
--                equipment_id FK -> equipment, cost REAL)
-- ============================================================
