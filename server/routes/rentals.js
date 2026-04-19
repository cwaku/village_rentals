import { Router } from 'express';
import { getDb, query, saveDb } from '../db.js';
import { ok, created, badRequest, notFound } from '../util.js';

const router = Router();

function parseIsoDate(value) {
  if (typeof value !== 'string' || !value.trim()) return null;

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function getRentalDays(rentalDate, returnDate) {
  const start = parseIsoDate(rentalDate);
  const end = parseIsoDate(returnDate);

  if (!start || !end) return null;

  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = Math.round((end - start) / msPerDay);

  return diff > 0 ? diff : null;
}

function getRentalDetail(db, rentalId) {
  const rentalRows = query(
      db,
      `
      SELECT
        r.rental_id,
        r.customer_id,
        c.first_name,
        c.last_name,
        c.contact_phone,
        c.email,
        c.is_banned,
        c.has_discount,
        r.date_created,
        r.rental_date,
        r.return_date,
        r.total_cost
      FROM rentals r
      JOIN customers c ON c.customer_id = r.customer_id
      WHERE r.rental_id = ?
    `,
      [rentalId]
  );

  if (!rentalRows.length) return null;

  const itemRows = query(
      db,
      `
      SELECT
        ri.rental_item_id,
        ri.rental_id,
        ri.equipment_id,
        e.name AS equipment_name,
        e.description,
        e.daily_rate,
        ri.cost
      FROM rental_items ri
      JOIN equipment e ON e.equipment_id = ri.equipment_id
      WHERE ri.rental_id = ?
      ORDER BY ri.rental_item_id
    `,
      [rentalId]
  );

  return {
    ...rentalRows[0],
    items: itemRows
  };
}

router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();

    const rows = query(
        db,
        `
        SELECT
          r.rental_id,
          r.customer_id,
          c.first_name,
          c.last_name,
          r.date_created,
          r.rental_date,
          r.return_date,
          r.total_cost,
          COUNT(ri.rental_item_id) AS item_count
        FROM rentals r
        JOIN customers c ON c.customer_id = r.customer_id
        LEFT JOIN rental_items ri ON ri.rental_id = r.rental_id
        GROUP BY
          r.rental_id,
          r.customer_id,
          c.first_name,
          c.last_name,
          r.date_created,
          r.rental_date,
          r.return_date,
          r.total_cost
        ORDER BY r.rental_id DESC
      `
    );

    ok(res, rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const rentalId = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(rentalId)) {
      return badRequest(res, 'rental id must be an integer');
    }

    const rental = getRentalDetail(db, rentalId);
    if (!rental) {
      return notFound(res, `Rental ${rentalId} not found`);
    }

    ok(res, rental);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  let db;
  let transactionStarted = false;

  try {
    db = await getDb();

    const { customer_id, rental_date, return_date, items } = req.body ?? {};

    if (!Number.isInteger(customer_id)) {
      return badRequest(res, 'customer_id is required and must be an integer');
    }

    if (!Array.isArray(items) || items.length === 0) {
      return badRequest(res, 'items must be a non-empty array');
    }

    const days = getRentalDays(rental_date, return_date);
    if (!days) {
      return badRequest(res, 'return_date must be after rental_date');
    }

    const customerRows = query(
        db,
        `
        SELECT customer_id, first_name, last_name, is_banned, has_discount
        FROM customers
        WHERE customer_id = ?
      `,
        [customer_id]
    );

    if (!customerRows.length) {
      return badRequest(res, `customer_id ${customer_id} does not exist`);
    }

    const customer = customerRows[0];

    if (Number(customer.is_banned) === 1) {
      return badRequest(res, 'This customer is banned and cannot rent equipment');
    }

    const equipmentIds = items.map(item => Number.parseInt(item.equipment_id, 10));

    if (equipmentIds.some(id => !Number.isInteger(id))) {
      return badRequest(res, 'Each item must include a valid equipment_id');
    }

    const uniqueIds = new Set(equipmentIds);
    if (uniqueIds.size !== equipmentIds.length) {
      return badRequest(res, 'Duplicate equipment items are not allowed in one rental');
    }

    const itemCosts = [];

    for (const equipmentId of equipmentIds) {
      const equipmentRows = query(
          db,
          `
          SELECT equipment_id, name, daily_rate, status
          FROM equipment
          WHERE equipment_id = ?
        `,
          [equipmentId]
      );

      if (!equipmentRows.length) {
        return badRequest(res, `equipment_id ${equipmentId} does not exist`);
      }

      const equipment = equipmentRows[0];

      if (equipment.status !== 'AVAILABLE') {
        return badRequest(
            res,
            `Equipment ${equipmentId} (${equipment.name}) is not available`
        );
      }

      const cost = Number(equipment.daily_rate) * days;
      itemCosts.push({ equipment_id: equipmentId, cost });
    }

    let totalCost = itemCosts.reduce((sum, item) => sum + item.cost, 0);

    if (Number(customer.has_discount) === 1) {
      totalCost *= 0.9;
    }

    totalCost = Number(totalCost.toFixed(2));

    const dateCreated = new Date().toISOString().slice(0, 10);

    db.run('BEGIN');
    transactionStarted = true;

    db.run(
        `
        INSERT INTO rentals (customer_id, date_created, rental_date, return_date, total_cost)
        VALUES (?, ?, ?, ?, ?)
      `,
        [customer_id, dateCreated, rental_date, return_date, totalCost]
    );

    const rentalIdRow = query(db, 'SELECT last_insert_rowid() AS rental_id');
    const rentalId = rentalIdRow[0].rental_id;

    for (const item of itemCosts) {
      db.run(
          `
          INSERT INTO rental_items (rental_id, equipment_id, cost)
          VALUES (?, ?, ?)
        `,
          [rentalId, item.equipment_id, Number(item.cost.toFixed(2))]
      );

      db.run(
          `
          UPDATE equipment
          SET status = 'RENTED'
          WHERE equipment_id = ?
        `,
          [item.equipment_id]
      );
    }

    db.run('COMMIT');
    transactionStarted = false;

    saveDb();

    const createdRental = getRentalDetail(db, rentalId);
    created(res, createdRental);
  } catch (err) {
    if (db && transactionStarted) {
      try {
        db.run('ROLLBACK');
      } catch {
        // ignore rollback failure
      }
    }
    next(err);
  }
});

export default router;