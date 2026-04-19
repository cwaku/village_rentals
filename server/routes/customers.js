// Member 2: implement these endpoints.
// Pattern to follow: see server/routes/equipment.js.
// Expected endpoints:
//   GET    /api/customers            list all
//   GET    /api/customers/:id        fetch one
//   POST   /api/customers            add new (id, last_name, first_name, phone, email, is_banned, has_discount)
//   PATCH  /api/customers/:id        update fields
// Remember: the rental flow needs to check is_banned before allowing a rental,
// and needs to read has_discount to apply the 10% discount at rental time.
import { getDb, query, run } from '../db.js';
import { Router } from 'express';
import { ok } from '../util.js';

const router = Router();

function normalise(row) {
  if (!row) return null;
  return {
    ...row,
    is_banned:    Boolean(row.is_banned),
    has_discount: Boolean(row.has_discount),
  };
}
 
function validate(body) {
  const errors = [];
  if (!body.last_name  || !String(body.last_name).trim())  errors.push('last_name is required');
  if (!body.first_name || !String(body.first_name).trim()) errors.push('first_name is required');
  return errors;
}
 
// GET /api/customers
router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const rows = query(db, `
      SELECT customer_id, last_name, first_name, contact_phone, email, is_banned, has_discount
      FROM   customers
      ORDER  BY last_name, first_name
    `);
    ok(res, rows.map(normalise));
  } catch (err) { next(err); }
});
 
// GET /api/customers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const rows = query(db, 'SELECT * FROM customers WHERE customer_id = ?', [Number(req.params.id)]);
    if (!rows.length) return notFound(res, 'Customer not found');
    ok(res, normalise(rows[0]));
  } catch (err) { next(err); }
});
 
// POST /api/customers
router.post('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const errors = validate(req.body);
    if (errors.length) return badRequest(res, errors.join('; '));
 
    const { last_name, first_name, contact_phone = '', email = '',
            is_banned = false, has_discount = false } = req.body;
 
    run(db, `
      INSERT INTO customers (last_name, first_name, contact_phone, email, is_banned, has_discount)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      last_name.trim(), first_name.trim(),
      String(contact_phone).trim(), String(email).trim(),
      is_banned    ? 1 : 0,
      has_discount ? 1 : 0,
    ]);
 
    const rows = query(db, 'SELECT * FROM customers ORDER BY customer_id DESC LIMIT 1');
    created(res, normalise(rows[0]));
  } catch (err) { next(err); }
});
 
// PATCH /api/customers/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const id = Number(req.params.id);
    const existing = query(db, 'SELECT * FROM customers WHERE customer_id = ?', [id]);
    if (!existing.length) return notFound(res, 'Customer not found');
 
    const errors = validate(req.body);
    if (errors.length) return badRequest(res, errors.join('; '));
 
    const cur = existing[0];
    const {
      last_name, first_name,
      contact_phone = cur.contact_phone,
      email         = cur.email,
      is_banned     = cur.is_banned,
      has_discount  = cur.has_discount,
    } = req.body;
 
    run(db, `
      UPDATE customers
      SET last_name = ?, first_name = ?, contact_phone = ?, email = ?,
          is_banned = ?, has_discount = ?
      WHERE customer_id = ?
    `, [
      last_name.trim(), first_name.trim(),
      String(contact_phone).trim(), String(email).trim(),
      is_banned    ? 1 : 0,
      has_discount ? 1 : 0,
      id,
    ]);
 
    const updated = query(db, 'SELECT * FROM customers WHERE customer_id = ?', [id]);
    ok(res, normalise(updated[0]));
  } catch (err) { next(err); }
});
 
// PATCH /api/customers/:id/ban — toggle or set ban flag
router.patch('/:id/ban', async (req, res, next) => {
  try {
    const db = await getDb();
    const id = Number(req.params.id);
    const rows = query(db, 'SELECT * FROM customers WHERE customer_id = ?', [id]);
    if (!rows.length) return notFound(res, 'Customer not found');
 
    const newVal = req.body.is_banned !== undefined
      ? (req.body.is_banned ? 1 : 0)
      : (rows[0].is_banned ? 0 : 1);
 
    run(db, 'UPDATE customers SET is_banned = ? WHERE customer_id = ?', [newVal, id]);
    const updated = query(db, 'SELECT * FROM customers WHERE customer_id = ?', [id]);
    ok(res, normalise(updated[0]));
  } catch (err) { next(err); }
});
 
// PATCH /api/customers/:id/discount — toggle or set discount flag
router.patch('/:id/discount', async (req, res, next) => {
  try {
    const db = await getDb();
    const id = Number(req.params.id);
    const rows = query(db, 'SELECT * FROM customers WHERE customer_id = ?', [id]);
    if (!rows.length) return notFound(res, 'Customer not found');
 
    const newVal = req.body.has_discount !== undefined
      ? (req.body.has_discount ? 1 : 0)
      : (rows[0].has_discount ? 0 : 1);
 
    run(db, 'UPDATE customers SET has_discount = ? WHERE customer_id = ?', [newVal, id]);
    const updated = query(db, 'SELECT * FROM customers WHERE customer_id = ?', [id]);
    ok(res, normalise(updated[0]));
  } catch (err) { next(err); }
});
 
export default router;