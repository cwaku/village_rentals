// sql.js is uses only JavaScript instead of C/C++ 
import initSqlJs from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));  
const dbPath = path.resolve(__dirname, '..', 'db', 'village_rentals.db');

let db = null;

export async function getDb() {
    if (db) return db;

    const SQL = await initSqlJs();

    if(fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
    }else {
        db = new SQL.Database();
    }
    db.run('PRAGMA foreign_keys = ON;');
    return db;
}

export function saveDb() {
    if (!db) return;
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
}

export function query(db, sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

export function run(db, sql, params = []) {
    db.run(sql, params);
    saveDb();
}