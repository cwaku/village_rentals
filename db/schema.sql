-- Village Rentals — database schema
-- Member 1 owns this file's structure and the categories + equipment tables.
-- Members 2 and 3 APPEND their tables below the marked sections.

-- PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  category_id   INTEGER PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS equipment (
  equipment_id  INTEGER PRIMARY KEY AUTOINCREMENT,
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


CREATE TABLE IF NOT EXISTS rentals (
    rental_id     INTEGER PRIMARY KEY,
    customer_id   INTEGER NOT NULL REFERENCES customers(customer_id),
    date_created  TEXT NOT NULL,
    rental_date   TEXT NOT NULL,
    return_date   TEXT NOT NULL,
    total_cost    REAL NOT NULL CHECK (total_cost >= 0)
    );

CREATE TABLE IF NOT EXISTS rental_items (
    rental_item_id INTEGER PRIMARY KEY,
     rental_id     INTEGER NOT NULL REFERENCES rentals(rental_id) ON DELETE CASCADE,
    equipment_id   INTEGER NOT NULL REFERENCES equipment(equipment_id),
    cost           REAL NOT NULL CHECK (cost >= 0)
    );
