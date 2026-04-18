import initSqlJs from 'sql.js';
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
  console.log(`Removed existing database at ${dbPath}`);
}

const SQL = await initSqlJs();
const db = new SQL.Database();

db.run('PRAGMA foreign_keys = ON;');

const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);
console.log('Schema applied.');

const seedSql = fs.readFileSync(seedPath, 'utf8');
db.exec(seedSql);
console.log('Seed data loaded.');

const counts = ['categories', 'equipment', 'customers', 'rentals', 'rental_items'];
for (const table of counts) {
  const [{ n }] = db.exec(`SELECT COUNT(*) AS n FROM ${table}`)[0].values.map(([n]) => ({ n }));
  console.log(`  ${table}: ${n} rows`);
}

const data = db.export();
fs.writeFileSync(dbPath, Buffer.from(data));
db.close();
console.log(`\nDatabase initialized at ${dbPath}`);
