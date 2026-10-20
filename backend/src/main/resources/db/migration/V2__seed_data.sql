-- =============================================================================
-- SOUL x TIME — Development Seed Data
-- V2__seed_data.sql
--
-- ⚠️  DEVELOPMENT ONLY — Do NOT run on production databases.
-- These are demo credentials for local development and testing.
--
-- Seed Accounts:
--   Admin:    admin@soulxtime.com / Admin@123
--   Customer: customer@demo.com   / Customer@123
--
-- Passwords are BCrypt-hashed (cost factor 12).
-- =============================================================================

-- ─────────────────────────────────────────────────────────────
-- USERS
-- Admin password: Admin@123
-- Customer password: Customer@123
-- ─────────────────────────────────────────────────────────────
INSERT INTO users (full_name, email, phone, password_hash, role, is_active)
VALUES
    ('Afino Admin',
     'admin@afino.com',
     '+91 9000000001',
     '$2a$12$G7JxaWHO9TRL9cMUTUham.n9JDdAtr0sSdKzi3C8sF6odHTZhnDES',
     'ADMIN',
     TRUE),

    ('taani',
     'taani@surinder.com',
     '+91 9000000003',
     '$2a$12$JtzRwJxd/nfosCKGxI1dL.Ys20IiODudFyosH2XSpHmvF5cg8.BCW',
     'CUSTOMER',
     TRUE);

-- ─────────────────────────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────────────────────────
INSERT INTO categories (name, slug, description, sort_order, is_active)
VALUES
    ('Luxury', 'luxury', 'Handcrafted timepieces for the discerning collector.', 1, TRUE),
    ('Sport', 'sport', 'Built for performance, designed for style.', 2, TRUE),
    ('Classic', 'classic', 'Timeless elegance that transcends trends.', 3, TRUE),
    ('Limited Edition', 'limited-edition', 'Rare pieces for extraordinary moments.', 4, TRUE),
    ('Casual', 'casual', 'Features versatile and durable timepieces for daily wear.', 5, TRUE);

