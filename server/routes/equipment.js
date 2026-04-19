import { Router } from 'express';
import { getDb, query, run } from '../db.js';
import { ok, created, badRequest, notFound } from '../util.js';

const router = Router();

const VALID_STATUSES = ['AVAILABLE', 'RENTED', 'SOLD', 'DAMAGED'];
const DELETE_STATUSES = ['SOLD', 'DAMAGED'];

const BASE_SQL = `
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

router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const { status, category_id } = req.query;
    const conditions = [];
    const params = [];

    if (status) {
      if (!VALID_STATUSES.includes(status)) 
        return badRequest(res, `status must be one of ${VALID_STATUSES.join(', ')}`);
      conditions.push('e.status = ?');
      params.push(status);
    }

    if (category_id) {
      const asInt = Number.parseInt(category_id, 10);
      if (!Number.isFinite(asInt)) return badRequest(res, 'category_id must be an integer');
      conditions.push('e.category_id = ?');
      params.push(asInt);
    }

    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const rows = query(db, `${BASE_SQL}${where} ORDER BY e.equipment_id`, params);
    ok(res, rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return badRequest(res, 'id must be an integer');

  const row = query(`${BASE_SQL} WHERE e.equipment_id = ?`, [id]);
  if (!row.length) return notFound(res, `Equipment ${id} not found`);
  ok(res, row);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const { category_id, name, description, daily_rate } = req.body ?? {};
    
    if (!Number.isInteger(category_id)) {
      return badRequest(res, 'category_id is required and must be an integer');
    }
    if (typeof name !== 'string' || !name.trim()) {
      return badRequest(res, 'name is required');
    }
    if (typeof daily_rate !== 'number' || !Number.isFinite(daily_rate) || daily_rate < 0) {
      return badRequest(res, 'daily_rate must be a number >= 0');
    }

    const category = query(db, 'SELECT 1 FROM categories WHERE category_id = ?', [category_id]);
    if (!category.length) return badRequest(res, `category_id ${category_id} does not exist`);

    run(db, 'INSERT INTO equipment (category_id, name, description, daily_rate, status) VALUES (?, ?, ?, ?, ?)',
      [category_id, name.trim(), description ?? '', daily_rate, 'AVAILABLE']
    );

    const rows = query(db, `${BASE_SQL} ORDER BY e.equipment_id DESC LIMIT 1`, []);
    created(res, rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const db = await getDb();
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return badRequest(res, 'id must be an integer');

  const { status } = req.body ?? {};
  if (!DELETE_STATUSES.includes(status)) {
    return badRequest(res, `status must be one of ${DELETE_STATUSES.join(', ')}`);
  }

    const existing = query(db, 'SELECT status FROM equipment WHERE equipment_id = ?', [id]);
    if (!existing.length) return notFound(res, `Equipment ${id} not found`);

    run(db, 'UPDATE equipment SET status = ? WHERE equipment_id = ?', [status, id]);

    const rows = query(db, `${BASE_SQL} WHERE e.equipment_id = ?`, [id]);
    ok(res, rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
