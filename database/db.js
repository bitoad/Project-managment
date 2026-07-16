import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import {
  sumRevenue, sumPlannedCost, sumActualCost, sumVAT,
  revenueInclVAT as computeRevenueInclVAT,
  profit, profitMargin, avgProgress as computeAvgProgress,
} from '../shared/formulas.js';
import {
  loadEntity, saveEntity, createProjectRow as sqliteCreateProject,
  getProjectRows as sqliteGetProjectRows, deleteProjectRow as sqliteDeleteProject,
  ensureProject as sqliteEnsureProject, close as sqliteClose,
} from './sqliteStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECTS_DIR = path.join(__dirname, 'projects');
const INDEX_PATH = path.join(PROJECTS_DIR, '_index.json');
const SEED_PATH = path.join(__dirname, 'seed-data.json');
const OLD_DB_PATH = path.join(__dirname, 'data.json');
const USERS_PATH = path.join(__dirname, 'users.json');

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });

// ============ MIGRATION: Chuyển data.json cũ sang projects/block-b-gas/ ============
function migrateOldData() {
  if (!fs.existsSync(OLD_DB_PATH) || fs.existsSync(path.join(PROJECTS_DIR, 'block-b-gas', 'data.json'))) {
    return; // Đã migrate hoặc không có data cũ
  }
  const oldData = JSON.parse(fs.readFileSync(OLD_DB_PATH, 'utf-8'));
  const projectDir = path.join(PROJECTS_DIR, 'block-b-gas');
  fs.mkdirSync(projectDir, { recursive: true });
  fs.writeFileSync(path.join(projectDir, 'data.json'), JSON.stringify(oldData, null, 2), 'utf-8');

  // Cập nhật index
  const idx = getIndex();
  if (!idx.find(p => p.id === 'block-b-gas')) {
    idx.push({
      id: 'block-b-gas',
      name: oldData.meta?.projectName || 'Block B Gas Project',
      description: oldData.meta?.client || 'Migrated from old data',
      createdAt: oldData.meta?.createdAt || new Date().toISOString(),
    });
    saveIndex(idx);
  }
  console.log('[DB] Migrated old data.json → projects/block-b-gas/');
}

// ============ PROJECT INDEX (danh sách dự án) ============
export function getIndex() {
  if (!fs.existsSync(INDEX_PATH)) {
    const defaultIndex = [{
      id: 'block-b-gas',
      name: 'Block B Gas Project',
      description: 'Golden Point Co., Ltd - PTSC M&C',
      createdAt: new Date().toISOString(),
    }];
    fs.writeFileSync(INDEX_PATH, JSON.stringify(defaultIndex, null, 2), 'utf-8');
    return defaultIndex;
  }
  return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
}

function saveIndex(index) {
  return withWriteLock('__INDEX__', () => {
    writeJsonAtomic(INDEX_PATH, JSON.stringify(index, null, 2));
  });
}

// ============ PROJECT CRUD ============
export function createProject(name, description) {
  const idx = getIndex();
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

  const createdAt = new Date().toISOString();
  sqliteCreateProject(id, name, description || '', createdAt);

  // Initialize empty entities in SQLite
  const entities = [
    'ports', 'items', 'suppliers', 'supplierPorts',
    'risks', 'tasks', 'team', 'costLogs', 'supplierQuotations', 'sCurve', 'documents',
  ];
  for (const e of entities) saveEntity(id, e, []);
  saveEntity(id, 'meta', [{ projectName: name, createdAt }]);
  saveEntity(id, 'settings', [{}]);

  const project = { id, name, description: description || '', createdAt };
  idx.push(project);
  saveIndex(idx);
  return project;
}

export function getProjects() {
  return getIndex();
}

export function getProjectById(id) {
  return getIndex().find(p => p.id === id);
}

export function updateProject(id, updates) {
  const idx = getIndex();
  const p = idx.find(p => p.id === id);
  if (p) {
    Object.assign(p, updates);
    saveIndex(idx);
    return p;
  }
  return null;
}

