-- Migration 012: Add schools & directory support columns
-- Safe to re-run — all columns use IF NOT EXISTS

-- Schools directory fields
ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS slug          VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS address       TEXT,
  ADD COLUMN IF NOT EXISTS logo_url      TEXT,
  ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_active     BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_schools_slug     ON schools(slug);
CREATE INDEX IF NOT EXISTS idx_schools_is_active ON schools(is_active);

-- User directory fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active   BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_login   TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_school_active ON users(school_id, is_active);

-- Items catalogue fields (may already exist from earlier work, but idempotent)
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS school_id           INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS added_by            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quantity_total      INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS quantity_available  INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_active           BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS name              VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_items_school_active ON items(school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_items_added_by      ON items(added_by);

-- Backfill slugs from school names (safe for existing rows)
UPDATE schools
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'))
WHERE slug IS NULL;

-- Ensure unique slugs after backfill
ALTER TABLE schools ADD CONSTRAINT IF NOT EXISTS schools_slug_unique UNIQUE (slug);
