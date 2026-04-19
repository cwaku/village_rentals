-- Village Rentals — seed data
-- Member 1 owns this file's structure and the categories + equipment rows.
-- Members 2 and 3 APPEND their rows below the marked sections.
-- Source: data/data-samples.xlsx (sheets: Category List, Rental Equipment).

INSERT INTO categories (category_id, name) VALUES
  (10, 'Power tools'),
  (20, 'Yard equipment'),
  (30, 'Compressors'),
  (40, 'Generators'),
  (50, 'Air Tools');

INSERT INTO equipment (equipment_id, category_id, name, description, daily_rate, status) VALUES
  (101, 10, 'Hammer drill',     'Powerful drill for concrete and masonry',         25.99, 'AVAILABLE'),
  (201, 20, 'Chainsaw',         'Gas-powered chainsaw for cutting wood',           49.99, 'AVAILABLE'),
  (202, 20, 'Lawn mower',       'Self-propelled lawn mower with mulching function', 19.99, 'AVAILABLE'),
  (301, 30, 'Small Compressor', '5 Gallon Compressor-Portable',                    14.99, 'AVAILABLE'),
  (501, 50, 'Brad Nailer',      'Brad Nailer. Requires 3/4 to 1 1/2 Brad Nails',   10.99, 'AVAILABLE');

-- ============================================================
-- Member 2: append customer INSERTs below this line.
-- Sample rows from data-samples.xlsx:
--   (1001, 'Doe',   'John',    '(555) 555-1212', 'jd@sample.net', 0, 0),
--   (1002, 'Smith', 'Jane',    '(555) 555-3434', 'js@live.com',   0, 0),
--   (1003, 'Lee',   'Michael', '(555) 555-5656', 'ml@sample.net', 0, 0)
-- (set is_banned / has_discount flags as you see fit for demo purposes)
-- ============================================================


INSERT INTO rentals (rental_id, customer_id, date_created, rental_date, return_date, total_cost) VALUES
        (1000, 1001, '2024-02-15', '2024-02-20', '2024-02-23', 149.97),
        (1001, 1002, '2024-02-16', '2024-02-21', '2024-02-25', 43.96);

INSERT INTO rental_items (rental_item_id, rental_id, equipment_id, cost) VALUES
        (1, 1000, 201, 149.97),
        (2, 1001, 501, 43.96);

UPDATE equipment
SET status = 'RENTED'
WHERE equipment_id IN (201, 501);
