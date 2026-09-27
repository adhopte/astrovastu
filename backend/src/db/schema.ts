/** Append-only list of migrations. Never edit a migration that has shipped; add a new one. */
export const MIGRATIONS: string[] = [
  `
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT NOT NULL,
    avatar_url TEXT,
    language TEXT NOT NULL DEFAULT 'en',
    password_hash TEXT,
    created_at TEXT NOT NULL,
    last_login_at TEXT
  );
  CREATE UNIQUE INDEX users_email_unique ON users(lower(email)) WHERE email IS NOT NULL;

  -- One user can link several login methods (google, facebook, apple, email).
  CREATE TABLE auth_identities (
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (provider, provider_user_id)
  );
  CREATE INDEX auth_identities_user ON auth_identities(user_id);

  CREATE TABLE kundalis (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender TEXT,
    birth_date TEXT NOT NULL,
    birth_time TEXT NOT NULL,
    place_name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    timezone TEXT NOT NULL,
    chart_json TEXT NOT NULL,
    ai_reading_json TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX kundalis_user ON kundalis(user_id, created_at DESC);

  CREATE TABLE vastu_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    image_path TEXT,
    image_aspect REAL NOT NULL,
    north_angle REAL NOT NULL,
    center_x REAL NOT NULL,
    center_y REAL NOT NULL,
    rooms_json TEXT NOT NULL,
    score INTEGER NOT NULL,
    ai_detected INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE INDEX vastu_user ON vastu_records(user_id, created_at DESC);

  CREATE TABLE consultations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('astro', 'vastu', 'both')),
    kundali_id TEXT REFERENCES kundalis(id) ON DELETE SET NULL,
    vastu_id TEXT REFERENCES vastu_records(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX consultations_user ON consultations(user_id, created_at DESC);

  CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    metadata_json TEXT,
    ip TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX activity_user ON activity_log(user_id, created_at DESC);
  `,
];
