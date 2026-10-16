-- ============================================================================
-- BRASA VIVA - Minimal seed data
-- Safe to run after schema.sql
-- ============================================================================

BEGIN;

INSERT INTO roles (code, name, description, is_system)
VALUES
    ('OWNER', 'Propietario', 'Acceso total al sistema.', true),
    ('ADMIN', 'Administrador', 'Administración general sin ser propietario.', true),
    ('BRANCH_MANAGER', 'Gerente de sucursal', 'Gestiona una o más sucursales asignadas.', true),
    ('EDITOR', 'Editor', 'Gestiona menú, productos y promociones.', true),
    ('OPERATOR', 'Operador', 'Gestiona pedidos y operación diaria.', true)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = now();

INSERT INTO categories (name, slug, description, display_order, active)
VALUES
    ('Broaster', 'broaster', 'Pollo broaster y presentaciones relacionadas.', 10, true),
    ('Spiedo', 'spiedo', 'Pollo al spiedo.', 20, true),
    ('Combos', 'combos', 'Combos personales, dúo y familiares.', 30, true),
    ('Hamburguesas', 'hamburguesas', 'Hamburguesas y acompañamientos.', 40, true),
    ('Salchipapas', 'salchipapas', 'Salchipapas y variantes.', 50, true),
    ('Platos', 'platos', 'Platos preparados.', 60, true),
    ('Bebidas', 'bebidas', 'Bebidas y refrescos.', 70, true)
ON CONFLICT (slug) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    active = EXCLUDED.active,
    updated_at = now();

INSERT INTO site_settings (setting_key, setting_value, description, is_public)
VALUES
    (
        'brand',
        '{"name":"Brasa Viva","currency":"BOB","locale":"es-BO"}'::jsonb,
        'Configuración pública básica de marca.',
        true
    ),
    (
        'orders',
        '{"whatsappEnabled":true,"allowPickup":true,"allowDelivery":true}'::jsonb,
        'Configuración general del flujo de pedidos.',
        false
    )
ON CONFLICT (setting_key) DO UPDATE
SET
    setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description,
    is_public = EXCLUDED.is_public,
    updated_at = now();

COMMIT;