export function deleteProject(id) {
  dbCache.delete(id);
  sqliteDeleteProject(id);
  // Delete from JSON index
  const idx = getIndex().filter(p => p.id !== id);
  saveIndex(idx);
}

// ============ HELPER: Đường dẫn DB theo projectId ============
function getDbPath(projectId) {
  return path.join(PROJECTS_DIR, projectId, 'data.json');
}

// ============ CONCURRENCY SAFETY (hotfix ADR-011) ============
// JSON persistence dùng fs read-modify-write không nguyên tử → 2 request ghi
// cùng 1 project có thể mất dữ liệu (last-writer-wins). Khắc phục bằng:
//  1) in-memory cache: mọi request cùng project chia sẻ 1 object db → các
//     mutation cộng dồn trên cùng object, save cuối cùng ghi trạng thái đã gộp
//     (không đè nhau).
//  2) per-project write mutex: serialize các lần ghi file.
// Không đổi cấu trúc file JSON, không đổi schema.
const dbCache = new Map(); // projectId -> in-memory db object (shared)
const writeChains = new Map(); // projectId -> Promise chain serializing writes

function withWriteLock(projectId, task) {
  const prev = writeChains.get(projectId) || Promise.resolve();
  const node = prev
    .then(() => task())
    .catch((e) => console.error('[write lock error]', e));
  writeChains.set(projectId, node);
  node.finally(() => {
    if (writeChains.get(projectId) === node) writeChains.delete(projectId);
  });
  return node;
}

function ensureDb(projectId) {
  if (dbCache.has(projectId)) return dbCache.get(projectId);
  // Build full object from SQLite entities
  const entities = [
    'meta', 'settings', 'ports', 'items', 'suppliers', 'supplierPorts',
    'risks', 'tasks', 'team', 'costLogs', 'supplierQuotations', 'sCurve', 'documents',
  ];
  const db = {};
  for (const e of entities) {
    db[e] = loadEntity(projectId, e);
  }
  // meta is stored as a single-element array; unwrap to object
  if (Array.isArray(db.meta) && db.meta.length > 0) db.meta = db.meta[0];
  else if (Array.isArray(db.meta)) db.meta = {};
  // settings similarly
  if (Array.isArray(db.settings) && db.settings.length > 0) db.settings = db.settings[0];
  else if (Array.isArray(db.settings)) db.settings = {};
  dbCache.set(projectId, db);
  return db;
}

export function getProjectSearchData(projectId) {
  const db = ensureDb(projectId);
  return { items: db.items || [], tasks: db.tasks || [] };
}

// ============ PORTFOLIO (Tất cả dự án) ============
// Gộp một entity từ TẤT CẢ dự án thành một mảng, đánh dấu mỗi bản ghi bằng
// projectId + projectName để frontend hiển thị/phân biệt. Chế độ này CHỈ đọc
// (read-only); ghi vẫn dùng requireProject trên từng dự án cụ thể.
export function aggregateEntity(entity) {
  const all = getProjects();
  return all.flatMap((p) => {
    const rows = ensureDb(p.id)[entity] || [];
    return rows.map((r) => ({
      ...r,
      projectId: p.id,
      projectName: p.name,
      __key: `${p.id}__${r.id ?? r.code}`,
    }));
  });
}

// Atomic JSON write (ADR-011 follow-up): ghi ra file .tmp rồi rename để tránh
// file cụt/hỏng nếu process crash giữa lúc ghi. rename cùng volume là atomic.
function writeJsonAtomic(filePath, dataStr) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, dataStr, 'utf-8');
  fs.renameSync(tmp, filePath);
}

function save(projectId, data) {
  dbCache.set(projectId, data);
  // SQLite is primary persistence
  const entities = [
    'ports', 'items', 'suppliers', 'supplierPorts',
    'risks', 'tasks', 'team', 'costLogs', 'supplierQuotations', 'sCurve', 'documents',
  ];
  for (const e of entities) {
    saveEntity(projectId, e, data[e] || []);
  }
  if (data.meta) saveEntity(projectId, 'meta', [data.meta]);
  if (data.settings) saveEntity(projectId, 'settings', [data.settings]);
}

