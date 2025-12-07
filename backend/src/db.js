import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../data/agenda.db')

let db = null

// Initialize database
export const initDB = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ SQLite3 error:', err)
        reject(err)
      } else {
        console.log('✅ SQLite3 database initialized')
        
        // Create tables
        db.serialize(() => {
          db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            phone TEXT UNIQUE,
            passwordHash TEXT,
            plan TEXT DEFAULT 'free',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )`)

          db.run(`CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            professionalId TEXT,
            clientName TEXT,
            clientPhone TEXT,
            service TEXT,
            dateTime DATETIME,
            status TEXT DEFAULT 'pending',
            notes TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (professionalId) REFERENCES users(id)
          )`)

          db.run(`CREATE TABLE IF NOT EXISTS fee_ledgers (
            id TEXT PRIMARY KEY,
            userId TEXT,
            amount REAL,
            description TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users(id)
          )`, (err) => {
            if (err) {
              console.error('❌ Error creating tables:', err)
              reject(err)
            } else {
              resolve(db)
            }
          })
        })
      }
    })
  })
}

// Helper to run queries
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err)
      else resolve({ lastID: this.lastID, changes: this.changes })
    })
  })
}

// Helper to get single row
export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

// Helper to get all rows
export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

export const getDB = () => db
