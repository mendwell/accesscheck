CREATE TABLE IF NOT EXISTS checkups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edit_token_hash text NOT NULL,
  site jsonb NOT NULL DEFAULT '{}'::jsonb,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  section_index integer NOT NULL DEFAULT 0 CHECK (section_index BETWEEN 0 AND 4),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz
);

CREATE INDEX IF NOT EXISTS checkups_updated_at_idx ON checkups (updated_at DESC);
