import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECTS_DIR = path.join(__dirname, 'projects');
const INDEX_PATH = path.join(PROJECTS_DIR, '_index.json');
const SEED_PATH = path.join(__dirname, 'seed-data.json');
const OLD_DB_PATH = path.join(__dirname, 'data.json');

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
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2), 'utf-8');
}

// ============ PROJECT CRUD ============
export function createProject(name, description) {
  const idx = getIndex();
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
  const projectDir = path.join(PROJECTS_DIR, id);
  fs.mkdirSync(projectDir, { recursive: true });

  // Copy seed data làm template
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'));
  seed.meta.projectName = name;
  seed.meta.createdAt = new Date().toISOString();

  // Reset data trống nhưng giữ cấu trúc
  seed.ports = seed.ports.map(p => ({ ...p, progress: 0, contractValue: 0, paymentReceived: 0, budget: 0, actual: 0, status: 'Engineering', plannedProgress: 0 }));
  seed.items = [];
  seed.suppliers = [];
  seed.supplierPorts = [];
  seed.risks = [];
  seed.tasks = [];
  seed.costLogs = [];
  seed.supplierQuotations = [];
  seed.sCurve = [];
  seed.team = [];
  seed.documents = [];

  fs.writeFileSync(path.join(projectDir, 'data.json'), JSON.stringify(seed, null, 2), 'utf-8');

  const project = { id, name, description: description || '', createdAt: new Date().toISOString() };
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
  // Xóa thư mục dự án
  const projectDir = path.join(PROJECTS_DIR, id);
  if (fs.existsSync(projectDir)) {
    fs.rmSync(projectDir, { recursive: true });
  }
  // Xóa khỏi index
  const idx = getIndex().filter(p => p.id !== id);
  saveIndex(idx);
}

// ============ HELPER: Đường dẫn DB theo projectId ============
function getDbPath(projectId) {
  return path.join(PROJECTS_DIR, projectId, 'data.json');
}

// ============ HELPER: Load/Save DB theo projectId ============
function ensureDb(projectId) {
  const dbPath = getDbPath(projectId);
  if (!fs.existsSync(dbPath)) {
    // Copy seed nếu chưa có
    const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'));
    fs.writeFileSync(dbPath, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

function save(projectId, data) {
  const dbPath = getDbPath(projectId);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
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
  const totalRevenue = items.reduce((sum, i) => sum + (i.qty * i.unitPrice), 0);
  const totalCost = items.reduce((sum, i) => sum + (i.qty * i.unitCost), 0);
  const totalProfit = totalRevenue - totalCost;
  const avgProgress = items.length > 0
    ? Math.round(items.reduce((sum, i) => sum + (i.progress || 0), 0) / items.length)
    : 0;
  const totalLoggedCost = db.costLogs.reduce((sum, c) => sum + (c.amount || 0), 0);
  // Tổng chi phí thực tế = totalLoggedCost (tính từ costLogs, không phải từ item.unitCost)
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
    totalRevenue, totalCost, totalProfit,
    totalProfitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0,
    avgProgress, totalItems: items.length,
    itemsDone: items.filter(i => i.status === 'Completed').length,
    itemsInFab: items.filter(i => i.status === 'Fabrication').length,
    totalLoggedCost,
    ports: db.ports.map(p => {
      const portItems = items.filter(i => i.port === p.id);
      const portRevenue = portItems.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
      const portCost = portItems.reduce((s, i) => s + (i.qty * i.unitCost), 0);
      const portProgress = portItems.length > 0 ? Math.round(portItems.reduce((s, i) => s + (i.progress || 0), 0) / portItems.length) : 0;
      const portLogged = db.costLogs.filter(c => c.portId === p.id).reduce((s, c) => s + (c.amount || 0), 0);
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

// ============ AUTO-MIGRATE KHI IMPORT ============
migrateOldData();
