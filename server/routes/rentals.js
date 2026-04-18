// Member 3: implement these endpoints.
// Pattern to follow: see server/routes/equipment.js.
// Expected endpoints:
//   GET    /api/rentals              list all rentals
//   GET    /api/rentals/:id          fetch one rental including rental_items
//   POST   /api/rentals              create new rental (body: customer_id, rental_date, return_date, items: [{equipment_id}])
// Business rules to enforce in POST:
//   - Look up the customer; if is_banned, reject with 400.
//   - For each item, confirm equipment.status = 'AVAILABLE'; otherwise reject.
//   - Compute cost per item = daily_rate * number_of_days (return_date - rental_date).
//   - Sum item costs -> total_cost; if customer.has_discount, multiply by 0.9.
//   - In a db.transaction: INSERT rental, INSERT each rental_item, UPDATE equipment.status = 'RENTED'.
import { getDb, query, run } from '../db.js';
import { Router } from 'express';
import { ok } from '../util.js';

const router = Router();

router.get('/', (req, res) => {
  ok(res, { todo: 'Member 3 — implement GET /api/rentals' });
});

export default router;
