import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";

let db: SQLiteDatabase | null = null;

/**
 * Everything the app stores lives in this one on-device SQLite database —
 * there is no server. A single `profile` row replaces user accounts.
 */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS kundalis (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gender TEXT,
    birth_date TEXT NOT NULL,
    birth_time TEXT NOT NULL,
    place_name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    timezone TEXT NOT NULL,
    chart_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS kundalis_created ON kundalis(created_at DESC);

  CREATE TABLE IF NOT EXISTS vastu_records (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    image_path TEXT,
    image_aspect REAL NOT NULL,
    north_angle REAL NOT NULL,
    center_x REAL NOT NULL,
    center_y REAL NOT NULL,
    rooms_json TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS vastu_created ON vastu_records(created_at DESC);

  CREATE TABLE IF NOT EXISTS consultations (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('astro', 'vastu', 'both')),
    kundali_id TEXT REFERENCES kundalis(id) ON DELETE SET NULL,
    vastu_id TEXT REFERENCES vastu_records(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS consultations_created ON consultations(created_at DESC);

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS activity_created ON activity_log(created_at DESC);
`;

export function getDb(): SQLiteDatabase {
  if (db) return db;
  db = openDatabaseSync("astrovastu.db");
  db.execSync("PRAGMA journal_mode = WAL;");
  db.execSync("PRAGMA foreign_keys = ON;");
  db.execSync(SCHEMA);
  return db;
}
