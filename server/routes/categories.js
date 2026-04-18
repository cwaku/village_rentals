import { Router } from 'express';
import { getDb, query, run } from '../db.js';
import { ok } from '../util.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare(
    'SELECT category_id, name FROM categories ORDER BY category_id'
  ).all();
  ok(res, rows);
});

export default router;