// Helper ID
function nextId(prefix, count) {
  return prefix + '-' + String(count + 1).padStart(3, '0');
}

// ============ META & SETTINGS ============
export function getMeta(projectId) {
  return ensureDb(projectId).meta;
}

export function updateMeta(projectId, updates) {
  const db = ensureDb(projectId);
  db.meta = { ...db.meta, ...updates };
  save(projectId, db);
  return db.meta;
}

export function getSettings(projectId) {
  return ensureDb(projectId).settings;
}

// ============ PORTS ============
export function getPorts(projectId) {
  return ensureDb(projectId).ports;
}

export function addPort(projectId, port) {
  const db = ensureDb(projectId);
  const id = port.id || ('PORT ' + (db.ports.length + 1));
  const newPort = {
    id,
    name: port.name || id,
    description: port.description || '',
    status: port.status || 'Engineering',
    progress: port.progress || 0,
    contractValue: port.contractValue || 0,
    paymentReceived: port.paymentReceived || 0,
    budget: port.budget || 0,
    actual: port.actual || 0,
    plannedProgress: port.plannedProgress || 0,
    createdAt: new Date().toISOString(),
  };
  db.ports.push(newPort);
  save(projectId, db);
  return newPort;
}

export function getPortById(projectId, id) {
  return ensureDb(projectId).ports.find(p => p.id === id);
}

export function updatePort(projectId, id, updates) {
  const db = ensureDb(projectId);
  const idx = db.ports.findIndex(p => p.id === id);
  if (idx !== -1) {
    db.ports[idx] = { ...db.ports[idx], ...updates };
    save(projectId, db);
    return db.ports[idx];
  }
  return null;
}

export function deletePort(projectId, id) {
  const db = ensureDb(projectId);
  const exists = db.ports.some(p => p.id === id);
  if (!exists) return false;
  // Cascade: xóa luôn dữ liệu liên kết (item / task / costLog / supplierPort)
  db.items = db.items.filter(i => i.port !== id && i.portId !== id);
  db.tasks = db.tasks.filter(t => t.portId !== id);
  db.costLogs = db.costLogs.filter(c => c.portId !== id);
  db.ports = db.ports.filter(p => p.id !== id);
  db.supplierPorts = db.supplierPorts.filter(sp => sp.portId !== id);
  save(projectId, db);
  return true;
}

// ============ ITEMS ============
export function getItems(projectId) {
  return ensureDb(projectId).items;
}

export function getItemByCode(projectId, code) {
  return ensureDb(projectId).items.find(i => i.code === code);
}

export function addItem(projectId, item) {
  const db = ensureDb(projectId);
  db.items.push(item);
  save(projectId, db);
  return item;
}

export function updateItem(projectId, code, updates) {
  const db = ensureDb(projectId);
  const idx = db.items.findIndex(i => i.code === code);
  if (idx !== -1) {
    db.items[idx] = { ...db.items[idx], ...updates };
    save(projectId, db);
    return db.items[idx];
  }
  return null;
}

export function deleteItem(projectId, code) {
  const db = ensureDb(projectId);
  const exists = db.items.some(i => i.code === code);
  if (!exists) return false;
  const linkedCosts = db.costLogs.filter(c => c.itemCode === code).length;
  const linkedTasks = db.tasks.filter(t => t.itemCode === code).length;
  const linkedQuotes = db.supplierQuotations.filter(q => q.itemCode === code).length;
  if (linkedCosts > 0 || linkedTasks > 0 || linkedQuotes > 0) {
    const err = new Error('ITEM_HAS_LINKED_DATA');
    err.code = 'ITEM_HAS_LINKED_DATA';
    err.details = { costLogs: linkedCosts, tasks: linkedTasks, quotations: linkedQuotes };
    throw err;
  }
  db.items = db.items.filter(i => i.code !== code);
  save(projectId, db);
}

