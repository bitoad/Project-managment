import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import crypto from 'crypto';
import XLSX from 'xlsx';
import * as db from './database/db.js';
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from './database/rbac.js';
import { validateBody, ValidationError } from './validate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Write-metrics logging (ADR-011 follow-up): ghi nhật ký nhẹ mọi request ghi
// (POST/PUT/DELETE) để lần review migrate SQLite sau có tần suất ghi THẬT thay
// vì ước tính. File .log đã được .gitignore; append bất đồng bộ, không chặn request.
const WRITE_METRICS_LOG = path.join(__dirname, 'write-metrics.log');
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    res.on('finish', () => {
      const pid = req.query.projectId || req.headers['x-project-id'] || '-';
      const line = `${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} pid=${pid}\n`;
      fs.appendFile(WRITE_METRICS_LOG, line, () => {});
    });
  }
  next();
});

// Phục vụ file upload tĩnh
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Cấu hình multer cho upload file — chỉ chấp nhận extension trong allowlist (P2).
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname.replace(/\s+/g, '_'));
  },
});

const DOC_ALLOWED_EXT = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv',
  'png', 'jpg', 'jpeg', 'gif', 'zip', 'rar', '7z', 'dwg',
]);
const EXCEL_ALLOWED_EXT = new Set(['xls', 'xlsx']);

function makeFileFilter(allowedExt) {
  return (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '').toLowerCase().replace(/^\./, '');
    if (!allowedExt.has(ext)) {
      return cb(new Error(`Loại file .${ext || '?'} không được phép. Chỉ chấp nhận: ${[...allowedExt].join(', ')}`));
    }
    cb(null, true);
  };
}

const uploadDoc = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 }, fileFilter: makeFileFilter(DOC_ALLOWED_EXT) });
const uploadExcel = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 }, fileFilter: makeFileFilter(EXCEL_ALLOWED_EXT) });

// ============ MIDDLEWARE: Lấy projectId từ query hoặc header ============
function getProjectId(req) {
  const pid = req.query.projectId || req.headers['x-project-id'] || req.body?.projectId;
  if (!pid) {
    // Mặc định về dự án đầu tiên (backward compatible)
    const projects = db.getProjects();
    return projects[0]?.id || 'block-b-gas';
  }
  return pid;
}

// Middleware kiểm tra projectId hợp lệ
function requireProject(req, res, next) {
  const pid = getProjectId(req);
  const project = db.getProjectById(pid);
  if (!project) {
    return res.status(404).json({ error: `Dự án không tồn tại: ${pid}` });
  }
  req.projectId = pid;
  next();
}

// ============ AUTH (hotfix ADR-012) ============
// In-memory session store. Minimum viable gate: a valid session token is
// required for ALL state-changing requests (POST/PUT/DELETE). RBAC is deferred
// (see roadmap Future). Token is issued by /api/auth/login (no password yet —
// this connects the existing frontend login to a real backend session).
const sessions = new Map(); // token -> { username, createdAt }

app.post('/api/auth/login', (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  if (!username || !password) {
    return res.status(400).json({ error: 'Username và password bắt buộc' });
  }
  const user = db.getUserByUsername(username);
  if (!user || !db.verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, { username: user.username, role: user.role, userId: user.id });
  res.json({
    token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
  });
});

app.post('/api/auth/logout', (req, res) => {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : (req.headers['x-auth-token'] || '');
  if (token) sessions.delete(token);
  res.json({ success: true });
});

function requireAuth(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : (req.headers['x-auth-token'] || '');
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = sessions.get(token);
  next();
}

// Role & permission matrix (modeled only — NOT enforced on routes yet; see ADR-014).
app.get('/api/rbac', requireAuth, (req, res) => {
  res.json({ roles: ROLES, permissions: PERMISSIONS, matrix: ROLE_PERMISSIONS });
});

// Gate every state-changing request except the auth routes themselves.
app.use((req, res, next) => {
  const mutating = ['POST', 'PUT', 'DELETE'].includes(req.method);
  const isAuthRoute = req.path === '/api/auth/login' || req.path === '/api/auth/logout';
  if (mutating && !isAuthRoute) return requireAuth(req, res, next);
  next();
});

// ============ PROJECTS (Quản lý dự án) ============
app.get('/api/projects', (req, res) => {
  res.json(db.getProjects());
});

