// Member 2: implement these endpoints.
// Pattern to follow: see server/routes/equipment.js.
// Expected endpoints:
//   GET    /api/customers            list all
//   GET    /api/customers/:id        fetch one
//   POST   /api/customers            add new (id, last_name, first_name, phone, email, is_banned, has_discount)
//   PATCH  /api/customers/:id        update fields
// Remember: the rental flow needs to check is_banned before allowing a rental,
// and needs to read has_discount to apply the 10% discount at rental time.
import { Router } from 'express';
import { ok } from '../util.js';

const router = Router();

router.get('/', (req, res) => {
  ok(res, { todo: 'Member 2 — implement GET /api/customers' });
});

export default router;