// ============ SUPPLIERS ============
export function getSuppliers(projectId) {
  return ensureDb(projectId).suppliers;
}

export function addSupplier(projectId, supplier) {
  const db = ensureDb(projectId);
  const id = nextId('SUP', db.suppliers.length);
  const newSupplier = { id, ...supplier, createdAt: new Date().toISOString() };
  db.suppliers.push(newSupplier);
  save(projectId, db);
  return newSupplier;
}

export function updateSupplier(projectId, id, updates) {
  const db = ensureDb(projectId);
  const idx = db.suppliers.findIndex(s => s.id === id);
  if (idx !== -1) {
    db.suppliers[idx] = { ...db.suppliers[idx], ...updates };
    save(projectId, db);
    return db.suppliers[idx];
  }
  return null;
}

export function deleteSupplier(projectId, id) {
  const db = ensureDb(projectId);
  const exists = db.suppliers.some(s => s.id === id);
  if (!exists) return false;
  const linkedPorts = db.supplierPorts.filter(sp => sp.supplierId === id).length;
  if (linkedPorts > 0) {
    const err = new Error('SUPPLIER_HAS_LINKED_DATA');
    err.code = 'SUPPLIER_HAS_LINKED_DATA';
    err.details = { supplierPorts: linkedPorts };
    throw err;
  }
  db.suppliers = db.suppliers.filter(s => s.id !== id);
  save(projectId, db);
}

// ============ SUPPLIER PORTS ============
export function getSupplierPorts(projectId) {
  return ensureDb(projectId).supplierPorts;
}

export function getSupplierPortsByPort(projectId, portId) {
  return ensureDb(projectId).supplierPorts.filter(sp => sp.portId === portId);
}

export function addSupplierPort(projectId, sp) {
  const db = ensureDb(projectId);
  const id = nextId('SP', db.supplierPorts.length);
  const newSP = { id, ...sp, createdAt: new Date().toISOString() };
  db.supplierPorts.push(newSP);
  save(projectId, db);
  return newSP;
}

export function updateSupplierPort(projectId, id, updates) {
  const db = ensureDb(projectId);
  const idx = db.supplierPorts.findIndex(sp => sp.id === id);
  if (idx !== -1) {
    db.supplierPorts[idx] = { ...db.supplierPorts[idx], ...updates };
    save(projectId, db);
    return db.supplierPorts[idx];
  }
  return null;
}

export function deleteSupplierPort(projectId, id) {
  const db = ensureDb(projectId);
  db.supplierPorts = db.supplierPorts.filter(sp => sp.id !== id);
  save(projectId, db);
}

// ============ RISKS ============
export function getRisks(projectId) {
  return ensureDb(projectId).risks;
}

export function addRisk(projectId, risk) {
  const db = ensureDb(projectId);
  const id = nextId('R', db.risks.length);
  const newRisk = {
    id, ...risk,
    score: (risk.probability || 1) * (risk.impact || 1),
    status: risk.status || 'open',
    createdAt: new Date().toISOString(),
  };
  db.risks.push(newRisk);
  save(projectId, db);
  return newRisk;
}

export function updateRisk(projectId, id, updates) {
  const db = ensureDb(projectId);
  const idx = db.risks.findIndex(r => r.id === id);
  if (idx !== -1) {
    const updated = { ...db.risks[idx], ...updates };
    if (updates.probability !== undefined || updates.impact !== undefined) {
      updated.score = (updated.probability || 1) * (updated.impact || 1);
    }
    db.risks[idx] = updated;
    save(projectId, db);
    return db.risks[idx];
  }
  return null;
}

export function deleteRisk(projectId, id) {
  const db = ensureDb(projectId);
  db.risks = db.risks.filter(r => r.id !== id);
  save(projectId, db);
}

// ============ TASKS ============
export function getTasks(projectId) {
  return ensureDb(projectId).tasks;
}

