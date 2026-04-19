import { Router } from 'express';
import { getDb, query} from '../db.js';
import { ok } from '../util.js';

const router = Router();

router.get('/', async (req, res, next) => {
    try {
        const db = await getDb();
        const rows = query(db, 'SELECT category_id, name FROM categories ORDER BY category_id');
        ok(res, rows);
    } catch (err) {
        next(err);
    }
});

export default router;
