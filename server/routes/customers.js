import { Router } from 'express';
import db from '../db.js';

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
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT customer_id, last_name, first_name, contact_phone, email,
           is_banned, has_discount
    FROM   customers
    ORDER  BY last_name COLLATE NOCASE, first_name COLLATE NOCASE
  `).all();
  res.json(rows.map(normalise));
});

// GET /api/customers/:id
router.get('/:id', (req, res) => {
  const row = db.prepare(
    'SELECT * FROM customers WHERE customer_id = ?'
  ).get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Customer not found' });
  res.json(normalise(row));
});

// POST /api/customers
router.post('/', (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });

  const { last_name, first_name, contact_phone = '', email = '',
          is_banned = false, has_discount = false } = req.body;

  const info = db.prepare(`
    INSERT INTO customers (last_name, first_name, contact_phone, email,
                           is_banned, has_discount)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    last_name.trim(), first_name.trim(),
    contact_phone.trim(), email.trim(),
    is_banned    ? 1 : 0,
    has_discount ? 1 : 0
  );

  const created = db.prepare(
    'SELECT * FROM customers WHERE customer_id = ?'
  ).get(info.lastInsertRowid);

  res.status(201).json(normalise(created));
});

// PATCH /api/customers/:id  (full update from Edit form)
router.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Customer not found' });

  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });

  const {
    last_name, first_name,
    contact_phone = existing.contact_phone,
    email         = existing.email,
    is_banned     = existing.is_banned,
    has_discount  = existing.has_discount,
  } = req.body;

  db.prepare(`
    UPDATE customers
    SET last_name = ?, first_name = ?, contact_phone = ?, email = ?,
        is_banned = ?, has_discount = ?
    WHERE customer_id = ?
  `).run(
    last_name.trim(), first_name.trim(),
    String(contact_phone).trim(), String(email).trim(),
    is_banned    ? 1 : 0,
    has_discount ? 1 : 0,
    id
  );

  res.json(normalise(db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(id)));
});

// PATCH /api/customers/:id/ban
router.patch('/:id/ban', (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Customer not found' });

  const newVal = req.body.is_banned !== undefined
    ? (req.body.is_banned ? 1 : 0)
    : (row.is_banned ? 0 : 1);

  db.prepare('UPDATE customers SET is_banned = ? WHERE customer_id = ?').run(newVal, id);
  res.json(normalise(db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(id)));
});

// PATCH /api/customers/:id/discount
router.patch('/:id/discount', (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Customer not found' });

  const newVal = req.body.has_discount !== undefined
    ? (req.body.has_discount ? 1 : 0)
    : (row.has_discount ? 0 : 1);

  db.prepare('UPDATE customers SET has_discount = ? WHERE customer_id = ?').run(newVal, id);
  res.json(normalise(db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(id)));
});

export default router;