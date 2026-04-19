import initSqlJs from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
 
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot   = path.resolve(__dirname, '..');
const dbPath     = path.join(repoRoot, 'db', 'village_rentals.db');
const schemaPath = path.join(repoRoot, 'db', 'schema.sql');
const seedPath   = path.join(repoRoot, 'db', 'seed.sql');
 
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log(`Removed existing database at ${dbPath}`);
}
 
const SQL = await initSqlJs();
const db  = new SQL.Database();
 
db.run('PRAGMA foreign_keys = ON');
 
function execFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
//   const sql = fs.readFileSync(filePath, 'utf8');
//   const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
//   for (const statement of statements) {
//     db.run(statement);
//   }
// }

  const cleaned = raw
    .split('\n')
    .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
    .join('\n');
 
  const statements = cleaned
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
 
  for (const stmt of statements) {
    db.run(stmt);
  }
}
 
execFile(schemaPath);
console.log('Schema applied.');
 
execFile(seedPath);
console.log('Seed data loaded.');
 
// Add 'customers', 'rentals', 'rental_items' once Members 2 & 3 are done
for (const table of ['categories', 'equipment', 'customers', 'rentals', 'rental_items']) {
  const result = db.exec(`SELECT COUNT(*) FROM ${table}`);
  const count  = result[0].values[0][0];
  console.log(`  ${table}: ${count} rows`);
}
 
const data = db.export();
fs.writeFileSync(dbPath, Buffer.from(data));
db.close();
console.log(`\nDatabase ready at ${dbPath}`);