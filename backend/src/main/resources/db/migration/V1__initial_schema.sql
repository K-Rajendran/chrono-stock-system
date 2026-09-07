-- =============================================================================
-- SOUL x TIME — Initial Database Schema
-- V1__initial_schema.sql
--
-- Financial formula (documented per spec):
--   Net Revenue      = SUM(bill_items.total_price)  [after discounts]
--   Goods Cost       = SUM(bill_items.quantity × bill_items.purchase_cost_snapshot)
--   Gross Profit     = Net Revenue − Goods Cost
--
-- All monetary values use NUMERIC(12,2) to avoid floating-point errors.
-- All timestamps stored in UTC.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- ENUM TYPES
-- ─────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('CUSTOMER', 'ADMIN');

CREATE TYPE stock_status AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK');

CREATE TYPE inventory_transaction_type AS ENUM (
    'PURCHASE',
    'SALE',
    'RETURN',
    'ADJUSTMENT',
    'CANCELLATION'
);

CREATE TYPE purchase_request_status AS ENUM (
    'REQUESTED',
    'UNDER_REVIEW',
    'BILL_GENERATED',
    'SENT',
    'PAID',
    'PENDING',
    'CANCELLED',
    'COMPLETED'
);

CREATE TYPE bill_status AS ENUM (
    'DRAFT',
    'ISSUED',
    'SENT',
    'PAID',
    'CANCELLED'
);

CREATE TYPE payment_method AS ENUM (
    'CASH',
    'UPI',
    'CARD',
    'BANK_TRANSFER',
    'OTHER'
);

CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PAID',
    'PARTIAL',
    'CANCELLED'
);

CREATE TYPE discount_type AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

CREATE TYPE whatsapp_mode AS ENUM ('LINK', 'API');