export function addTask(projectId, task) {
  const db = ensureDb(projectId);
  const id = nextId('T', db.tasks.length);
  const newTask = { id, ...task, status: task.status || 'todo', createdAt: new Date().toISOString() };
  db.tasks.push(newTask);
  save(projectId, db);
  return newTask;
}

export function updateTask(projectId, id, updates) {
  const db = ensureDb(projectId);
  const idx = db.tasks.findIndex(t => t.id === id);
  if (idx !== -1) {
    db.tasks[idx] = { ...db.tasks[idx], ...updates };
    save(projectId, db);
    return db.tasks[idx];
  }
  return null;
}

export function deleteTask(projectId, id) {
  const db = ensureDb(projectId);
  db.tasks = db.tasks.filter(t => t.id !== id);
  save(projectId, db);
}

// ============ TEAM ============
export function getTeam(projectId) {
  return ensureDb(projectId).team;
}

export function addMember(projectId, member) {
  const db = ensureDb(projectId);
  const id = nextId('TM', db.team.length);
  const newMember = { id, ...member, createdAt: new Date().toISOString() };
  db.team.push(newMember);
  save(projectId, db);
  return newMember;
}

export function updateMember(projectId, id, updates) {
  const db = ensureDb(projectId);
  const idx = db.team.findIndex(m => m.id === id);
  if (idx !== -1) {
    db.team[idx] = { ...db.team[idx], ...updates };
    save(projectId, db);
    return db.team[idx];
  }
  return null;
}

export function deleteMember(projectId, id) {
  const db = ensureDb(projectId);
  db.team = db.team.filter(m => m.id !== id);
  save(projectId, db);
}

// ============ COST LOGS ============
export function getCostLogs(projectId) {
  return ensureDb(projectId).costLogs;
}

export function addCostLog(projectId, log) {
  const db = ensureDb(projectId);
  const id = nextId('CL', db.costLogs.length);
  const newLog = { id, ...log, createdAt: new Date().toISOString() };
  db.costLogs.push(newLog);
  save(projectId, db);
  return newLog;
}

export function updateCostLog(projectId, id, updates) {
  const db = ensureDb(projectId);
  const idx = db.costLogs.findIndex(c => c.id === id);
  if (idx !== -1) {
    db.costLogs[idx] = { ...db.costLogs[idx], ...updates };
    save(projectId, db);
    return db.costLogs[idx];
  }
  return null;
}

export function deleteCostLog(projectId, id) {
  const db = ensureDb(projectId);
  db.costLogs = db.costLogs.filter(c => c.id !== id);
  save(projectId, db);
}

// ============ SUPPLIER QUOTATIONS ============
export function getSupplierQuotations(projectId) {
  return ensureDb(projectId).supplierQuotations;
}

export function addSupplierQuotation(projectId, sq) {
  const db = ensureDb(projectId);
  const id = nextId('SQ', db.supplierQuotations.length);
  const newSQ = { id, ...sq };
  db.supplierQuotations.push(newSQ);
  save(projectId, db);
  return newSQ;
}

export function updateSupplierQuotation(projectId, id, updates) {
  const db = ensureDb(projectId);
  const idx = db.supplierQuotations.findIndex(s => s.id === id);
  if (idx !== -1) {
    db.supplierQuotations[idx] = { ...db.supplierQuotations[idx], ...updates };
    save(projectId, db);
    return db.supplierQuotations[idx];
  }
  return null;
}

export function deleteSupplierQuotation(projectId, id) {
  const db = ensureDb(projectId);
  db.supplierQuotations = db.supplierQuotations.filter(s => s.id !== id);
  save(projectId, db);
}

// ============ S-CURVE ============
export function getSCurve(projectId) {
  return ensureDb(projectId).sCurve;
}

export function updateSCurvePoint(projectId, week, updates) {
  const db = ensureDb(projectId);
  const idx = db.sCurve.findIndex(s => s.week === week);
  if (idx !== -1) {
    db.sCurve[idx] = { ...db.sCurve[idx], ...updates };
    save(projectId, db);
    return db.sCurve[idx];
  }
  return null;
}

