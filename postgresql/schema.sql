-- ============================================================================
-- BRASA VIVA - PostgreSQL Database Schema
-- Version: 1.0
-- Target: PostgreSQL 16+ / Supabase PostgreSQL
-- Architecture: Next.js -> NestJS -> PostgreSQL
-- Authoring goal: production-oriented MVP, modular monolith, multi-branch
--
-- IMPORTANT:
--   1) The API is the owner of business rules.
--   2) The browser must not write directly to business tables.
--   3) Prices sent by clients are never trusted; orders store server-calculated
--      snapshots of product/variant/add-on prices.
--   4) Business records use soft delete (deleted_at/deleted_by).
--   5) Audit triggers read:
--        SET LOCAL app.current_user_id = '<public.users.id>';
--        SET LOCAL app.request_id     = '<request-id>';
--        SET LOCAL app.client_ip      = '<ip>';
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- --------------------------------------------------------------------------
-- ENUMS
-- --------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE branch_status AS ENUM ('ACTIVE', 'INACTIVE', 'TEMPORARILY_CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE stock_status AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'NOT_TRACKED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE branch_service_type AS ENUM ('PICKUP', 'DELIVERY', 'DINE_IN', 'QR_PAYMENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE promotion_type AS ENUM ('FIXED_PRICE', 'PERCENTAGE', 'FIXED_DISCOUNT', 'BUNDLE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE order_type AS ENUM ('PICKUP', 'DELIVERY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'RECEIVED',
        'CONFIRMED',
        'PREPARING',
        'READY',
        'COMPLETED',
        'CANCELLED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'SOFT_DELETE', 'RESTORE', 'DELETE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE analytics_event_type AS ENUM (
        'MENU_VIEW',
        'PRODUCT_VIEW',
        'PRODUCT_ADDED',
        'CART_STARTED',
        'CHECKOUT_STARTED',
        'BRANCH_SELECTED',
        'PROMOTION_VIEW',
        'ORDER_CREATED',
        'WHATSAPP_OPENED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --------------------------------------------------------------------------
-- CORE SECURITY / USERS
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code            varchar(50) NOT NULL UNIQUE,
    name            varchar(100) NOT NULL,
    description     text,
    is_system       boolean NOT NULL DEFAULT true,

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid,
    updated_by      uuid,
    deleted_by      uuid
);

CREATE TABLE IF NOT EXISTS users (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Supabase Auth subject (auth.users.id). Kept separate from the app user id
    -- so audit history remains stable even if the authentication provider changes.
    auth_user_id    uuid UNIQUE,

    email           citext NOT NULL UNIQUE,
    full_name       varchar(160) NOT NULL,
    phone           varchar(40),
    status          user_status NOT NULL DEFAULT 'ACTIVE',
    last_login_at   timestamptz,

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid,
    updated_by      uuid,
    deleted_by      uuid
);

ALTER TABLE roles
    DROP CONSTRAINT IF EXISTS fk_roles_created_by,
    ADD CONSTRAINT fk_roles_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE roles
    DROP CONSTRAINT IF EXISTS fk_roles_updated_by,
    ADD CONSTRAINT fk_roles_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE roles
    DROP CONSTRAINT IF EXISTS fk_roles_deleted_by,
    ADD CONSTRAINT fk_roles_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE users
    DROP CONSTRAINT IF EXISTS fk_users_created_by,
    ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE users
    DROP CONSTRAINT IF EXISTS fk_users_updated_by,
    ADD CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE users
    DROP CONSTRAINT IF EXISTS fk_users_deleted_by,
    ADD CONSTRAINT fk_users_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS user_roles (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    role_id         uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT uq_user_roles UNIQUE (user_id, role_id)
);

-- --------------------------------------------------------------------------
-- BRANCHES
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS branches (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code            varchar(40) NOT NULL UNIQUE,
    name            varchar(140) NOT NULL,
    slug            varchar(160) NOT NULL UNIQUE,
    description     text,

    address_line    varchar(250) NOT NULL,
    city            varchar(100) NOT NULL DEFAULT 'Cochabamba',
    department      varchar(100) NOT NULL DEFAULT 'Cochabamba',
    country_code    char(2) NOT NULL DEFAULT 'BO',

    latitude        numeric(9,6),
    longitude       numeric(9,6),

    phone           varchar(40),
    whatsapp        varchar(40),
    google_maps_url text,
    image_url       text,
    status          branch_status NOT NULL DEFAULT 'ACTIVE',
    timezone        varchar(80) NOT NULL DEFAULT 'America/La_Paz',

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT chk_branch_latitude CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_branch_longitude CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE TABLE IF NOT EXISTS branch_business_hours (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       uuid NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    weekday         smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0 Sunday
    opens_at        time,
    closes_at       time,
    is_closed       boolean NOT NULL DEFAULT false,

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT uq_branch_hours UNIQUE (branch_id, weekday),
    CONSTRAINT chk_branch_hours
        CHECK (
            (is_closed = true AND opens_at IS NULL AND closes_at IS NULL)
            OR
            (is_closed = false AND opens_at IS NOT NULL AND closes_at IS NOT NULL)
        )
);

CREATE TABLE IF NOT EXISTS branch_services (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       uuid NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    service_type    branch_service_type NOT NULL,
    enabled         boolean NOT NULL DEFAULT true,

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT uq_branch_service UNIQUE (branch_id, service_type)
);

CREATE TABLE IF NOT EXISTS user_branches (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    branch_id       uuid NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT uq_user_branch UNIQUE (user_id, branch_id)
);

-- --------------------------------------------------------------------------
-- MENU
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            varchar(120) NOT NULL,
    slug            varchar(140) NOT NULL UNIQUE,
    description     text,
    display_order   integer NOT NULL DEFAULT 0,
    active          boolean NOT NULL DEFAULT true,

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS products (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,

    name            varchar(160) NOT NULL,
    slug            varchar(180) NOT NULL UNIQUE,
    description     text,
    base_price      numeric(12,2) NOT NULL CHECK (base_price >= 0),

    active          boolean NOT NULL DEFAULT true,
    featured        boolean NOT NULL DEFAULT false,
    is_new          boolean NOT NULL DEFAULT false,
    seo_title       varchar(180),
    seo_description varchar(320),

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS product_images (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    storage_path    text NOT NULL,
    alt_text        varchar(250),
    display_order   integer NOT NULL DEFAULT 0,
    is_primary      boolean NOT NULL DEFAULT false,

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_primary_image_active
    ON product_images(product_id)
    WHERE is_primary = true AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS product_variants (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    name            varchar(120) NOT NULL,
    sku             varchar(80) UNIQUE,
    price_delta     numeric(12,2) NOT NULL DEFAULT 0,
    active          boolean NOT NULL DEFAULT true,
    display_order   integer NOT NULL DEFAULT 0,

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT uq_product_variant_name UNIQUE (product_id, name)
);

CREATE TABLE IF NOT EXISTS addons (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            varchar(140) NOT NULL,
    price           numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    active          boolean NOT NULL DEFAULT true,

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS product_addons (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    addon_id        uuid NOT NULL REFERENCES addons(id) ON DELETE RESTRICT,
    required        boolean NOT NULL DEFAULT false,
    max_quantity    integer NOT NULL DEFAULT 1 CHECK (max_quantity > 0),

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT uq_product_addon UNIQUE (product_id, addon_id)
);

CREATE TABLE IF NOT EXISTS branch_products (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       uuid NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    product_id      uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

    available       boolean NOT NULL DEFAULT true,
    price_override  numeric(12,2) CHECK (price_override IS NULL OR price_override >= 0),
    stock_status    stock_status NOT NULL DEFAULT 'NOT_TRACKED',

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT uq_branch_product UNIQUE (branch_id, product_id)
);

-- --------------------------------------------------------------------------
-- PROMOTIONS
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS promotions (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name                varchar(160) NOT NULL,
    slug                varchar(180) NOT NULL UNIQUE,
    description         text,
    promotion_type      promotion_type NOT NULL,

    promo_price         numeric(12,2) CHECK (promo_price IS NULL OR promo_price >= 0),
    discount_percent    numeric(5,2) CHECK (
                            discount_percent IS NULL
                            OR (discount_percent > 0 AND discount_percent <= 100)
                        ),
    discount_amount     numeric(12,2) CHECK (
                            discount_amount IS NULL OR discount_amount > 0
                        ),

    starts_at           timestamptz NOT NULL,
    ends_at             timestamptz NOT NULL,
    active              boolean NOT NULL DEFAULT true,
    image_url           text,

    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz,
    created_by          uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by          uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by          uuid REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT chk_promotion_dates CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS promotion_products (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id    uuid NOT NULL REFERENCES promotions(id) ON DELETE RESTRICT,
    product_id      uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity        integer NOT NULL DEFAULT 1 CHECK (quantity > 0),

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT uq_promotion_product UNIQUE (promotion_id, product_id)
);

CREATE TABLE IF NOT EXISTS promotion_branches (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id    uuid NOT NULL REFERENCES promotions(id) ON DELETE RESTRICT,
    branch_id       uuid NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT uq_promotion_branch UNIQUE (promotion_id, branch_id)
);

-- --------------------------------------------------------------------------
-- CUSTOMERS / ORDERS
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customers (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       varchar(160),
    phone           varchar(40),
    email           citext,
    notes           text,

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_phone_active
    ON customers(phone)
    WHERE phone IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_email_active
    ON customers(email)
    WHERE email IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS orders (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number            bigint GENERATED BY DEFAULT AS IDENTITY UNIQUE,
    order_code              varchar(30) UNIQUE,

    branch_id               uuid NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    customer_id             uuid REFERENCES customers(id) ON DELETE RESTRICT,

    -- Snapshot: order history must remain readable even if customer changes later.
    customer_name           varchar(160) NOT NULL,
    customer_phone          varchar(40),
    customer_email          citext,

    type                    order_type NOT NULL,
    status                  order_status NOT NULL DEFAULT 'RECEIVED',

    requested_pickup_at     timestamptz,
    delivery_address        text,
    delivery_reference      text,

    subtotal                numeric(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    discount_total          numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
    delivery_fee            numeric(12,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    total                   numeric(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),

    customer_notes          text,
    whatsapp_opened_at      timestamptz,
    cancelled_at            timestamptz,
    cancellation_reason     text,

    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),
    deleted_at              timestamptz,
    created_by              uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by              uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by              uuid REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT chk_order_delivery_fields CHECK (
        (type = 'PICKUP' AND delivery_address IS NULL)
        OR
        (type = 'DELIVERY' AND delivery_address IS NOT NULL)
    ),
    CONSTRAINT chk_order_total_math CHECK (
        total = subtotal - discount_total + delivery_fee
    )
);

CREATE TABLE IF NOT EXISTS order_items (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id                uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,

    product_id              uuid REFERENCES products(id) ON DELETE RESTRICT,
    variant_id              uuid REFERENCES product_variants(id) ON DELETE RESTRICT,
    applied_promotion_id    uuid REFERENCES promotions(id) ON DELETE RESTRICT,

    -- Snapshots avoid historical corruption when catalog data changes.
    product_name            varchar(160) NOT NULL,
    variant_name            varchar(120),
    quantity                integer NOT NULL CHECK (quantity > 0),
    unit_price              numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    discount_amount         numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    line_total              numeric(12,2) NOT NULL CHECK (line_total >= 0),

    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),
    deleted_at              timestamptz,
    created_by              uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by              uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by              uuid REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT chk_order_item_math CHECK (
        line_total = (unit_price * quantity) - discount_amount
    )
);

CREATE TABLE IF NOT EXISTS order_item_addons (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id   uuid NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
    addon_id        uuid REFERENCES addons(id) ON DELETE RESTRICT,

    addon_name      varchar(140) NOT NULL,
    quantity        integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price      numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    line_total      numeric(12,2) NOT NULL CHECK (line_total >= 0),

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT chk_order_addon_math CHECK (
        line_total = unit_price * quantity
    )
);

CREATE TABLE IF NOT EXISTS order_status_history (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    from_status     order_status,
    to_status       order_status NOT NULL,
    note            text,

    changed_at      timestamptz NOT NULL DEFAULT now(),
    changed_by      uuid REFERENCES users(id) ON DELETE RESTRICT,

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT
);

-- --------------------------------------------------------------------------
-- CMS / SITE SETTINGS
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS banners (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title           varchar(180) NOT NULL,
    subtitle        text,
    image_url       text NOT NULL,
    cta_label       varchar(80),
    cta_url         text,
    starts_at       timestamptz,
    ends_at         timestamptz,
    active          boolean NOT NULL DEFAULT true,
    display_order   integer NOT NULL DEFAULT 0,

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT chk_banner_dates CHECK (
        ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at
    )
);

CREATE TABLE IF NOT EXISTS site_settings (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key     varchar(120) NOT NULL UNIQUE,
    setting_value   jsonb NOT NULL DEFAULT '{}'::jsonb,
    description     text,
    is_public       boolean NOT NULL DEFAULT false,

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT
);

-- --------------------------------------------------------------------------
-- ANALYTICS
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics_events (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      analytics_event_type NOT NULL,
    occurred_at     timestamptz NOT NULL DEFAULT now(),

    session_id      varchar(120),
    anonymous_id    varchar(120),

    branch_id       uuid REFERENCES branches(id) ON DELETE RESTRICT,
    product_id      uuid REFERENCES products(id) ON DELETE RESTRICT,
    promotion_id    uuid REFERENCES promotions(id) ON DELETE RESTRICT,
    order_id        uuid REFERENCES orders(id) ON DELETE RESTRICT,

    source          varchar(80),
    medium          varchar(80),
    campaign        varchar(160),
    metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    created_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    updated_by      uuid REFERENCES users(id) ON DELETE RESTRICT,
    deleted_by      uuid REFERENCES users(id) ON DELETE RESTRICT
);

-- --------------------------------------------------------------------------
-- CENTRAL AUDIT LOG
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_log (
    id              bigserial PRIMARY KEY,
    occurred_at     timestamptz NOT NULL DEFAULT now(),

    table_schema    text NOT NULL,
    table_name      text NOT NULL,
    record_id       text,
    action          audit_action NOT NULL,

    user_id         uuid REFERENCES users(id) ON DELETE RESTRICT,
    request_id      varchar(120),
    client_ip       inet,

    old_data        jsonb,
    new_data        jsonb,
    changed_fields  text[]
);

-- Audit log is append-only at the application level.
COMMENT ON TABLE audit_log IS
'Append-only audit trail. Do not UPDATE or DELETE rows from this table in normal application operation.';

-- --------------------------------------------------------------------------
-- GENERIC AUDIT / TIMESTAMP FUNCTIONS
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v text;
BEGIN
    v := current_setting('app.current_user_id', true);

    IF v IS NULL OR btrim(v) = '' THEN
        RETURN NULL;
    END IF;

    RETURN v::uuid;
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION app_request_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
    SELECT NULLIF(current_setting('app.request_id', true), '');
$$;

CREATE OR REPLACE FUNCTION app_client_ip()
RETURNS inet
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v text;
BEGIN
    v := current_setting('app.client_ip', true);
    IF v IS NULL OR btrim(v) = '' THEN
        RETURN NULL;
    END IF;
    RETURN v::inet;
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION fn_set_audit_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_user uuid;
BEGIN
    v_user := app_current_user_id();

    IF TG_OP = 'INSERT' THEN
        NEW.created_at := COALESCE(NEW.created_at, now());
        NEW.updated_at := COALESCE(NEW.updated_at, NEW.created_at);

        IF NEW.created_by IS NULL THEN
            NEW.created_by := v_user;
        END IF;

        IF NEW.updated_by IS NULL THEN
            NEW.updated_by := COALESCE(v_user, NEW.created_by);
        END IF;

        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        NEW.updated_at := now();

        IF v_user IS NOT NULL THEN
            NEW.updated_by := v_user;
        END IF;

        -- Soft delete
        IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
            IF NEW.deleted_by IS NULL THEN
                NEW.deleted_by := v_user;
            END IF;
        END IF;

        -- Restore
        IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
            NEW.deleted_by := NULL;
        END IF;

        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION jsonb_changed_keys(old_row jsonb, new_row jsonb)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT COALESCE(array_agg(key ORDER BY key), ARRAY[]::text[])
    FROM (
        SELECT key
        FROM (
            SELECT jsonb_object_keys(COALESCE(old_row, '{}'::jsonb)) AS key
            UNION
            SELECT jsonb_object_keys(COALESCE(new_row, '{}'::jsonb)) AS key
        ) all_keys
        WHERE COALESCE(old_row -> key, 'null'::jsonb)
              IS DISTINCT FROM
              COALESCE(new_row -> key, 'null'::jsonb)
    ) changed;
$$;

CREATE OR REPLACE FUNCTION fn_write_audit_log()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_old           jsonb;
    v_new           jsonb;
    v_action        audit_action;
    v_record_id     text;
    v_changed       text[];
BEGIN
    IF TG_TABLE_NAME = 'audit_log' THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        v_old := NULL;
        v_new := to_jsonb(NEW);
        v_action := 'INSERT';
        v_record_id := v_new ->> 'id';
        v_changed := jsonb_changed_keys(NULL, v_new);

    ELSIF TG_OP = 'UPDATE' THEN
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
        v_record_id := COALESCE(v_new ->> 'id', v_old ->> 'id');
        v_changed := jsonb_changed_keys(v_old, v_new);

        IF (v_old ->> 'deleted_at') IS NULL
           AND (v_new ->> 'deleted_at') IS NOT NULL THEN
            v_action := 'SOFT_DELETE';
        ELSIF (v_old ->> 'deleted_at') IS NOT NULL
              AND (v_new ->> 'deleted_at') IS NULL THEN
            v_action := 'RESTORE';
        ELSE
            v_action := 'UPDATE';
        END IF;

        -- Skip no-op updates.
        IF COALESCE(array_length(v_changed, 1), 0) = 0 THEN
            RETURN NEW;
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        v_old := to_jsonb(OLD);
        v_new := NULL;
        v_action := 'DELETE';
        v_record_id := v_old ->> 'id';
        v_changed := jsonb_changed_keys(v_old, NULL);
    END IF;

    INSERT INTO audit_log (
        table_schema,
        table_name,
        record_id,
        action,
        user_id,
        request_id,
        client_ip,
        old_data,
        new_data,
        changed_fields
    )
    VALUES (
        TG_TABLE_SCHEMA,
        TG_TABLE_NAME,
        v_record_id,
        v_action,
        app_current_user_id(),
        app_request_id(),
        app_client_ip(),
        v_old,
        v_new,
        v_changed
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

-- --------------------------------------------------------------------------
-- ORDER-SPECIFIC TRIGGERS
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_set_order_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.order_code IS NULL THEN
        NEW.order_code := 'BV-' || lpad(NEW.order_number::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_set_order_status_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE'
       AND OLD.status IS DISTINCT FROM NEW.status
       AND NEW.status = 'CANCELLED'
       AND NEW.cancelled_at IS NULL THEN
        NEW.cancelled_at := now();
    END IF;

    IF TG_OP = 'UPDATE'
       AND OLD.status = 'CANCELLED'
       AND NEW.status IS DISTINCT FROM OLD.status THEN
        NEW.cancelled_at := NULL;
        NEW.cancellation_reason := NULL;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_track_order_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO order_status_history (
            order_id, from_status, to_status, note, changed_by,
            created_by, updated_by
        )
        VALUES (
            NEW.id, NULL, NEW.status, 'Order created', app_current_user_id(),
            app_current_user_id(), app_current_user_id()
        );
        RETURN NEW;
    END IF;

    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (
            order_id, from_status, to_status, note, changed_by,
            created_by, updated_by
        )
        VALUES (
            NEW.id, OLD.status, NEW.status, NULL, app_current_user_id(),
            app_current_user_id(), app_current_user_id()
        );

    END IF;

    RETURN NEW;
END;
$$;

-- --------------------------------------------------------------------------
-- TRIGGER INSTALLATION
-- --------------------------------------------------------------------------

DO $$
DECLARE
    t text;
    audited_tables text[] := ARRAY[
        'roles',
        'users',
        'user_roles',
        'branches',
        'branch_business_hours',
        'branch_services',
        'user_branches',
        'categories',
        'products',
        'product_images',
        'product_variants',
        'addons',
        'product_addons',
        'branch_products',
        'promotions',
        'promotion_products',
        'promotion_branches',
        'customers',
        'orders',
        'order_items',
        'order_item_addons',
        'order_status_history',
        'banners',
        'site_settings',
        'analytics_events'
    ];
BEGIN
    FOREACH t IN ARRAY audited_tables LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_audit_columns ON %I', t, t);
        EXECUTE format(
            'CREATE TRIGGER trg_%I_audit_columns
             BEFORE INSERT OR UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION fn_set_audit_columns()',
            t, t
        );

        EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_audit_log ON %I', t, t);
        EXECUTE format(
            'CREATE TRIGGER trg_%I_audit_log
             AFTER INSERT OR UPDATE OR DELETE ON %I
             FOR EACH ROW EXECUTE FUNCTION fn_write_audit_log()',
            t, t
        );
    END LOOP;
END $$;

DROP TRIGGER IF EXISTS trg_orders_order_code ON orders;
CREATE TRIGGER trg_orders_order_code
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION fn_set_order_code();

DROP TRIGGER IF EXISTS trg_orders_status_fields ON orders;
CREATE TRIGGER trg_orders_status_fields
BEFORE UPDATE OF status ON orders
FOR EACH ROW EXECUTE FUNCTION fn_set_order_status_fields();

DROP TRIGGER IF EXISTS trg_orders_status_history ON orders;
CREATE TRIGGER trg_orders_status_history
AFTER INSERT OR UPDATE OF status ON orders
FOR EACH ROW EXECUTE FUNCTION fn_track_order_status();

-- --------------------------------------------------------------------------
-- INDEXES
-- --------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_users_status_active
    ON users(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_roles_user_active
    ON user_roles(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_branches_user_active
    ON user_branches(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_branches_status_active
    ON branches(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_categories_active_order
    ON categories(active, display_order) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_category_active
    ON products(category_id, active) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_featured_active
    ON products(featured, active) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_branch_products_branch_available
    ON branch_products(branch_id, available, stock_status)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_branch_products_product
    ON branch_products(product_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_promotions_active_window
    ON promotions(active, starts_at, ends_at)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_promotion_branches_branch
    ON promotion_branches(branch_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_branch_created
    ON orders(branch_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_status_created
    ON orders(status, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_customer
    ON orders(customer_id, created_at DESC)
    WHERE customer_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_order
    ON order_items(order_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_order_status_history_order
    ON order_status_history(order_id, changed_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred
    ON analytics_events(occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type_occurred
    ON analytics_events(event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record
    ON audit_log(table_name, record_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_user
    ON audit_log(user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_request
    ON audit_log(request_id)
    WHERE request_id IS NOT NULL;

-- --------------------------------------------------------------------------
-- VIEWS FOR SAFE / COMMON READS
-- --------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_active_products AS
SELECT
    p.id,
    p.category_id,
    p.name,
    p.slug,
    p.description,
    p.base_price,
    p.featured,
    p.is_new,
    p.created_at,
    p.updated_at
FROM products p
WHERE p.deleted_at IS NULL
  AND p.active = true;

CREATE OR REPLACE VIEW v_branch_menu AS
SELECT
    bp.branch_id,
    b.name AS branch_name,
    p.id AS product_id,
    p.name AS product_name,
    p.slug,
    p.category_id,
    COALESCE(bp.price_override, p.base_price) AS effective_price,
    bp.available,
    bp.stock_status,
    p.featured,
    p.is_new
FROM branch_products bp
JOIN branches b ON b.id = bp.branch_id
JOIN products p ON p.id = bp.product_id
WHERE bp.deleted_at IS NULL
  AND b.deleted_at IS NULL
  AND p.deleted_at IS NULL
  AND b.status = 'ACTIVE'
  AND p.active = true;

CREATE OR REPLACE VIEW v_active_promotions AS
SELECT p.*
FROM promotions p
WHERE p.deleted_at IS NULL
  AND p.active = true
  AND p.starts_at <= now()
  AND p.ends_at >= now();

-- --------------------------------------------------------------------------
-- COMMENTS / OPERATIONAL RULES
-- --------------------------------------------------------------------------

COMMENT ON COLUMN users.auth_user_id IS
'Supabase Auth user UUID. Do not use as the business audit PK; public.users.id is stable.';

COMMENT ON COLUMN branch_products.price_override IS
'Optional branch-specific product price. NULL means products.base_price applies.';

COMMENT ON COLUMN orders.total IS
'Server-calculated final amount. Never trust a total sent by the browser.';

COMMENT ON COLUMN order_items.unit_price IS
'Price snapshot at order creation time. Historical orders must not change when catalog prices change.';

COMMENT ON COLUMN order_items.product_name IS
'Product name snapshot at order creation time.';

COMMENT ON COLUMN site_settings.setting_value IS
'JSONB configuration value. Do not use this table as a substitute for relational business data.';

COMMIT;