app.post('/api/projects', validateBody({ name: 'string' }), (req, res) => {
  const { name, description } = req.body;
  const project = db.createProject(name, description);
  res.status(201).json(project);
});

app.put('/api/projects/:id', validateBody({ name: { type: 'string', required: false } }), (req, res) => {
  const project = db.updateProject(req.params.id, req.body);
  if (!project) return res.status(404).json({ error: 'Dự án không tồn tại' });
  res.json(project);
});

app.delete('/api/projects/:id', (req, res) => {
  db.deleteProject(req.params.id);
  res.json({ success: true });
});

// ============ DASHBOARD ============
app.get('/api/dashboard', requireProject, (req, res) => {
  res.json(db.getDashboardData(req.projectId));
});

// Dashboard tổng hợp nhiều dự án (portfolio). GET mở như /api/dashboard —
// ADR-012 chỉ gate POST/PUT/DELETE. projectIds rỗng = tổng hợp TẤT CẢ dự án.
app.get('/api/dashboard/aggregate', (req, res) => {
  const raw = String(req.query.projectIds || '').trim();
  const ids = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const known = db.getProjects().map((p) => p.id);
  const invalid = ids.filter((id) => !known.includes(id));
  if (invalid.length) {
    return res.status(404).json({ error: `Dự án không tồn tại: ${invalid.join(', ')}` });
  }
  res.json(db.getAggregateDashboard(ids));
});

// ============ META & SETTINGS ============
app.get('/api/meta', requireProject, (req, res) => res.json(db.getMeta(req.projectId)));
app.put('/api/meta', requireProject, validateBody({}), (req, res) => res.json(db.updateMeta(req.projectId, req.body)));
app.get('/api/settings', requireProject, (req, res) => res.json(db.getSettings(req.projectId)));

// ============ PORTS ============
app.get('/api/ports', requireProject, (req, res) => res.json(db.getPorts(req.projectId)));
app.post('/api/ports', requireProject,
  validateBody({
    id: 'string', name: 'string',
    progress: { type: 'percent', required: false },
    contractValue: { type: 'nonNegNum', required: false },
    budget: { type: 'nonNegNum', required: false },
    actual: { type: 'nonNegNum', required: false },
  }),
  (req, res) => res.status(201).json(db.addPort(req.projectId, req.body)));
app.get('/api/ports/:id', requireProject, (req, res) => {
  const port = db.getPortById(req.projectId, req.params.id);
  if (!port) return res.status(404).json({ error: 'Port not found' });
  res.json(port);
});
app.put('/api/ports/:id', requireProject,
  validateBody({
    progress: { type: 'percent', required: false },
    contractValue: { type: 'nonNegNum', required: false },
    budget: { type: 'nonNegNum', required: false },
    actual: { type: 'nonNegNum', required: false },
  }),
  (req, res) => {
    const port = db.updatePort(req.projectId, req.params.id, req.body);
    if (!port) return res.status(404).json({ error: 'Port not found' });
    res.json(port);
  });