export function setSCurve(projectId, data) {
  const db = ensureDb(projectId);
  db.sCurve = data;
  save(projectId, db);
}

// ============ DOCUMENTS ============
export function getDocuments(projectId) {
  return ensureDb(projectId).documents;
}

export function getDocumentsByPort(projectId, portId) {
  return ensureDb(projectId).documents.filter(d => d.portId === portId);
}

export function addDocument(projectId, doc) {
  const db = ensureDb(projectId);
  const id = nextId('DOC', db.documents.length);
  const newDoc = { id, ...doc, uploadedAt: new Date().toISOString() };
  db.documents.push(newDoc);
  save(projectId, db);
  return newDoc;
}

export function updateDocument(projectId, id, updates) {
  const db = ensureDb(projectId);
  const idx = db.documents.findIndex(d => d.id === id);
  if (idx !== -1) {
    db.documents[idx] = { ...db.documents[idx], ...updates };
    save(projectId, db);
    return db.documents[idx];
  }
  return null;
}

export function deleteDocument(projectId, id) {
  const db = ensureDb(projectId);
  db.documents = db.documents.filter(d => d.id !== id);
  save(projectId, db);
}

// ============ USERS (P0 real authentication) ============
// Users stored globally in SQLite under project_id='__global__', entity='users'.
// Passwords hashed with bcrypt.
const GLOBAL_PROJECT = '__global__';

export function getUsers() {
  return loadEntity(GLOBAL_PROJECT, 'users');
}

function saveUsers(users) {
  saveEntity(GLOBAL_PROJECT, 'users', users);
}

export function getUserByUsername(username) {
  return getUsers().find((u) => u.username === username);
}

export function getUserById(id) {
  return getUsers().find((u) => u.id === id);
}

export function createUser({ username, passwordHash, role, teamId, name }) {
  const users = getUsers();
  const id = nextId('U', users.length);
  const user = {
    id,
    username,
    passwordHash,
    role: role || 'viewer',
    teamId: teamId || null,
    name: name || username,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  return user;
}

export function updateUser(id, updates) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
  return users[idx];
}

export function deleteUser(id) {
  const users = getUsers().filter((u) => u.id !== id);
  saveUsers(users);
}

