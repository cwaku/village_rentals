import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const dbPath = path.join(repoRoot, 'db', 'village_rentals.db');
const schemaPath = path.join(repoRoot, 'db', 'schema.sql');
const seedPath = path.join(repoRoot, 'db', 'seed.sql');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log(`Removed existing ${dbPath}`);
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);
console.log('Schema applied.');

const seedSql = fs.readFileSync(seedPath, 'utf8');
db.exec(seedSql);
console.log('Seed data loaded.');

const categoryCount = db.prepare('SELECT COUNT(*) AS n FROM categories').get().n;
const equipmentCount = db.prepare('SELECT COUNT(*) AS n FROM equipment').get().n;
console.log(`Categories: ${categoryCount}, Equipment: ${equipmentCount}`);

db.close();
console.log(`Database initialized at ${dbPath}`);
