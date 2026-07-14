// SQLite-backed persistence adapter (B4).
// Giữ nguyên ngữ nghĩa interface của db.js: mỗi entity là một MẢNG object;
// các hàm get* trả về mảng, add*/update*/delete* mutation trên mảng rồi lưu lại.
// Lưu vật lý vào 1 file SQLite (WAL) thay vì JSON/file -> an toàn đa process.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'app.sqlite');

// Các entity được lưu dưới dạng mảng trong bảng entities
export const ENTITY_NAMES = [
  'meta', 'settings', 'ports', 'items', 'suppliers', 'supplierPorts',
  'risks', 'tasks', 'team', 'costLogs', 'supplierQuotations', 'sCurve', 'documents',
];

let _db = null;
function db() {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('busy_timeout = 5000');
  _db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS entities (
      project_id TEXT,
      entity TEXT,
      id TEXT,
      data TEXT,
      PRIMARY KEY (project_id, entity, id)
    );
    CREATE INDEX IF NOT EXISTS idx_entities_proj ON entities(project_id, entity);
  `);
  return _db;
}

// In-memory cache để tránh parse JSON liên tục (như db.js cũ)
const cache = new Map(); // `${projectId}:${entity}` -> array

export function loadEntity(projectId, entity) {
  const key = `${projectId}:${entity}`;
  if (cache.has(key)) return cache.get(key);
  const rows = db()
    .prepare('SELECT data FROM entities WHERE project_id=? AND entity=?')
    .all(projectId, entity);
  const arr = rows.map((r) => JSON.parse(r.data));
  cache.set(key, arr);
  return arr;
}

// Lưu toàn bộ mảng entity (thay thế) trong 1 transaction
export function saveEntity(projectId, entity, arr) {
  const d = db();
  const del = d.prepare('DELETE FROM entities WHERE project_id=? AND entity=?');
  const ins = d.prepare('INSERT OR REPLACE INTO entities (project_id, entity, id, data) VALUES (?, ?, ?, ?)');
  const tx = d.transaction((items) => {
    del.run(projectId, entity);
    for (const it of items) {
      const id = String(it?.id ?? it?.code ?? it?.week ?? it?.username ?? '');
      ins.run(projectId, entity, id, JSON.stringify(it));
    }
  });
  tx(arr || []);
  cache.set(`${projectId}:${entity}`, arr || []);
}

export function ensureProject(projectId) {
  const row = db().prepare('SELECT id FROM projects WHERE id=?').get(projectId);
  return !!row;
}

export function createProjectRow(id, name, description, createdAt) {
  db().prepare('INSERT OR REPLACE INTO projects (id, name, description, created_at) VALUES (?, ?, ?, ?)')
    .run(id, name, description || '', createdAt || new Date().toISOString());
}

export function getProjectRows() {
  return db().prepare('SELECT id, name, description, created_at FROM projects').all();
}

export function deleteProjectRow(id) {
  db().prepare('DELETE FROM projects WHERE id=?').run(id);
  db().prepare('DELETE FROM entities WHERE project_id=?').run(id);
  // Clear cache for this project
  for (const key of cache.keys()) {
    if (key.startsWith(`${id}:`)) cache.delete(key);
  }
}

export function close() {
  if (_db) { _db.close(); _db = null; }
}
