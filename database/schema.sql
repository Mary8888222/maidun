PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'researcher',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  area_mu REAL NOT NULL,
  variety TEXT NOT NULL,
  longitude REAL NOT NULL,
  latitude REAL NOT NULL,
  risk_level TEXT NOT NULL CHECK(risk_level IN ('低','中','高')),
  status TEXT NOT NULL,
  manager TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  plot_id INTEGER REFERENCES plots(id),
  status TEXT NOT NULL,
  battery INTEGER NOT NULL DEFAULT 100,
  last_seen TEXT NOT NULL,
  firmware TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS robot_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_code TEXT NOT NULL UNIQUE,
  robot_id INTEGER NOT NULL REFERENCES devices(id),
  plot_id INTEGER NOT NULL REFERENCES plots(id),
  route_name TEXT NOT NULL,
  distance_km REAL NOT NULL,
  samples_count INTEGER NOT NULL,
  progress INTEGER NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS pcr_samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sample_code TEXT NOT NULL UNIQUE,
  plot_id INTEGER NOT NULL REFERENCES plots(id),
  task_id INTEGER REFERENCES robot_tasks(id),
  collected_at TEXT NOT NULL,
  target_pathogen TEXT NOT NULL,
  ct_value REAL,
  result TEXT NOT NULL,
  confidence REAL NOT NULL,
  technician TEXT NOT NULL,
  batch_no TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS detections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  detection_code TEXT NOT NULL UNIQUE,
  plot_id INTEGER NOT NULL REFERENCES plots(id),
  sample_id INTEGER REFERENCES pcr_samples(id),
  detected_at TEXT NOT NULL,
  disease TEXT NOT NULL,
  method TEXT NOT NULL,
  severity REAL NOT NULL,
  confidence REAL NOT NULL,
  image_ref TEXT,
  review_status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_code TEXT NOT NULL UNIQUE,
  plot_id INTEGER NOT NULL REFERENCES plots(id),
  detection_id INTEGER REFERENCES detections(id),
  level TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  handled_at TEXT
);

CREATE TABLE IF NOT EXISTS control_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action_code TEXT NOT NULL UNIQUE,
  plot_id INTEGER NOT NULL REFERENCES plots(id),
  alert_id INTEGER REFERENCES alerts(id),
  action_type TEXT NOT NULL,
  plan TEXT NOT NULL,
  owner TEXT NOT NULL,
  status TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  completed_at TEXT,
  effectiveness REAL
);

CREATE TABLE IF NOT EXISTS environment_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plot_id INTEGER NOT NULL REFERENCES plots(id),
  recorded_at TEXT NOT NULL,
  temperature REAL NOT NULL,
  humidity REAL NOT NULL,
  wind_speed REAL NOT NULL,
  rainfall REAL NOT NULL,
  spore_index REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS video_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_code TEXT NOT NULL UNIQUE,
  plot_id INTEGER NOT NULL REFERENCES plots(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  resolution TEXT NOT NULL,
  last_frame_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_samples_plot_time ON pcr_samples(plot_id, collected_at);
CREATE INDEX IF NOT EXISTS idx_detections_plot_time ON detections(plot_id, detected_at);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status, created_at);
CREATE INDEX IF NOT EXISTS idx_env_plot_time ON environment_records(plot_id, recorded_at);
