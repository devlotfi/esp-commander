DROP TABLE IF EXISTS Subscriptions;

CREATE TABLE Subscriptions (
  endpoint TEXT PRIMARY KEY,
  expiration_time INTEGER,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);