-- ─────────────────────────────────────────────────────────────
-- PRODUCTS — Watch Collection
-- purchase_cost is admin-only; never exposed in customer APIs
-- ─────────────────────────────────────────────────────────────
INSERT INTO products (
    sku, name, brand, category_id, description,
    movement, case_material, strap_material, case_diameter_mm,
    dial_color, water_resistance, glass_type, gender_style, warranty_months,
    purchase_cost, selling_price, discount_type, discount_value,
    stock_quantity, low_stock_threshold, is_active,
    primary_image_url
)
VALUES
    -- Luxury
    ('ST-LX-001',
     'Celestial Noir',
     'Soul x Time',
     1,
     'A masterpiece forged in darkness. The Celestial Noir features a hand-wound mechanical movement visible through a sapphire exhibition caseback. Each dial is individually lacquered over 72 hours, resulting in a depth that cannot be photographed — only experienced.',
     'Swiss Automatic (ETA 2824)',
     'Grade 5 Titanium',
     'Alligator Leather',
     42.0,
     'Matte Black with Meteorite Subdials',
     '100m / 10ATM',
     'Anti-reflective Sapphire Crystal',
     'Unisex',
     24,
     12000.00, 38500.00, 'PERCENTAGE', 0,
     12, 3, TRUE,
     'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'),

    ('ST-LX-002',
     'Aurora Gold',
     'Soul x Time',
     1,
     'Inspired by the aurora borealis, the gradient dial of the Aurora Gold shifts between champagne gold and deep crimson as light catches its guilloche surface. The 18k gold case is hand-polished by master craftsmen in our atelier.',
     'Swiss Mechanical Hand-Wind',
     '18k Rose Gold',
     'Crocodile Leather — Burgundy',
     38.0,
     'Champagne-to-Crimson Gradient Guilloche',
     '30m / 3ATM',
     'Sapphire Crystal — Double Domed',
     'Unisex',
     36,
     28000.00, 85000.00, 'PERCENTAGE', 5,
     6, 2, TRUE,
     'https://images.unsplash.com/photo-1594576722512-48716a4cd01a?w=800&q=80'),

    -- Sport
    ('ST-SP-001',
     'Apex Chronograph',
     'Soul x Time',
     2,
     'Engineered for those who measure every second. The Apex Chronograph houses a column-wheel movement with 1/10th second precision, a ceramic bezel rated to 500m, and a bracelet that locks as securely as a vault.',
     'Swiss Automatic Chronograph (Valjoux 7750)',
     'Ceramic and DLC-coated Steel',
     'Rubber with Folding Clasp',
     45.0,
     'Racing Carbon Fiber',
     '500m / 50ATM',
     'Anti-scratch Sapphire',
     'Men',
     24,
     9500.00, 28000.00, 'PERCENTAGE', 10,
     20, 5, TRUE,
     'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&q=80'),

    ('ST-SP-002',
     'Meridian Diver',
     'Soul x Time',
     2,
     'Professional diving instrument. ISO 6425 certified, helium escape valve, luminescent indices visible to 30 meters depth. Worn by deep-sea engineers and ocean athletes. The Meridian goes where most watches dare not.',
     'Swiss Automatic (Sellita SW200)',
     'Polished 316L Steel with PVD',
     'Tropic Rubber + Steel Oyster Bracelet',
     44.0,
     'Deep Ocean Blue',
     '300m / 30ATM',
     'Anti-reflective Sapphire — Scratch Resistant',
     'Men',
     24,
     6000.00, 18500.00, 'PERCENTAGE', 0,
     15, 4, TRUE,
     'https://images.unsplash.com/photo-1548171915-b8f5b49a6e68?w=800&q=80'),

    -- Classic
    ('ST-CL-001',
     'Heritage Dress',
     'Soul x Time',
     3,
     'The watch your grandfather wished existed. Thin-profile at 6.5mm, the Heritage Dress disappears beneath a shirt cuff as it should. A silvered dial with printed indices, Breguet hands, and a case that respects tradition while embracing today.',
     'Swiss Manual Wind (Unitas 6498)',
     'Polished Stainless Steel',
     'Dark Brown Shell Cordovan',
     38.5,
     'Silvered Cream with Applied Gold Indices',
     '30m / 3ATM',
     'Flat Sapphire',
     'Men',
     24,
     4500.00, 14800.00, 'PERCENTAGE', 0,
     8, 3, TRUE,
     'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&q=80'),

    ('ST-CL-002',
     'Heirloom Pearl',
     'Soul x Time',
     3,
     'A bracelet watch reimagined as fine jewelry. The Heirloom Pearl features a mother-of-pearl dial framed in diamond-set bezels. Each piece is individually certified. A watch that passes through generations.',
     'Swiss Quartz (ETA 901.001)',
     '316L Steel with Diamond Bezel',
     'Integrated Bracelet',
     28.0,
     'Mother of Pearl',
     '30m / 3ATM',
     'Sapphire Crystal',
     'Women',
     24,
     15000.00, 45000.00, 'PERCENTAGE', 0,
     4, 2, TRUE,
     'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=800&q=80'),

    -- Smart
    ('ST-SM-001',
     'Quantum Hybrid',
     'Soul x Time',
     4,
     'Our first hybrid watch: traditional Swiss movement for the soul, embedded bio-sensors for the mind. Track heart rate, sleep, and stress while the hands sweep with mechanical grace. No charging required — the movement powers the sensors.',
     'Swiss Automatic + Hybrid Sensor Module',
     'Sapphire-coated Aluminum',
     'Silicone-Leather Hybrid',
     42.0,
     'Obsidian with Hidden Display Ring',
     '50m / 5ATM',
     'Gorilla Glass 6',
     'Unisex',
     12,
     11000.00, 32000.00, 'FIXED_AMOUNT', 2000,
     10, 3, TRUE,
     'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80'),

    -- Limited Edition (low stock examples)
    ('ST-LE-001',
     'Void — Ref. 001',
     'Soul x Time',
     5,
     'Only 50 pieces exist. The Void Ref. 001 features a skeletonized movement suspended in a double-sapphire sandwich case. You can see through the watch in every direction. Nothing is hidden. Everything is visible. Limited to 50 numbered examples worldwide.',
     'In-house Skeletonized Manual Wind',
     'Double-sapphire Sandwich',
     'Natural Rubber — Engraved',
     40.0,
     'Fully Skeletonized — Polished',
     '50m / 5ATM',
     'Double-sided Sapphire',
     'Unisex',
     60,
     45000.00, 145000.00, 'PERCENTAGE', 0,
     3, 5, TRUE,
     'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&q=80'),

    ('ST-LE-002',
     'Solstice Carbon',
     'Soul x Time',
     5,
     'Crafted for the summer solstice — the longest day of the year. The forged carbon case is unique in its grain pattern; no two are identical. Numbered 1-100 with individual certificates of authenticity.',
     'Swiss Automatic (Rotor Titanium)',
     'Forged Carbon with Titanium Caseback',
     'Caoutchouc Rubber — Carbon Fiber Pattern',
     43.0,
     'Anthracite Sunray',
     '100m / 10ATM',
     'AR-coated Sapphire',
     'Men',
     36,
     22000.00, 72000.00, 'PERCENTAGE', 0,
     2, 5, TRUE,
     'https://images.unsplash.com/photo-1614688953696-3fc2b7568e77?w=800&q=80'),

    -- Out of stock example
    ('ST-LX-003',
     'Phantom White',
     'Soul x Time',
     1,
     'An all-white statement. The Phantom White uses white gold, white ceramic, and a white lacquer dial — a monochromatic study in contrast through texture alone. Currently out of stock; join the waitlist.',
     'Swiss Automatic (ETA 2892)',
     'White Ceramic and White Gold',
     'White Satin with White PVD Buckle',
     40.0,
     'Pure White Lacquer with Hidden Lume',
     '50m / 5ATM',
     'Anti-reflective Sapphire',
     'Unisex',
     24,
     32000.00, 98000.00, 'PERCENTAGE', 0,
     0, 3, TRUE,
     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80');

-- ─────────────────────────────────────────────────────────────
-- PRODUCT IMAGES (gallery entries)
-- ─────────────────────────────────────────────────────────────
INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
VALUES
    (1, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', 'Celestial Noir front view', 1),
    (1, 'https://images.unsplash.com/photo-1584999734482-0361aecad844?w=800&q=80', 'Celestial Noir side view', 2),
    (3, 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&q=80', 'Apex Chronograph dial', 1),
    (3, 'https://images.unsplash.com/photo-1615380547903-9cfe5b0c34d3?w=800&q=80', 'Apex Chronograph bracelet', 2);

-- ─────────────────────────────────────────────────────────────
-- BILL NUMBER SEQUENCES — seed current year
-- ─────────────────────────────────────────────────────────────
INSERT INTO bill_number_sequences (year_key, last_seq) VALUES (2026, 0)
    ON CONFLICT (year_key) DO NOTHING;

INSERT INTO purchase_request_sequences (year_key, last_seq) VALUES (2026, 0)
    ON CONFLICT (year_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- SAMPLE PURCHASE REQUEST (demo data)
-- ─────────────────────────────────────────────────────────────
INSERT INTO purchase_requests (
    reference_id, user_id, customer_name, customer_phone,
    status, subtotal, total_discount, total_amount, notes
)
VALUES (
    'PR-2026-000001',
    2, -- Demo Customer
    'Demo Customer',
    '+91 90000 00002',
    'UNDER_REVIEW',
    38500.00,
    0.00,
    38500.00,
    'Demo purchase request for development testing'
);

INSERT INTO purchase_request_items (
    request_id, product_id,
    product_name, unit_price, discount_value, discount_type, quantity, line_total
)
VALUES (
    1, -- PR-2026-000001
    1, -- Celestial Noir
    'Celestial Noir',
    38500.00,
    0.00,
    'PERCENTAGE',
    1,
    38500.00
);

-- Update sequence
UPDATE purchase_request_sequences SET last_seq = 1 WHERE year_key = 2026;

-- ─────────────────────────────────────────────────────────────
-- SAMPLE BILL (demo data)
-- ─────────────────────────────────────────────────────────────
INSERT INTO bills (
    bill_number, user_id, customer_name, customer_phone,
    subtotal, total_discount, final_total,
    payment_method, payment_status, bill_status,
    purchase_request_id, created_by, notes
)
VALUES (
    'ST-2026-000001',
    2, -- Demo Customer
    'Demo Customer',
    '+91 90000 00002',
    28000.00,
    2800.00,
    25200.00,
    'UPI',
    'PAID',
    'PAID',
    NULL, -- not linked to PR for this demo bill
    1,    -- admin user
    'Sample paid bill for development testing'
);

INSERT INTO bill_items (
    bill_id, product_id,
    product_name_snapshot, selling_price_snapshot, purchase_cost_snapshot,
    discount_value_snapshot, discount_type_snapshot,
    quantity, line_discount_amount, total_price
)
VALUES (
    1, -- ST-2026-000001
    3, -- Apex Chronograph
    'Apex Chronograph',
    28000.00,
    9500.00,
    10.00,
    'PERCENTAGE',
    1,
    2800.00,
    25200.00
);

-- Update bill number sequence
UPDATE bill_number_sequences SET last_seq = 1 WHERE year_key = 2026;

-- ─────────────────────────────────────────────────────────────
-- INVENTORY TRANSACTIONS for the sample bill
-- ─────────────────────────────────────────────────────────────
INSERT INTO inventory_transactions (
    product_id, transaction_type, quantity_change,
    quantity_before, quantity_after,
    reason, reference_id, reference_type, performed_by
)
VALUES (
    3, -- Apex Chronograph
    'SALE',
    -1,
    21, -- was 21 before this sale
    20, -- now 20 (matches seeded stock)
    'Sale - Bill ST-2026-000001',
    1,
    'BILL',
    1  -- admin
);