app.delete('/api/ports/:id', requireProject, (req, res) => {
  try {
    const deleted = db.deletePort(req.projectId, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Port not found' });
    res.json({ success: true });
  } catch (e) {
    if (e.code === 'PORT_HAS_LINKED_DATA') {
      return res.status(409).json({ error: 'Port đang có dữ liệu liên quan, không thể xóa', details: e.details });
    }
    throw e;
  }
});

// ============ ITEMS ============
app.get('/api/items', requireProject, (req, res) => res.json(db.getItems(req.projectId)));
app.get('/api/items/:code', requireProject, (req, res) => {
  const item = db.getItemByCode(req.projectId, req.params.code);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});
app.post('/api/items', requireProject,
  validateBody({
    code: 'string', name: 'string',
    qty: { type: 'nonNegNum', required: false },
    progress: { type: 'percent', required: false },
  }),
  (req, res) => res.status(201).json(db.addItem(req.projectId, req.body)));
app.put('/api/items/:code', requireProject,
  validateBody({
    name: { type: 'string', required: false },
    qty: { type: 'nonNegNum', required: false },
    progress: { type: 'percent', required: false },
  }),
  (req, res) => res.json(db.updateItem(req.projectId, req.params.code, req.body)));
app.delete('/api/items/:code', requireProject, (req, res) => {
  db.deleteItem(req.projectId, req.params.code);
  res.json({ success: true });
});

// ============ SUPPLIERS ============
app.get('/api/suppliers', requireProject, (req, res) => res.json(db.getSuppliers(req.projectId)));
app.post('/api/suppliers', requireProject, validateBody({ name: 'string' }), (req, res) => res.status(201).json(db.addSupplier(req.projectId, req.body)));
app.put('/api/suppliers/:id', requireProject, validateBody({ name: { type: 'string', required: false } }), (req, res) => res.json(db.updateSupplier(req.projectId, req.params.id, req.body)));
app.delete('/api/suppliers/:id', requireProject, (req, res) => {
  db.deleteSupplier(req.projectId, req.params.id);
  res.json({ success: true });
});

// ============ SUPPLIER PORTS ============
app.get('/api/supplier-ports', requireProject, (req, res) => {
  if (req.query.portId) return res.json(db.getSupplierPortsByPort(req.projectId, req.query.portId));
  res.json(db.getSupplierPorts(req.projectId));
});
app.post('/api/supplier-ports', requireProject,
  validateBody({ portId: { type: 'string', required: false }, supplierId: { type: 'string', required: false } }),
  (req, res) => res.status(201).json(db.addSupplierPort(req.projectId, req.body)));
app.put('/api/supplier-ports/:id', requireProject,
  validateBody({ portId: { type: 'string', required: false }, supplierId: { type: 'string', required: false } }),
  (req, res) => res.json(db.updateSupplierPort(req.projectId, req.params.id, req.body)));
app.delete('/api/supplier-ports/:id', requireProject, (req, res) => {
  db.deleteSupplierPort(req.projectId, req.params.id);
  res.json({ success: true });
});

// ============ RISKS ============
app.get('/api/risks', requireProject, (req, res) => res.json(db.getRisks(req.projectId)));
app.post('/api/risks', requireProject,
  validateBody({
    title: 'string',
    portId: { type: 'string', required: false },
    probability: { type: 'int1to5', required: false },
    impact: { type: 'int1to5', required: false },
  }),
  (req, res) => res.status(201).json(db.addRisk(req.projectId, req.body)));
app.put('/api/risks/:id', requireProject,
  validateBody({
    title: { type: 'string', required: false },
    probability: { type: 'int1to5', required: false },
    impact: { type: 'int1to5', required: false },
  }),
  (req, res) => res.json(db.updateRisk(req.projectId, req.params.id, req.body)));
app.delete('/api/risks/:id', requireProject, (req, res) => {
  db.deleteRisk(req.projectId, req.params.id);
  res.json({ success: true });
});

// ============ TASKS ============
app.get('/api/tasks', requireProject, (req, res) => res.json(db.getTasks(req.projectId)));
app.post('/api/tasks', requireProject,
  validateBody({ title: 'string', portId: { type: 'string', required: false } }),
  (req, res) => res.status(201).json(db.addTask(req.projectId, req.body)));
app.put('/api/tasks/:id', requireProject,
  validateBody({ title: { type: 'string', required: false } }),
  (req, res) => res.json(db.updateTask(req.projectId, req.params.id, req.body)));
app.delete('/api/tasks/:id', requireProject, (req, res) => {
  db.deleteTask(req.projectId, req.params.id);
  res.json({ success: true });
});

// ============ TEAM ============
app.get('/api/team', requireProject, (req, res) => res.json(db.getTeam(req.projectId)));
app.post('/api/team', requireProject, validateBody({ name: 'string' }), (req, res) => res.status(201).json(db.addMember(req.projectId, req.body)));
app.put('/api/team/:id', requireProject, validateBody({ name: { type: 'string', required: false } }), (req, res) => res.json(db.updateMember(req.projectId, req.params.id, req.body)));
app.delete('/api/team/:id', requireProject, (req, res) => {
  db.deleteMember(req.projectId, req.params.id);
  res.json({ success: true });
});

// ============ COST LOGS ============
app.get('/api/cost-logs', requireProject, (req, res) => res.json(db.getCostLogs(req.projectId)));
app.post('/api/cost-logs', requireProject,
  validateBody({ amount: 'nonNegNum', portId: { type: 'string', required: false } }),
  (req, res) => res.status(201).json(db.addCostLog(req.projectId, req.body)));
app.put('/api/cost-logs/:id', requireProject,
  validateBody({ amount: { type: 'nonNegNum', required: false } }),
  (req, res) => res.json(db.updateCostLog(req.projectId, req.params.id, req.body)));
app.delete('/api/cost-logs/:id', requireProject, (req, res) => {
  db.deleteCostLog(req.projectId, req.params.id);
  res.json({ success: true });
});

// ============ QUOTATIONS ============
app.get('/api/quotations', requireProject, (req, res) => res.json(db.getSupplierQuotations(req.projectId)));
app.post('/api/quotations', requireProject, validateBody({ itemCode: 'string' }), (req, res) => res.status(201).json(db.addSupplierQuotation(req.projectId, req.body)));
app.put('/api/quotations/:id', requireProject, validateBody({ itemCode: { type: 'string', required: false } }), (req, res) => res.json(db.updateSupplierQuotation(req.projectId, req.params.id, req.body)));
app.delete('/api/quotations/:id', requireProject, (req, res) => {
  db.deleteSupplierQuotation(req.projectId, req.params.id);
  res.json({ success: true });
});

// ============ S-CURVE ============
app.get('/api/s-curve', requireProject, (req, res) => res.json(db.getSCurve(req.projectId)));
app.put('/api/s-curve/:week', requireProject,
  validateBody({ planned: { type: 'nonNegNum', required: false }, actual: { type: 'nonNegNum', required: false } }),
  (req, res) => res.json(db.updateSCurvePoint(req.projectId, req.params.week, req.body)));

// ============ DOCUMENTS ============
app.get('/api/documents', requireProject, (req, res) => {
  if (req.query.portId) return res.json(db.getDocumentsByPort(req.projectId, req.query.portId));
  res.json(db.getDocuments(req.projectId));
});
app.post('/api/documents', requireProject, uploadDoc.single('file'),
  validateBody({ name: 'string', portId: { type: 'string', required: false } }),
  (req, res) => {
    const doc = { ...req.body };
    if (req.file) {
      doc.filePath = '/uploads/' + req.file.filename;
      doc.fileOriginalName = req.file.originalname;
      doc.fileSize = req.file.size;
    }
    res.status(201).json(db.addDocument(req.projectId, doc));
  });
app.put('/api/documents/:id', requireProject, (req, res) => res.json(db.updateDocument(req.projectId, req.params.id, req.body)));
app.delete('/api/documents/:id', requireProject, (req, res) => {
  db.deleteDocument(req.projectId, req.params.id);
  res.json({ success: true });
});

// ============ IMPORT EXCEL ============
// Chuyển Excel serial date sang ISO
function excelDateToISO(serial) {
  if (!serial || isNaN(serial)) return null;
  if (typeof serial === 'string') return serial;
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  return date.toISOString().slice(0, 10);
}

app.post('/api/projects/:id/import-excel', requireProject, uploadExcel.single('file'), (req, res) => {
  try {
    const projectId = req.params.id;
    if (!req.file) return res.status(400).json({ error: 'Vui lòng upload file Excel' });

    const workbook = XLSX.readFile(req.file.path, { cellDates: false });
    const summary = { sheets: [], items: 0, tasks: 0, costLogs: 0, quotations: 0, team: 0, sCurve: 0, suppliers: 0, ports: 0 };

    workbook.SheetNames.forEach((sheetName) => {
      const ws = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      summary.sheets.push(sheetName);

      // ===== ITEM_MASTER → items =====
      if (sheetName.toUpperCase().includes('ITEM_MASTER') || sheetName === 'ITEM_MASTER') {
        const items = [];
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r[0] || r[0] === 'TOTAL' || r[0] === 'TOTAL ') continue;
          if (String(r[0]).trim() === '') continue;
          items.push({
            code: String(r[0] || '').trim(),
            name: String(r[1] || '').trim(),
            port: String(r[2] || '').trim(),
            qty: Number(r[3]) || 0,
            unitCost: Number(r[4]) || 0,
            unitPrice: Number(r[7]) || 0,
            status: String(r[10] || 'Engineering').trim(),
            progress: Number(r[11]) * 100 || Number(r[11]) || 0,
            startDate: excelDateToISO(r[12]),
            endDate: excelDateToISO(r[13]),
            unit: 'pcs',
            drawingCode: '',
          });
        }
        if (items.length > 0) {
          db.importData(projectId, 'items', items);
          summary.items = items.length;
        }
      }

      // ===== COST_LOG → costLogs =====
      if (sheetName.toUpperCase().includes('COST_LOG')) {
        const logs = [];
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r[0] || String(r[0]).toUpperCase().includes('TOTAL')) continue;
          logs.push({
            id: 'CL-' + String(i).padStart(3, '0'),
            date: excelDateToISO(r[0]),
            portId: String(r[1] || '').trim(),
            itemCode: String(r[2] || '').trim(),
            costType: String(r[3] || 'Material').trim(),
            description: String(r[4] || '').trim(),
            amount: Number(r[5]) || 0,
            remarks: String(r[6] || '').trim(),
          });
        }
        if (logs.length > 0) {
          db.importData(projectId, 'costLogs', logs);
          summary.costLogs = logs.length;
        }
      }

      // ===== TASK_LIST → tasks =====
      if (sheetName.toUpperCase().includes('TASK_LIST')) {
        const tasks = [];
        const statusMap = { 'Engineering': 'inprogress', 'Procurement': 'inprogress', 'Fabrication': 'inprogress', 'Installation': 'inprogress', 'Delivery': 'review', 'Completed': 'done' };
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r[0] || String(r[0]).trim() === '') continue;
          const rawStatus = String(r[7] || 'Engineering').trim();
          tasks.push({
            id: String(r[0] || 'T' + i).trim(),
            title: String(r[1] || '').trim(),
            portId: String(r[2] || '').trim(),
            itemCode: String(r[3] || '').trim(),
            owner: String(r[9] || '').trim(),
            status: statusMap[rawStatus] || 'todo',
            progress: Math.round((Number(r[8]) || 0) * 100),
            priority: 'medium',
            startDate: excelDateToISO(r[4]),
            endDate: excelDateToISO(r[5]),
            note: String(r[10] || '').trim(),
          });
        }
        if (tasks.length > 0) {
          db.importData(projectId, 'tasks', tasks);
          summary.tasks = tasks.length;
        }
      }

      // ===== SUPPLIER_QUOTATION → supplierQuotations =====
      if (sheetName.toUpperCase().includes('SUPPLIER_QUOTATION') || sheetName.toUpperCase().includes('QUOTATION')) {
        const quotes = [];
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r[0] || String(r[0]).trim() === '') continue;
          quotes.push({
            id: 'SQ-' + String(i).padStart(3, '0'),
            no: Number(r[0]) || i,
            itemCode: String(r[1] || '').trim(),
            itemName: String(r[2] || '').trim(),
            unit: String(r[3] || '').trim(),
            qty: Number(r[4]) || 0,
            supplierA: Number(r[5]) || 0,
            supplierB: Number(r[7]) || 0,
            supplierC: Number(r[9]) || 0,
            selected: String(r[11] || 'Supplier A').trim(),
          });
        }
        if (quotes.length > 0) {
          db.importData(projectId, 'supplierQuotations', quotes);
          summary.quotations = quotes.length;
        }
      }

      // ===== S_CURVE → sCurve =====
      if (sheetName.toUpperCase().includes('S_CURVE') || sheetName === 'S_CURVE') {
        const curve = [];
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r[0] || String(r[0]).trim() === '') continue;
          curve.push({
            week: String(r[0] || '').trim(),
            date: excelDateToISO(r[1]),
            planned: (Number(r[2]) || 0) * 100,
            actual: (Number(r[3]) || 0) * 100,
          });
        }
        if (curve.length > 0) {
          db.importData(projectId, 'sCurve', curve);
          summary.sCurve = curve.length;
        }
      }

      // ===== REGISTRATION LIST → team =====
      if (sheetName.toUpperCase().includes('REGISTRATION')) {
        const team = [];
        let started = false;
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          // Tìm dòng header có "No." và "Full Name"
          if (!started) {
            if (String(r[0]).trim() === 'No.' || String(r[1]).includes('Full Name')) {
              started = true;
            }
            continue;
          }
          if (!r[0] && !r[1]) continue;
          team.push({
            id: 'TM-' + String(i).padStart(3, '0'),
            name: String(r[1] || '').trim(),
            position: String(r[2] || '').trim(),
            idNumber: String(r[3] || '').trim(),
            phone: String(r[4] || '').trim(),
            role: 'Technician',
            ports: ['All'],
            email: '',
          });
        }
        if (team.length > 0) {
          db.importData(projectId, 'team', team);
          summary.team = team.length;
        }
      }

      // ===== SETTING → settings =====
      if (sheetName.toUpperCase() === 'SETTING') {
        const statusProgress = {};
        for (let i = 2; i < rows.length; i++) {
          const r = rows[i];
          if (r[0] && r[1] !== '' && typeof r[1] === 'number') {
            statusProgress[String(r[0]).trim()] = r[1];
          }
        }
        if (Object.keys(statusProgress).length > 0) {
          const settings = db.getSettings(projectId);
          settings.statusProgress = statusProgress;
          db.bulkImport(projectId, { settings });
        }
      }

      // ===== PORT_SUMMARY → ports (cập nhật description) =====
      if (sheetName.toUpperCase().includes('PORT_SUMMARY')) {
        const ports = db.getPorts(projectId);
        for (let i = 2; i < rows.length; i++) {
          const r = rows[i];
          if (!r[0] || String(r[0]).toUpperCase() === 'TOTAL') continue;
          const portId = String(r[0]).trim();
          const existing = ports.find(p => p.id === portId);
          if (existing && r[1]) existing.description = String(r[1]).trim();
        }
        db.bulkImport(projectId, { ports });
        summary.ports = ports.length;
      }
    });

    // Xóa file tạm
    try { fs.unlinkSync(req.file.path); } catch (e) {}

    res.json({ success: true, summary });
  } catch (e) {
    // Xóa file tạm nếu lỗi xảy ra trước khi kịp xóa
    if (req.file && req.file.path) { try { fs.unlinkSync(req.file.path); } catch (_) {} }
    console.error('[Import Excel Error]', e);
    res.status(500).json({ error: 'Lỗi import Excel: ' + e.message });
  }
});

