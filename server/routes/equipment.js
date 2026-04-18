import { Router } from 'express';
import db from '../db.js';
import { ok, created, badRequest, notFound } from '../util.js';

const router = Router();

const VALID_STATUSES = ['AVAILABLE', 'RENTED', 'SOLD', 'DAMAGED'];
const DELETE_STATUSES = ['SOLD', 'DAMAGED'];

const selectWithCategorySql = `
  SELECT
    e.equipment_id,
    e.category_id,
    c.name AS category_name,
    e.name,
    e.description,
    e.daily_rate,
    e.status
  FROM equipment e
  JOIN categories c ON c.category_id = e.category_id
`;

router.get('/', (req, res) => {
  const { status, category_id } = req.query;
  const conditions = [];
  const params = {};

  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      return badRequest(res, `status must be one of ${VALID_STATUSES.join(', ')}`);
    }
    conditions.push('e.status = @status');
    params.status = status;
  }

  if (category_id) {
    const asInt = Number.parseInt(category_id, 10);
    if (!Number.isFinite(asInt)) {
      return badRequest(res, 'category_id must be an integer');
    }
    conditions.push('e.category_id = @category_id');
    params.category_id = asInt;
  }

  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const sql = `${selectWithCategorySql}${where} ORDER BY e.equipment_id`;
  const rows = db.prepare(sql).all(params);
  ok(res, rows);
});

router.get('/:id', (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return badRequest(res, 'id must be an integer');

  const row = db.prepare(
    `${selectWithCategorySql} WHERE e.equipment_id = ?`
  ).get(id);
  if (!row) return notFound(res, `Equipment ${id} not found`);
  ok(res, row);
});

router.post('/', (req, res) => {
  const { category_id, name, description, daily_rate } = req.body ?? {};

  if (!Number.isInteger(category_id)) {
    return badRequest(res, 'category_id is required and must be an integer');
  }
  if (typeof name !== 'string' || name.trim() === '') {
    return badRequest(res, 'name is required');
  }
  if (typeof daily_rate !== 'number' || !Number.isFinite(daily_rate) || daily_rate < 0) {
    return badRequest(res, 'daily_rate must be a number >= 0');
  }

  const category = db.prepare('SELECT 1 FROM categories WHERE category_id = ?').get(category_id);
  if (!category) return badRequest(res, `category_id ${category_id} does not exist`);

  const info = db.prepare(
    `INSERT INTO equipment (category_id, name, description, daily_rate)
     VALUES (@category_id, @name, @description, @daily_rate)`
  ).run({
    category_id,
    name: name.trim(),
    description: description ?? null,
    daily_rate,
  });

  const newRow = db.prepare(
    `${selectWithCategorySql} WHERE e.equipment_id = ?`
  ).get(info.lastInsertRowid);
  created(res, newRow);
});

router.patch('/:id/status', (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return badRequest(res, 'id must be an integer');

  const { status } = req.body ?? {};
  if (!DELETE_STATUSES.includes(status)) {
    return badRequest(res, `status must be one of ${DELETE_STATUSES.join(', ')}`);
  }

  const existing = db.prepare('SELECT status FROM equipment WHERE equipment_id = ?').get(id);
  if (!existing) return notFound(res, `Equipment ${id} not found`);

  db.prepare('UPDATE equipment SET status = ? WHERE equipment_id = ?').run(status, id);
  const updated = db.prepare(`${selectWithCategorySql} WHERE e.equipment_id = ?`).get(id);
  ok(res, updated);
});

export default router;
