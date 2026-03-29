import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'eldercaredb.sqlite3');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database at', dbPath);
  }
});

export const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create elders table
      db.run(`
        CREATE TABLE IF NOT EXISTS elders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          identification_number TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Create staff table
      db.run(`
        CREATE TABLE IF NOT EXISTS staff (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Create toileting_schedule table (default schedules per elder)
      db.run(`
        CREATE TABLE IF NOT EXISTS toileting_schedule (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          elder_id INTEGER NOT NULL,
          time_of_day TEXT NOT NULL,
          assistance_level INTEGER DEFAULT 2,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (elder_id) REFERENCES elders(id)
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Create daily_roster table (which elders are present each day)
      db.run(`
        CREATE TABLE IF NOT EXISTS daily_roster (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          elder_id INTEGER NOT NULL,
          is_present INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (elder_id) REFERENCES elders(id),
          UNIQUE(date, elder_id)
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Create toileting_events table (historical log)
      db.run(`
        CREATE TABLE IF NOT EXISTS toileting_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          elder_id INTEGER NOT NULL,
          scheduled_time TEXT NOT NULL,
          actual_time TEXT,
          completed_by_staff TEXT,
          notes TEXT,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (elder_id) REFERENCES elders(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database schema initialized successfully');
          resolve();
        }
      });
    });
  });
};

export const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const runSingleQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const runWrite = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};
