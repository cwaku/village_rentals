import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '..', 'db', 'village_rentals.db');

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

export default db;
