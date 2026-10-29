CREATE TABLE IF NOT EXISTS choices(
  code TEXT PRIMARY KEY, giver TEXT NOT NULL, giver_birth TEXT NOT NULL,
  receiver TEXT NOT NULL, receiver_birth TEXT NOT NULL, giver_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL, activated_at TEXT);
CREATE TABLE IF NOT EXISTS rl(ip TEXT, kind TEXT, ts INTEGER);
CREATE INDEX IF NOT EXISTS rl_i ON rl(ip, kind, ts);
