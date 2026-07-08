import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import XLSX from 'xlsx';
import * as db from './database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Phục vụ file upload tĩnh
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname.replace(/\s+/g, '_'));
  },
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

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

// ============ PROJECTS (Quản lý dự án) ============
app.get('/api/projects', (req, res) => {
  res.json(db.getProjects());
});

app.post('/api/projects', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Tên dự án bắt buộc' });
  const project = db.createProject(name, description);
  res.status(201).json(project);
});

app.put('/api/projects/:id', (req, res) => {
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

// ============ META & SETTINGS ============
app.get('/api/meta', requireProject, (req, res) => res.json(db.getMeta(req.projectId)));
app.put('/api/meta', requireProject, (req, res) => res.json(db.updateMeta(req.projectId, req.body)));
app.get('/api/settings', requireProject, (req, res) => res.json(db.getSettings(req.projectId)));

// ============ PORTS ============
app.get('/api/ports', requireProject, (req, res) => res.json(db.getPorts(req.projectId)));
app.post('/api/ports', requireProject, (req, res) => res.status(201).json(db.addPort(req.projectId, req.body)));
app.get('/api/ports/:id', requireProject, (req, res) => {
  const port = db.getPortById(req.projectId, req.params.id);
  if (!port) return res.status(404).json({ error: 'Port not found' });
  res.json(port);
});
app.put('/api/ports/:id', requireProject, (req, res) => {
  const port = db.updatePort(req.projectId, req.params.id, req.body);
  if (!port) return res.status(404).json({ error: 'Port not found' });
  res.json(port);
});

// ============ ITEMS ============
app.get('/api/items', requireProject, (req, res) => res.json(db.getItems(req.projectId)));
app.get('/api/items/:code', requireProject, (req, res) => {
  const item = db.getItemByCode(req.projectId, req.params.code);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});
app.post('/api/items', requireProject, (req, res) => res.status(201).json(db.addItem(req.projectId, req.body)));
app.put('/api/items/:code', requireProject, (req, res) => res.json(db.updateItem(req.projectId, req.params.code, req.body)));
app.delete('/api/items/:code', requireProject, (req, res) => {
  db.deleteItem(req.projectId, req.params.code);
  res.json({ success: true });
});

// ============ SUPPLIERS ============
app.get('/api/suppliers', requireProject, (req, res) => res.json(db.getSuppliers(req.projectId)));
app.post('/api/suppliers', requireProject, (req, res) => res.status(201).json(db.addSupplier(req.projectId, req.body)));
app.put('/api/suppliers/:id', requireProject, (req, res) => res.json(db.updateSupplier(req.projectId, req.params.id, req.body)));
app.delete('/api/suppliers/:id', requireProject, (req, res) => {
  db.deleteSupplier(req.projectId, req.params.id);
  res.json({ success: true });
});

// ============ SUPPLIER PORTS ============
app.get('/api/supplier-ports', requireProject, (req, res) => {
  if (req.query.portId) return res.json(db.getSupplierPortsByPort(req.projectId, req.query.portId));
  res.json(db.getSupplierPorts(req.projectId));
});
app.post('/api/supplier-ports', requireProject, (req, res) => res.status(201).json(db.addSupplierPort(req.projectId, req.body)));
app.put('/api/supplier-ports/:id', requireProject, (req, res) => res.json(db.updateSupplierPort(req.projectId, req.params.id, req.body)));
app.delete('/api/supplier-ports/:id', requireProject, (req, res) => {
  db.deleteSupplierPort(req.projectId, req.params.id);
  res.json({ success: true });
});

// ============ RISKS ============
app.get('/api/risks', requireProject, (req, res) => res.json(db.getRisks(req.projectId)));
app.post('/api/risks', requireProject, (req, res) => res.status(201).json(db.addRisk(req.projectId, req.body)));
app.put('/api/risks/:id', requireProject, (req, res) => res.json(db.updateRisk(req.projectId, req.params.id, req.body)));
app.delete('/api/risks/:id', requireProject, (req, res) => {
  db.deleteRisk(req.projectId, req.params.id);
  res.json({ success: true });
});

// ============ TASKS ============
app.get('/api/tasks', requireProject, (req, res) => res.json(db.getTasks(req.projectId)));
app.post('/api/tasks', requireProject, (req, res) => res.status(201).json(db.addTask(req.projectId, req.body)));
app.put('/api/tasks/:id', requireProject, (req, res) => res.json(db.updateTask(req.projectId, req.params.id, req.body)));
app.delete('/api/tasks/:id', requireProject, (req, res) => {
  db.deleteTask(req.projectId, req.params.id);
  res.json({ success: true });
});

// ============ TEAM ============
app.get('/api/team', requireProject, (req, res) => res.json(db.getTeam(req.projectId)));
app.post('/api/team', requireProject, (req, res) => res.status(201).json(db.addMember(req.projectId, req.body)));
app.put('/api/team/:id', requireProject, (req, res) => res.json(db.updateMember(req.projectId, req.params.id, req.body)));
app.delete('/api/team/:id', requireProject, (req, res) => {
  db.deleteMember(req.projectId, req.params.id);
  res.json({ success: true });
});

// ============ COST LOGS ============
app.get('/api/cost-logs', requireProject, (req, res) => res.json(db.getCostLogs(req.projectId)));
app.post('/api/cost-logs', requireProject, (req, res) => res.status(201).json(db.addCostLog(req.projectId, req.body)));
app.put('/api/cost-logs/:id', requireProject, (req, res) => res.json(db.updateCostLog(req.projectId, req.params.id, req.body)));
app.delete('/api/cost-logs/:id', requireProject, (req, res) => {
  db.deleteCostLog(req.projectId, req.params.id);
  res.json({ success: true });
});

// ============ QUOTATIONS ============
app.get('/api/quotations', requireProject, (req, res) => res.json(db.getSupplierQuotations(req.projectId)));
app.post('/api/quotations', requireProject, (req, res) => res.status(201).json(db.addSupplierQuotation(req.projectId, req.body)));
app.put('/api/quotations/:id', requireProject, (req, res) => res.json(db.updateSupplierQuotation(req.projectId, req.params.id, req.body)));
app.delete('/api/quotations/:id', requireProject, (req, res) => {
  db.deleteSupplierQuotation(req.projectId, req.params.id);
  res.json({ success: true });
});

// ============ S-CURVE ============
app.get('/api/s-curve', requireProject, (req, res) => res.json(db.getSCurve(req.projectId)));
app.put('/api/s-curve/:week', requireProject, (req, res) => res.json(db.updateSCurvePoint(req.projectId, req.params.week, req.body)));

// ============ DOCUMENTS ============
app.get('/api/documents', requireProject, (req, res) => {
  if (req.query.portId) return res.json(db.getDocumentsByPort(req.projectId, req.query.portId));
  res.json(db.getDocuments(req.projectId));
});
app.post('/api/documents', requireProject, upload.single('file'), (req, res) => {
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

app.post('/api/projects/:id/import-excel', requireProject, upload.single('file'), (req, res) => {
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
    console.error('[Import Excel Error]', e);
    res.status(500).json({ error: 'Lỗi import Excel: ' + e.message });
  }
});

// ============ EXPORT EXCEL ============
app.get('/api/projects/:id/export-excel', requireProject, async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`\n🛢️  Backend server running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard`);
  console.log(`📁 Projects: http://localhost:${PORT}/api/projects\n`);
});
