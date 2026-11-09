CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  ip_hash TEXT
);
CREATE INDEX IF NOT EXISTS idx_messages_ip ON messages (ip_hash, created_at);