// ============ PASSWORD HASHING (bcrypt, no plaintext) ============
export function hashPassword(password) {
  return bcrypt.hashSync(String(password), 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compareSync(String(password), hash);
}

// ============ IMPORT DATA (thay thế toàn bộ entity) ============
export function importData(projectId, entityName, data) {
  const db = ensureDb(projectId);
  const validEntities = ['items', 'suppliers', 'supplierPorts', 'risks', 'tasks', 'costLogs', 'supplierQuotations', 'sCurve', 'team', 'documents'];
  if (!validEntities.includes(entityName)) {
    throw new Error('Entity không hợp lệ: ' + entityName);
  }
  db[entityName] = data;
  save(projectId, db);
}

export function bulkImport(projectId, data) {
  const db = ensureDb(projectId);
  // Merge từng entity — thêm mới, không xóa cũ (trừ items/tasks/costLogs thay thế)
  if (data.items) db.items = data.items;
  if (data.ports) db.ports = data.ports;
  if (data.suppliers) db.suppliers = data.suppliers;
  if (data.supplierPorts) db.supplierPorts = data.supplierPorts;
  if (data.risks) db.risks = data.risks;
  if (data.tasks) db.tasks = data.tasks;
  if (data.costLogs) db.costLogs = data.costLogs;
  if (data.supplierQuotations) db.supplierQuotations = data.supplierQuotations;
  if (data.sCurve) db.sCurve = data.sCurve;
  if (data.team) db.team = data.team;
  if (data.documents) db.documents = data.documents;
  if (data.meta) db.meta = { ...db.meta, ...data.meta };
  if (data.settings) db.settings = data.settings;
  save(projectId, db);
  return {
    items: db.items.length,
    ports: db.ports.length,
    suppliers: db.suppliers.length,
    tasks: db.tasks.length,
    costLogs: db.costLogs.length,
    risks: db.risks.length,
    team: db.team.length,
  };
}

// ============ EXPORT ALL DATA ============
export function exportAllData(projectId) {
  return ensureDb(projectId);
}

// ============ DASHBOARD ============
export function getDashboardData(projectId) {
  const db = ensureDb(projectId);
  const items = db.items;
  const totalRevenue = sumRevenue(items);
  const totalCost = sumPlannedCost(items);
  const totalProfit = profit(totalRevenue, totalCost);
  const avgProgress = computeAvgProgress(items, 'simple');
  const totalLoggedCost = sumActualCost(db.costLogs);
  const totalVAT = sumVAT(items, 10);
  const revenueInclVAT = computeRevenueInclVAT(totalRevenue, totalVAT);
  const taskByStatus = {
    todo: db.tasks.filter(t => t.status === 'todo').length,
    inprogress: db.tasks.filter(t => t.status === 'inprogress').length,
    review: db.tasks.filter(t => t.status === 'review').length,
    done: db.tasks.filter(t => t.status === 'done').length,
  };
  const today = new Date();
  const overdueTasks = db.tasks.filter(t => t.status !== 'done' && t.endDate && new Date(t.endDate) < today).length;
  const openRisks = db.risks.filter(r => r.status === 'open');
  const highRisks = openRisks.filter(r => r.score >= 12).sort((a, b) => b.score - a.score).slice(0, 5)
    .map(r => ({ ...r, portName: db.ports.find(p => p.id === r.portId)?.name || '' }));

  return {
    totalRevenue, totalCost, totalProfit, totalVAT, revenueInclVAT,
    totalProfitMargin: profitMargin(totalProfit, totalRevenue).toFixed(1),
    avgProgress, totalItems: items.length,
    itemsDone: items.filter(i => i.status === 'Completed').length,
    itemsInFab: items.filter(i => i.status === 'Fabrication').length,
    totalLoggedCost,
    ports: db.ports.map(p => {
      const portItems = items.filter(i => i.port === p.id);
      const portRevenue = sumRevenue(portItems);
      const portCost = sumPlannedCost(portItems);
      const portProgress = computeAvgProgress(portItems, 'simple');
      const portLogged = sumActualCost(db.costLogs.filter(c => c.portId === p.id));
      return { id: p.id, name: p.name, description: p.description, status: p.status, progress: portProgress, revenue: portRevenue, cost: portCost, logged: portLogged, itemCount: portItems.length, color: p.color };
    }),
    taskByStatus,
    pendingTasks: db.tasks.length - taskByStatus.done,
    overdueTasks,
    openRisks: openRisks.length,
    highRisks,
    supplierCount: db.suppliers.length,
  };
}

// Dashboard tổng hợp nhiều dự án (portfolio view).
//
// KPI tiền tệ (revenue/cost/profit): cộng dồn tuyệt đối từ mọi dự án.
//
// Tiến độ TB weighted theo giá trị hợp đồng (aggregate only):
//   Σ (item.progress × itemRevenue) / Σ (itemRevenue)
//   where itemRevenue = qty × unitPrice.
//   Công thức này khác với single-project (getDashboardData) —
//   single-project dùng simple average Σprogress/itemCount vì mọi item
//   trong 1 dự án có trọng số tương đương khi nhìn tổng thể dự án đó.
//   Khi gộp nhiều dự án, hợp đồng lớn (như Block B 1.78 tỷ) phải nặng
//   hơn hợp đồng nhỏ (Aesop 0), nên dùng weighted theo doanh thu.
export function getAggregateDashboard(projectIds) {
  const all = getProjects();
  const ids = (Array.isArray(projectIds) && projectIds.length)
    ? projectIds.filter((id) => all.some((p) => p.id === id))
    : all.map((p) => p.id);
  const nameOf = (id) => all.find((p) => p.id === id)?.name || id;

  const perProject = ids.map((id) => ({ id, name: nameOf(id), ...getDashboardData(id) }));
  const sum = (key) => perProject.reduce((s, p) => s + (Number(p[key]) || 0), 0);

  const highRisks = [];
  const recentCosts = [];
  const tasks = [];
  const allItems = [];
  const allCostLogs = [];
  ids.forEach((id) => {
    const pdb = ensureDb(id);
    (pdb.items || []).forEach((it) => allItems.push({ ...it, projectId: id, projectName: nameOf(id) }));
    (pdb.costLogs || []).forEach((c) => {
      const enriched = { ...c, id: `${id}__${c.id}`, projectId: id, projectName: nameOf(id) };
      recentCosts.push(enriched);
      allCostLogs.push(enriched);
    });
    (pdb.tasks || []).forEach((t) => tasks.push({ ...t, projectId: id, projectName: nameOf(id) }));
  });
  perProject.forEach((p) => (p.highRisks || []).forEach((r) => highRisks.push({ ...r, projectId: p.id, projectName: p.name })));
  highRisks.sort((a, b) => b.score - a.score);
  recentCosts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const avgProgress = computeAvgProgress(allItems, 'simple');
  const totalRevenue = sum('totalRevenue');
  const totalCost = sum('totalCost');
  const totalProfit = profit(totalRevenue, totalCost);
  const totalVAT = sumVAT(allItems, 10);
  const taskByStatus = { todo: 0, inprogress: 0, review: 0, done: 0 };
  perProject.forEach((p) => Object.keys(taskByStatus).forEach((k) => { taskByStatus[k] += (p.taskByStatus?.[k] || 0); }));

  return {
    projects: ids.map((id) => ({ id, name: nameOf(id) })),
    items: allItems,
    costLogs: allCostLogs,
    aggregate: {
      totalRevenue,
      totalCost,
      totalProfit,
      totalVAT,
      revenueInclVAT: computeRevenueInclVAT(totalRevenue, totalVAT),
      totalProfitMargin: profitMargin(totalProfit, totalRevenue).toFixed(1),
      totalLoggedCost: sum('totalLoggedCost'),
      avgProgress,
      progressFormula: 'simple',
      totalItems: sum('totalItems'),
      itemsInFab: sum('itemsInFab'),
      openRisks: sum('openRisks'),
      pendingTasks: sum('pendingTasks'),
      overdueTasks: sum('overdueTasks'),
      taskByStatus,
      highRisks: highRisks.slice(0, 8),
      recentCosts: recentCosts.slice(0, 8),
      tasks,
    },
    perProject: perProject.map((p) => ({
      id: p.id,
      name: p.name,
      totalRevenue: p.totalRevenue,
      totalCost: p.totalCost,
      totalLoggedCost: p.totalLoggedCost,
      totalProfit: p.totalProfit,
      totalProfitMargin: p.totalProfitMargin,
      avgProgress: p.avgProgress,
      totalItems: p.totalItems,
      itemsInFab: p.itemsInFab,
      openRisks: p.openRisks,
      pendingTasks: p.pendingTasks,
      overdueTasks: p.overdueTasks,
    })),
  };
}

// ============ AUDIT LOG ============
// Ghi nhật ký mọi thay đổi dữ liệu (ai, làm gì, khi nào, trên bản ghi nào).
// Lưu trong SQLite dưới project_id + entity='audit'.
export function logAudit(projectId, action, entity, recordId, details = {}) {
  const logs = loadEntity(projectId, 'audit');
  logs.push({
    id: 'AUD-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    ts: new Date().toISOString(),
    action,
    entity,
    recordId,
    details,
  });
  saveEntity(projectId, 'audit', logs);
}

export function getAuditLogs(projectId, limit = 200) {
  const logs = loadEntity(projectId, 'audit');
  return logs.sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, limit);
}

// ============ AUTO-MIGRATE KHI IMPORT ============
migrateOldData();
