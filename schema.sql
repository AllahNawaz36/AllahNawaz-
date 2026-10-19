CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL DEFAULT '',
  project TEXT NOT NULL,
  budget TEXT NOT NULL DEFAULT '',
  stage INTEGER NOT NULL DEFAULT 0 CHECK (stage >= 0 AND stage <= 20),
  notes TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