// ============ EXPORT EXCEL ============
app.get('/api/projects/:id/export-excel', requireProject, requireAuth, async (req, res) => {
  try {
    const projectId = req.params.id;
    const data = db.exportAllData(projectId);
    const project = db.getProjectById(projectId);

    const wb = XLSX.utils.book_new();

    // Sheet: ITEM_MASTER
    const itemsData = [
      ['ITEM_CODE', 'ITEM_NAME', 'PORT', 'QTY', 'UNIT_COST', 'TOTAL_COST', 'UNIT_PRICE', 'TOTAL_REVENUE', 'PROFIT', 'STATUS', 'PROGRESS', 'START_DATE', 'END_DATE'],
      ...data.items.map(i => [
        i.code, i.name, i.port, i.qty, i.unitCost,
        i.qty * i.unitCost, i.unitPrice, i.qty * i.unitPrice,
        i.qty * (i.unitPrice - i.unitCost), i.status, (i.progress || 0) / 100,
        i.startDate, i.endDate,
      ]),
      ['TOTAL', '', '', '', '', data.items.reduce((s, i) => s + i.qty * i.unitCost, 0), '', data.items.reduce((s, i) => s + i.qty * i.unitPrice, 0), '', '', '', '', ''],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(itemsData), 'ITEM_MASTER');

    // Sheet: COST_LOG
    const costData = [
      ['DATE', 'PORT', 'ITEM_CODE', 'COST_TYPE', 'DESCRIPTION', 'AMOUNT', 'REMARKS'],
      ...data.costLogs.map(c => [c.date, c.portId, c.itemCode, c.costType, c.description, c.amount, c.remarks]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(costData), 'COST_LOG');

    // Sheet: TASK_LIST
    const taskData = [
      ['TASK_ID', 'TASK_NAME', 'PORT', 'ITEM_CODE', 'START_DATE', 'END_DATE', 'STATUS', 'PROGRESS', 'OWNER', 'REMARK'],
      ...data.tasks.map(t => [t.id, t.title, t.portId, t.itemCode, t.startDate, t.endDate, t.status, (t.progress || 0) / 100, t.owner, t.note]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(taskData), 'TASK_LIST');

    // Sheet: SUPPLIER_QUOTATION
    const quoteData = [
      ['No.', 'ITEM_CODE', 'ITEM_NAME', 'Unit', 'Qty', 'Supplier A', '', 'Supplier B', '', 'Supplier C', '', 'Selected'],
      ...data.supplierQuotations.map(q => [q.no, q.itemCode, q.itemName, q.unit, q.qty, q.supplierA, q.supplierA * q.qty, q.supplierB, q.supplierB * q.qty, q.supplierC, q.supplierC * q.qty, q.selected]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(quoteData), 'SUPPLIER_QUOTATION');

    // Sheet: S_CURVE
    const curveData = [
      ['Week', 'Date', 'Planned (%)', 'Actual (%)'],
      ...data.sCurve.map(s => [s.week, s.date, (s.planned || 0) / 100, (s.actual || 0) / 100]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(curveData), 'S_CURVE');

    // Sheet: REGISTRATION LIST
    const teamData = [
      ['No.', 'Full Name', 'Position', 'CCCD / Passport No.', 'Phone Number', 'Remarks'],
      ...data.team.map((m, i) => [i + 1, m.name, m.position, m.idNumber, m.phone, '']),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(teamData), 'REGISTRATION LIST');

    // Sheet: PORT_SUMMARY
    const portData = [
      ['PORT', 'Description', 'Status', 'Progress %'],
      ...data.ports.map(p => [p.id, p.description, p.status, (p.progress || 0) / 100]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(portData), 'PORT_SUMMARY');

    // Ghi ra buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = encodeURIComponent((project?.name || 'project') + '_' + new Date().toISOString().slice(0, 10) + '.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (e) {
    console.error('[Export Excel Error]', e);
    res.status(500).json({ error: 'Lỗi export Excel: ' + e.message });
  }
});

// ============ Reset project data (về seed rỗng) ============
app.post('/api/projects/:id/reset', requireProject, (req, res) => {
  try {
    const projectId = req.params.id;
    const data = db.exportAllData(projectId);
    data.items = [];
    data.suppliers = [];
    data.supplierPorts = [];
    data.risks = [];
    data.tasks = [];
    data.costLogs = [];
    data.supplierQuotations = [];
    data.sCurve = [];
    data.team = [];
    data.documents = [];
    db.bulkImport(projectId, data);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============ RESEARCH (Document Researcher agent) ============
// Gọi agent document-researcher: route theo `sources` tới firecrawl (web/vendor).
// Khi thiếu FIRECRAWL_API_KEY -> fallback websearch (DuckDuckGo HTML) để page
// vẫn chạy được. KHÔNG lưu lịch sử (frontend giữ in-session).
// Route ĐÓNG: requireAuth (thêm vào nhóm yêu cầu token, giống mọi POST khác).
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

async function searchFirecrawl(query, limit = 5) {
  const resp = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${FIRECRAWL_API_KEY}` },
    body: JSON.stringify({ query, limit, scrapeOptions: { formats: ['markdown'], onlyMainContent: true } }),
    signal: AbortSignal.timeout(30000),
  });
  if (!resp.ok) throw new Error(`firecrawl ${resp.status}`);
  const json = await resp.json();
  return (json.data || []).map((it) => ({
    title: it.title || it.url,
    source: (() => { try { return new URL(it.url).hostname; } catch { return 'web'; } })(),
    url: it.url,
    excerpt: String(it.markdown || it.description || '').slice(0, 400),
    retrievedVia: 'firecrawl',
  }));
}

function parseDdg(html) {
  const links = [...html.matchAll(/class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  const snippets = [...html.matchAll(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, '').trim());
  return links.slice(0, 5).map((m, i) => {
    let href = m[1];
    const uddg = href.match(/[?&]uddg=([^&]+)/);
    if (uddg) href = decodeURIComponent(uddg[1]);
    return {
      title: m[2].replace(/<[^>]+>/g, '').trim(),
      source: 'web',
      url: href,
      excerpt: (snippets[i] || '').slice(0, 400),
      retrievedVia: 'websearch-fallback',
    };
  });
}

async function searchFallback(query, limit = 5) {
  const url = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query);
  const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) });
  if (!resp.ok) throw new Error(`ddg ${resp.status}`);
  return parseDdg(await resp.text()).slice(0, limit);
}

// Trả [] khi mọi nguồn lỗi -> UI hiển thị "không có kết quả" thay vì 502.
async function searchDocuments(query) {
  if (FIRECRAWL_API_KEY) {
    try { return await searchFirecrawl(query); } catch (e) { console.error('[research] firecrawl failed:', e.message); }
  }
  try { return await searchFallback(query); } catch (e) { console.error('[research] fallback failed:', e.message); return []; }
}

app.post('/api/research/query', requireAuth, async (req, res) => {
  const query = String(req.body?.query || '').trim();
  if (!query) return res.status(400).json({ error: 'Thiếu trường query' });

  let sources = req.body?.sources;
  const VALID = ['datasheet', 'standard', 'catalogue'];
  if (!Array.isArray(sources) || sources.length === 0) sources = [...VALID];
  sources = sources.filter((s) => VALID.includes(s));

  try {
    const out = { query, sources, datasheets: [], catalogues: [], standards: [], technicalSummary: '' };
    const searchOne = async (src) => {
      const q = src === 'datasheet' ? `${query} datasheet`
        : src === 'catalogue' ? `${query} catalogue`
        : `${query} standard`;
      const found = await searchDocuments(q);
      return { src, found };
    };
    const results = await Promise.all(sources.map((s) => searchOne(s)));
    for (const { src, found } of results) {
      const bucket = src === 'datasheet' ? out.datasheets : src === 'catalogue' ? out.catalogues : out.standards;
      for (const f of found) bucket.push({ ...f, retrievedAt: new Date().toISOString().slice(0, 10) });
    }
    const total = out.datasheets.length + out.catalogues.length + out.standards.length;
    out.technicalSummary = total === 0
      ? `Không tìm thấy kết quả cho "${query}". Kiểm tra kết nối mạng hoặc thiết lập FIRECRAWL_API_KEY để tìm kiếm sâu hơn.`
      : `Tìm thấy ${out.datasheets.length} datasheet, ${out.catalogues.length} catalogue, ${out.standards.length} standard cho "${query}". Xem chi tiết các nguồn bên dưới.`;
    res.json(out);
  } catch (e) {
    console.error('[research] error:', e);
    res.status(502).json({ error: 'Lỗi khi tìm kiếm tài liệu', detail: e.message });
  }
});

// ============ GLOBAL SEARCH ============
// Tìm kiếm nhanh across projects + items + tasks trong project hiện tại.
// GET mở (ADR-12). Kết quả giới hạn 5 mỗi loại để tránh overload.
app.get('/api/search', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (!q || q.length < 2) return res.json({ projects: [], items: [], tasks: [] });

  // Projects — search trong _index (name, id)
  const allProjects = db.getProjects()
    .filter((p) => (p.name || '').toLowerCase().includes(q) || (p.id || '').toLowerCase().includes(q))
    .slice(0, 5)
    .map((p) => ({ id: p.id, name: p.name, type: 'project', path: '/dashboard' }));

  // Items + Tasks — search trong project hiện tại (nếu có x-project-id)
  const pid = req.headers['x-project-id'];
  let items = [];
  let tasks = [];
  if (pid) {
    try {
      const { items: pItems, tasks: pTasks } = db.getProjectSearchData(pid);
      items = (pItems || [])
        .filter((it) => (it.code || '').toLowerCase().includes(q) || (it.name || '').toLowerCase().includes(q))
        .slice(0, 5)
        .map((it) => ({ id: it.code, name: `${it.code} — ${it.name}`, port: it.port, type: 'item', path: '/items' }));
      tasks = (pTasks || [])
        .filter((t) => (t.title || '').toLowerCase().includes(q))
        .slice(0, 5)
        .map((t) => ({ id: t.id, name: t.title, status: t.status, type: 'task', path: '/kanban' }));
    } catch { /* project not found */ }
  }

  res.json({ projects: allProjects, items, tasks });
});

// ============ Serve built frontend ============
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// ============ Global error handler (P2 — chuẩn hóa lỗi thành JSON) ============
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: err.details });
  }
  if (err.code === 'PORT_HAS_LINKED_DATA') {
    return res.status(409).json({ error: err.message, details: err.details });
  }
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File quá lớn (tối đa 100MB)' });
    return res.status(400).json({ error: err.message });
  }
  if (err.message && /không được phép|loại file/i.test(err.message)) {
    return res.status(400).json({ error: err.message });
  }
  console.error('[API Error]', err);
  if (req.path.startsWith('/api')) {
    return res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`\n🛢️  Backend server running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard`);
  console.log(`📁 Projects: http://localhost:${PORT}/api/projects\n`);
});
