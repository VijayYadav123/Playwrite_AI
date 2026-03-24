const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const DB_PATH = process.env.DB_PATH || './data/app.db';
const dbDir = path.dirname(DB_PATH);

// Database connection singleton
let db = null;

/**
 * Get database connection (creates if doesn't exist)
 * @returns {Promise<sqlite3.Database>}
 */
function getDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    // Ensure data directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        resolve(db);
      }
    });
  });
}

/**
 * Initialize database tables
 */
async function initializeDatabase() {
  const database = await getDatabase();

  return new Promise((resolve, reject) => {
    database.serialize(() => {
      // Settings table - stores JIRA and LLM configurations
      database.run(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          value TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating settings table:', err);
          reject(err);
          return;
        }
        console.log('Settings table ready');
      });

      // Tickets table - cached JIRA ticket data
      database.run(`
        CREATE TABLE IF NOT EXISTS tickets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ticket_key TEXT UNIQUE NOT NULL,
          summary TEXT,
          description TEXT,
          priority TEXT,
          status TEXT,
          assignee TEXT,
          labels TEXT,
          acceptance_criteria TEXT,
          raw_data TEXT,
          fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating tickets table:', err);
          reject(err);
          return;
        }
        console.log('Tickets table ready');
      });

      // Templates table - uploaded PDF templates
      database.run(`
        CREATE TABLE IF NOT EXISTS templates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          filename TEXT NOT NULL,
          content TEXT,
          file_path TEXT,
          file_size INTEGER,
          mime_type TEXT,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating templates table:', err);
          reject(err);
          return;
        }
        console.log('Templates table ready');
      });

      // History table - generated test plans
      database.run(`
        CREATE TABLE IF NOT EXISTS history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ticket_key TEXT NOT NULL,
          template_id INTEGER,
          provider TEXT,
          test_plan TEXT,
          generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (template_id) REFERENCES templates(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating history table:', err);
          reject(err);
          return;
        }
        console.log('History table ready');
        resolve();
      });
    });
  });
}

/**
 * Run a SQL query with parameters
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>}
 */
function run(sql, params = []) {
  return new Promise(async (resolve, reject) => {
    const database = await getDatabase();
    database.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

/**
 * Get a single row
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>}
 */
function get(sql, params = []) {
  return new Promise(async (resolve, reject) => {
    const database = await getDatabase();
    database.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
}

/**
 * Get all rows
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>}
 */
function all(sql, params = []) {
  return new Promise(async (resolve, reject) => {
    const database = await getDatabase();
    database.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

/**
 * Close database connection
 */
function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        db = null;
        console.log('Database connection closed');
        resolve();
      }
    });
  });
}

module.exports = {
  initializeDatabase,
  getDatabase,
  run,
  get,
  all,
  closeDatabase
};
