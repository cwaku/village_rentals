# Village Rentals — CPSY 200 Final Project (Group 7)

Prototype for Part B of the CPSY 200 Final Project. Implements a basic inventory + customer + rental system for a fictional equipment-rental business, backed by SQLite.

## Tech Stack

- **Runtime:** Node.js 18+
- **Server:** Express 4
- **Database:** SQLite (via `sql.js`), seeded from `db/seed.sql`
- **Frontend:** vanilla HTML + CSS + ES modules (no framework, no bundler)

## Prerequisites

- Node.js 18 or newer (`node --version`)

## How to Run

```
npm install
npm run db:init      # builds db/village_rentals.db from schema + seed
npm start            # server on http://localhost:3000
```

Open `http://localhost:3000` in a browser.

To reset the database to clean seed state at any time, re-run `npm run db:init`.

## Features

| Area | Owner | Status |
|---|---|---|
| Equipment management (add, soft-delete, list, filter) | Member 1 | Done |
| Customer management (add, update, ban/discount flags, list) | Member 2 | In progress |
| Rental processing (create rental, availability + ban checks, discount, totals) | Member 3 | In progress |
| Main GUI wiring, persistence integrity, submission packaging, demo video | Member 4 | In progress |

## Project Structure

```
village_rentals/
├── data/                 Original sample data (data-samples.xlsx)
├── db/                   Schema, seed, runtime database file
├── scripts/init-db.js    Rebuilds db/village_rentals.db
├── server/               Express app
│   ├── index.js          Boot, middleware, route mounting
│   ├── db.js             Shared better-sqlite3 connection
│   ├── util.js           Response helpers
│   └── routes/           One router per feature area
└── public/               Static HTML / CSS / JS (one page per feature)
```

## Data Source

Sample data was taken from `data/data-samples.xlsx` and converted by hand into SQL `INSERT` statements inside `db/seed.sql`. The original xlsx is kept in the repo for reference.

## Team

Group 7 — Jedidiah Belayneh, Philips Dior, Mink Khoi Ha, Ricky Mormor.
