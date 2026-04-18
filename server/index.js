import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import equipmentRouter from './routes/equipment.js';
import categoriesRouter from './routes/categories.js';
import customersRouter from './routes/customers.js';
import rentalsRouter from './routes/rentals.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public');

const app = express();
app.use(express.json());
app.use(express.static(publicDir));

app.use('/api/equipment', equipmentRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/rentals', rentalsRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Village Rentals server running at http://localhost:${port}`);
});
