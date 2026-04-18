// Member 3: implement the rental processing page here.
// Copy the structure of public/equipment.js and adapt it.
// UI flow suggestion:
//   1. Select a customer (dropdown populated from /api/customers).
//   2. If the customer is banned, show an error and disable the form.
//   3. Pick rental + return dates.
//   4. Add one or more equipment rows (only AVAILABLE equipment, from /api/equipment?status=AVAILABLE).
//   5. Show running total; apply 10% discount if customer.has_discount.
//   6. Submit -> POST /api/rentals. On success, refresh the equipment list (it's now RENTED).