-- ─────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE users (
    id              BIGSERIAL       PRIMARY KEY,
    full_name       VARCHAR(150)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    phone           VARCHAR(20),
    password_hash   VARCHAR(255)    NOT NULL,
    role            user_role       NOT NULL DEFAULT 'CUSTOMER',
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ─────────────────────────────────────────────────────────────
-- REFRESH TOKENS (HTTP-only cookie support)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE refresh_tokens (
    id          BIGSERIAL       PRIMARY KEY,
    user_id     BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255)    NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ     NOT NULL,
    is_revoked  BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user   ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash   ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expiry ON refresh_tokens(expires_at);

-- ─────────────────────────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE categories (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL UNIQUE,
    slug        VARCHAR(120)    NOT NULL UNIQUE,
    description TEXT,
    image_url   VARCHAR(500),
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    sort_order  INT             NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);

-- ─────────────────────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE products (
    id                  BIGSERIAL           PRIMARY KEY,
    sku                 VARCHAR(50)         NOT NULL UNIQUE,
    name                VARCHAR(200)        NOT NULL,
    brand               VARCHAR(100),
    category_id         BIGINT              REFERENCES categories(id) ON DELETE SET NULL,
    description         TEXT,
    -- Specifications (watch-specific)
    movement            VARCHAR(100),
    case_material       VARCHAR(100),
    strap_material      VARCHAR(100),
    case_diameter_mm    NUMERIC(5,1),
    dial_color          VARCHAR(100),
    water_resistance    VARCHAR(50),
    glass_type          VARCHAR(100),
    gender_style        VARCHAR(50),
    warranty_months     INT,
    -- Pricing (ADMIN sees purchase_cost; NEVER expose to customers)
    purchase_cost       NUMERIC(12,2)       NOT NULL DEFAULT 0,
    selling_price       NUMERIC(12,2)       NOT NULL,
    -- Discount on product level (percentage 0-100 or flat)
    discount_type       discount_type       DEFAULT 'PERCENTAGE',
    discount_value      NUMERIC(10,2)       NOT NULL DEFAULT 0,
    -- Inventory
    stock_quantity      INT                 NOT NULL DEFAULT 0,
    low_stock_threshold INT                 NOT NULL DEFAULT 5,
    stock_status        stock_status        NOT NULL DEFAULT 'OUT_OF_STOCK',
    -- Media
    primary_image_url   VARCHAR(500),
    model_3d_url        VARCHAR(500),
    -- Status
    is_active           BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    -- Optimistic locking for concurrency
    version             BIGINT              NOT NULL DEFAULT 0,

    CONSTRAINT chk_selling_price_positive CHECK (selling_price >= 0),
    CONSTRAINT chk_purchase_cost_positive CHECK (purchase_cost >= 0),
    CONSTRAINT chk_stock_non_negative     CHECK (stock_quantity >= 0),
    CONSTRAINT chk_discount_valid         CHECK (discount_value >= 0 AND discount_value <= 100 OR discount_type = 'FIXED_AMOUNT')
);

CREATE INDEX idx_products_category   ON products(category_id);
CREATE INDEX idx_products_sku        ON products(sku);
CREATE INDEX idx_products_active     ON products(is_active);
CREATE INDEX idx_products_stock      ON products(stock_status);
CREATE INDEX idx_products_name       ON products USING gin(to_tsvector('english', name));

-- ─────────────────────────────────────────────────────────────
-- PRODUCT IMAGES (gallery)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE product_images (
    id          BIGSERIAL       PRIMARY KEY,
    product_id  BIGINT          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url   VARCHAR(500)    NOT NULL,
    alt_text    VARCHAR(200),
    sort_order  INT             NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- ─────────────────────────────────────────────────────────────
-- INVENTORY TRANSACTIONS (full history, never overwrite stock blindly)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE inventory_transactions (
    id              BIGSERIAL                   PRIMARY KEY,
    product_id      BIGINT                      NOT NULL REFERENCES products(id),
    transaction_type inventory_transaction_type NOT NULL,
    quantity_change INT                         NOT NULL,  -- positive=add, negative=subtract
    quantity_before INT                         NOT NULL,
    quantity_after  INT                         NOT NULL,
    reason          VARCHAR(500),
    reference_id    BIGINT,                                -- bill_id or purchase_request_id
    reference_type  VARCHAR(50),                           -- 'BILL' | 'PURCHASE_REQUEST'
    performed_by    BIGINT                      REFERENCES users(id),
    created_at      TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_quantity_after_non_neg CHECK (quantity_after >= 0)
);

CREATE INDEX idx_inv_tx_product ON inventory_transactions(product_id);
CREATE INDEX idx_inv_tx_type    ON inventory_transactions(transaction_type);
CREATE INDEX idx_inv_tx_ref     ON inventory_transactions(reference_id, reference_type);

-- ─────────────────────────────────────────────────────────────
-- CARTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE carts (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_carts_user ON carts(user_id);

-- ─────────────────────────────────────────────────────────────
-- CART ITEMS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE cart_items (
    id          BIGSERIAL   PRIMARY KEY,
    cart_id     BIGINT      NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id  BIGINT      NOT NULL REFERENCES products(id),
    quantity    INT         NOT NULL DEFAULT 1,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (cart_id, product_id),
    CONSTRAINT chk_cart_qty_positive CHECK (quantity > 0)
);

CREATE INDEX idx_cart_items_cart    ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

-- ─────────────────────────────────────────────────────────────
-- PURCHASE REQUESTS (customer side of order workflow)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE purchase_requests (
    id              BIGSERIAL                   PRIMARY KEY,
    reference_id    VARCHAR(30)                 NOT NULL UNIQUE,  -- e.g. PR-2026-000001
    user_id         BIGINT                      NOT NULL REFERENCES users(id),
    customer_name   VARCHAR(150)                NOT NULL,
    customer_phone  VARCHAR(20)                 NOT NULL,
    status          purchase_request_status     NOT NULL DEFAULT 'REQUESTED',
    -- Price snapshots at time of request (backend-calculated, NEVER trusted from browser)
    subtotal        NUMERIC(12,2)               NOT NULL,
    total_discount  NUMERIC(12,2)               NOT NULL DEFAULT 0,
    total_amount    NUMERIC(12,2)               NOT NULL,
    notes           TEXT,
    -- Linked bill (set when admin generates bill)
    bill_id         BIGINT,
    -- WhatsApp tracking
    whatsapp_sent_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ                 NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pr_user      ON purchase_requests(user_id);
CREATE INDEX idx_pr_status    ON purchase_requests(status);
CREATE INDEX idx_pr_reference ON purchase_requests(reference_id);

-- ─────────────────────────────────────────────────────────────
-- PURCHASE REQUEST ITEMS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE purchase_request_items (
    id              BIGSERIAL   PRIMARY KEY,
    request_id      BIGINT      NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
    product_id      BIGINT      REFERENCES products(id) ON DELETE SET NULL,
    -- Snapshots (captured at request time; product changes don't affect history)
    product_name    VARCHAR(200) NOT NULL,
    unit_price      NUMERIC(12,2) NOT NULL,
    discount_value  NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount_type   discount_type NOT NULL DEFAULT 'PERCENTAGE',
    quantity        INT          NOT NULL,
    line_total      NUMERIC(12,2) NOT NULL,

    CONSTRAINT chk_pr_item_qty_positive CHECK (quantity > 0)
);

CREATE INDEX idx_pr_items_request ON purchase_request_items(request_id);

-- ─────────────────────────────────────────────────────────────
-- BILLS (admin-generated invoices)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE bills (
    id                  BIGSERIAL       PRIMARY KEY,
    bill_number         VARCHAR(30)     NOT NULL UNIQUE,  -- e.g. ST-2026-000001
    -- Customer info (stored separately for non-registered customers too)
    user_id             BIGINT          REFERENCES users(id) ON DELETE SET NULL,
    customer_name       VARCHAR(150)    NOT NULL,
    customer_phone      VARCHAR(20)     NOT NULL,
    -- Financial (backend-calculated)
    subtotal            NUMERIC(12,2)   NOT NULL,
    total_discount      NUMERIC(12,2)   NOT NULL DEFAULT 0,
    final_total         NUMERIC(12,2)   NOT NULL,
    -- Payment
    payment_method      payment_method  NOT NULL DEFAULT 'CASH',
    payment_status      payment_status  NOT NULL DEFAULT 'PENDING',
    transaction_ref     VARCHAR(100),
    -- Bill lifecycle
    bill_status         bill_status     NOT NULL DEFAULT 'DRAFT',
    -- Linked purchase request
    purchase_request_id BIGINT          REFERENCES purchase_requests(id) ON DELETE SET NULL,
    -- Admin who created this bill
    created_by          BIGINT          REFERENCES users(id),
    -- WhatsApp
    whatsapp_sent_at    TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bills_user     ON bills(user_id);
CREATE INDEX idx_bills_number   ON bills(bill_number);
CREATE INDEX idx_bills_status   ON bills(bill_status);
CREATE INDEX idx_bills_payment  ON bills(payment_status);
CREATE INDEX idx_bills_date     ON bills(created_at);
CREATE INDEX idx_bills_request  ON bills(purchase_request_id);

-- ─────────────────────────────────────────────────────────────
-- BILL ITEMS (snapshots — changing a product NEVER rewrites old bills)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE bill_items (
    id                      BIGSERIAL       PRIMARY KEY,
    bill_id                 BIGINT          NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    product_id              BIGINT          REFERENCES products(id) ON DELETE SET NULL,
    -- Historical snapshots at time of bill creation
    product_name_snapshot   VARCHAR(200)    NOT NULL,
    selling_price_snapshot  NUMERIC(12,2)   NOT NULL,
    purchase_cost_snapshot  NUMERIC(12,2)   NOT NULL,  -- used for profit calc; NEVER exposed to customer
    discount_value_snapshot NUMERIC(10,2)   NOT NULL DEFAULT 0,
    discount_type_snapshot  discount_type   NOT NULL DEFAULT 'PERCENTAGE',
    quantity                INT             NOT NULL,
    -- Pre-calculated at bill creation; used for financial reports
    line_discount_amount    NUMERIC(12,2)   NOT NULL DEFAULT 0,
    total_price             NUMERIC(12,2)   NOT NULL,  -- after discount

    CONSTRAINT chk_bill_item_qty_positive CHECK (quantity > 0),
    CONSTRAINT chk_bill_item_total CHECK (total_price >= 0)
);

CREATE INDEX idx_bill_items_bill    ON bill_items(bill_id);
CREATE INDEX idx_bill_items_product ON bill_items(product_id);

-- ─────────────────────────────────────────────────────────────
-- AUDIT LOG (sensitive admin actions)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
    id              BIGSERIAL       PRIMARY KEY,
    actor_id        BIGINT          REFERENCES users(id) ON DELETE SET NULL,
    actor_email     VARCHAR(255),
    action          VARCHAR(100)    NOT NULL,  -- e.g. BILL_CREATED, STOCK_ADJUSTED
    entity_type     VARCHAR(50),               -- e.g. BILL, PRODUCT
    entity_id       BIGINT,
    old_value       JSONB,
    new_value       JSONB,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor    ON audit_logs(actor_id);
CREATE INDEX idx_audit_action   ON audit_logs(action);
CREATE INDEX idx_audit_entity   ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date     ON audit_logs(created_at);

-- ─────────────────────────────────────────────────────────────
-- BILL NUMBER SEQUENCE CONTROL
-- Safe collision-free bill number generation
-- ─────────────────────────────────────────────────────────────
CREATE TABLE bill_number_sequences (
    year_key    INT         PRIMARY KEY,  -- e.g. 2026
    last_seq    BIGINT      NOT NULL DEFAULT 0
);

CREATE TABLE purchase_request_sequences (
    year_key    INT         PRIMARY KEY,
    last_seq    BIGINT      NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────────────────────────
-- TRIGGER: auto-update updated_at columns
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_products
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_categories
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_bills
    BEFORE UPDATE ON bills
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_purchase_requests
    BEFORE UPDATE ON purchase_requests
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_carts
    BEFORE UPDATE ON carts
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- TRIGGER: auto-update product stock_status
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_product_stock_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock_quantity = 0 THEN
        NEW.stock_status = 'OUT_OF_STOCK';
    ELSIF NEW.stock_quantity <= NEW.low_stock_threshold THEN
        NEW.stock_status = 'LOW_STOCK';
    ELSE
        NEW.stock_status = 'IN_STOCK';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_product_stock_status
    BEFORE INSERT OR UPDATE OF stock_quantity, low_stock_threshold ON products
    FOR EACH ROW EXECUTE FUNCTION update_product_stock_status();
