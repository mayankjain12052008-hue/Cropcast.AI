/*
# Create app_secrets table for storing API keys

1. New Tables
- `app_secrets` — stores API keys and secrets needed by edge functions
  - `key` (text, primary key) — the secret name (e.g. 'GEMINI_API_KEY')
  - `value` (text, not null) — the secret value
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- RLS enabled with NO policies — only the service role (used by edge functions) can read/write.
- The anon key client cannot access this table at all.
*/

CREATE TABLE IF NOT EXISTS app_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (which bypasses RLS) can access this table.
