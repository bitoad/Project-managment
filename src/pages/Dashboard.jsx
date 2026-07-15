import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Progress, message, Select, Tag, Modal, Form, Input, Tooltip } from 'antd';
import {
  ArrowUpOutlined,
  DollarOutlined,
  ExperimentOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  FilePdfOutlined,
  FilterOutlined,
  ThunderboltOutlined,
  InboxOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  ShopOutlined,
  CalendarOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  ProjectOutlined,
  TeamOutlined,
  SolutionOutlined,
  CheckSquareOutlined,
  FundOutlined,
  PlusOutlined,
  DownloadOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, LabelList } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, itemsApi, costLogsApi, tasksApi, sCurveApi } from '../api/api.js';
import { sCurveCumulative } from '../../shared/formulas.js';
import { useUser } from '../context/UserContext.jsx';
import { useProject } from '../context/ProjectContext.jsx';
import { fmtVND, fmtShort, fmtDate, getUrgencyColor, URGENCY_LEGEND } from '../components/helpers.js';
import ItemWatchlist from '../components/ItemWatchlist.jsx';
import StatCard from '../components/StatCard.jsx';
import ChartCard from '../components/shared/ChartCard.jsx';
import { fmtChart } from '../components/shared/tokens.js';
import ProjectProgressChart from '../components/dashboard/ProjectProgressChart.jsx';
import ProjectHealth from '../components/dashboard/ProjectHealth.jsx';
import RiskAlertsTable from '../components/dashboard/RiskAlertsTable.jsx';
import NotificationsTimeline from '../components/dashboard/NotificationsTimeline.jsx';
import MilestonesPanel from '../components/dashboard/MilestonesPanel.jsx';
import PerformanceTable from '../components/dashboard/PerformanceTable.jsx';
import ModuleStatusCard from '../components/dashboard/ModuleStatusCard.jsx';
import KanbanSnapshot from '../components/dashboard/KanbanSnapshot.jsx';
import ResourceAllocation from '../components/dashboard/ResourceAllocation.jsx';
import DashboardHero from '../components/dashboard/DashboardHero.jsx';
import DashboardKPIs from '../components/dashboard/DashboardKPIs.jsx';
import QuickLinks from '../components/dashboard/QuickLinks.jsx';
import EmptyState from '../components/shared/EmptyState.jsx';

// ===== helpers =====
const toKey = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, '_');

const getBarColor = (v, avg) => {
  if (v >= avg) return '#2F5CE0';
  if (v >= avg * 0.6) return '#3B82F6';
  return '#A5B4FC';
};

// Canonical EPC phase progress weights (from project settings.statusProgress)
const STATUS_PROGRESS = {
  engineering: 0.1,
  approved: 0.2,
  procurement: 0.3,
  fabrication: 0.6,
  delivery: 0.8,
  installation: 0.9,
  completed: 1.0,
};

const phaseWeight = (status) => STATUS_PROGRESS[toKey(status)] ?? null;

// % of items that have reached (or passed) a given phase weight
const pctReached = (items, minWeight) => {
  const n = items.length;
  if (!n) return 0;
  const reached = items.filter((it) => {
    const w = phaseWeight(it.status);
    return w != null && w >= minWeight;
  }).length;
  return Math.round((reached / n) * 100);
};

const TASK_STATUS = {
  todo: { label: 'Cần làm', color: '#4B5563' },
  inprogress: { label: 'Đang làm', color: '#3B82F6' },
  review: { label: 'Kiểm tra', color: '#F59E0B' },
  done: { label: 'Hoàn thành', color: '#10B981' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const {
    currentProjectId,
    currentProject,
    projects,
    portfolioView,
    setPortfolioView,
    selectProject,
    selectAllProjects,
    createProject,
  } = useProject();
  const projectId = currentProjectId;
  const projectName = currentProject?.name;
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState({});
  const [items, setItems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [costLogs, setCostLogs] = useState([]);
  const [sCurve, setSCurve] = useState([]);
  const [sortBy, setSortBy] = useState('variance');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (portfolioView) {
        // Aggregate (portfolio) response has a different shape:
        // { projects, items, costLogs, aggregate:{...flat kpis...}, perProject:[...] }
        const raw = await dashboardApi.aggregate();
        const agg = raw.aggregate || {};
        // Build a "ports" proxy from per-project summaries so charts/tables work
        const ports = (raw.perProject || []).map((p) => ({
          id: p.id,
          name: p.name,
          progress: p.avgProgress || 0,
          virtual: false,
        }));
        setView({
          ...agg,
          totalPlannedCost: agg.totalCost || 0,
          ports,
          projects: raw.projects || [],
        });
        setItems(raw.items || []);
        setTasks(agg.tasks || []);
        setCostLogs(raw.costLogs || []);
      } else {
        const v = await dashboardApi.get(projectId);
        setView({ ...v, totalPlannedCost: v.totalCost || 0 });
        const [it, tk, cl] = await Promise.all([
          itemsApi.getAll(projectId).catch(() => []),
          tasksApi.getAll(projectId).catch(() => []),
          costLogsApi.getAll(projectId).catch(() => []),
        ]);
        setItems(it);
        setTasks(tk);
        setCostLogs(cl);
        const sc = await sCurveApi.getAll(projectId).catch(() => []);
        setSCurve(sc || []);
      }
    } catch (e) {
      console.error('Dashboard load error', e);
      message.error('Không thể tải dữ liệu tổng quan');
    } finally {
      setLoading(false);
    }
  }, [portfolioView, projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const viewFilter = useMemo(() => (view.ports || []).filter((p) => !p.virtual), [view.ports]);
  const pId = (p) => p.id || p;
  const pName = (p) => p.name || p.id || p;

  // ===== charts =====
  const chartData = useMemo(() => {
    const ports = (view.ports || []).map((p) => ({ id: pId(p), name: pName(p) }));
    const costByItem = view.costByItem || [];
    const statusCounts = {};
    (items || []).forEach((it) => {
      const k = toKey(it.status || 'unknown');
      statusCounts[k] = (statusCounts[k] || 0) + 1;
    });
    const STATUS_LABEL = {
      engineering: 'Thiết kế',
      approved: 'Duyệt',
      procurement: 'Mua sắm',
      fabrication: 'Chế tạo',
      delivery: 'Giao hàng',
      installation: 'Lắp đặt',
      completed: 'Hoàn thành',
      unknown: 'Chưa phân loại',
    };
    const pie = Object.entries(statusCounts).map(([k, v]) => ({ key: k, name: STATUS_LABEL[k] || k, value: v }));
    const pieTotal = pie.reduce((s, e) => s + e.value, 0);
    return { ports, costByItem, pie, pieTotal };
  }, [view, items]);

  // Real S-Curve from stored weekly planned/actual % (via sCurveCumulative)
  const sCurveData = useMemo(() => {
    if (!sCurve || !sCurve.length) return [];
    return sCurveCumulative(sCurve);
  }, [sCurve]);

  const revenueStats = useMemo(() => {
    const d = chartData.costByItem;
    if (!d.length) return null;
    const vals = d.map((x) => x.actual);
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const total = vals.reduce((a, b) => a + b, 0);
    return {
      total,
      max: { value: max, name: d.find((x) => x.actual === max)?.name || '' },
      min: { value: min, name: d.find((x) => x.actual === min)?.name || '' },
      avg: Math.round(total / d.length),
    };
  }, [chartData.costByItem]);

  const costItems = useMemo(() => {
    const arr = [...(chartData.costByItem || [])].map((c) => ({
      code: c.code,
      name: c.name,
      planned: Number(c.planned) || 0,
      actual: Number(c.actual) || 0,
    }));
    const max = Math.max(...arr.map((a) => a.planned), 1);
    if (sortBy === 'value') arr.sort((a, b) => b.actual - a.actual);
    else arr.sort((a, b) => b.actual - b.planned - (a.actual - a.planned));
    return { max, display: arr.slice(0, 8) };
  }, [chartData.costByItem, sortBy]);

  // ===== upcoming / schedule / reminders =====
  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const itemDue = (items || [])
      .filter((it) => it.endDate)
      .map((it) => ({ id: `i-${it.code}`, title: `${it.code} · ${it.name}`, endDate: it.endDate, owner: it.owner, kind: 'item' }));
    const taskDue = (tasks || [])
      .filter((t) => t.endDate)
      .map((t) => ({ id: `t-${t.id}`, title: t.title, endDate: t.endDate, owner: t.owner, kind: 'task' }));
    return [...itemDue, ...taskDue]
      .map((d) => {
        const dt = new Date(d.endDate);
        dt.setHours(0, 0, 0, 0);
        const diff = Math.round((dt - today) / 86400000);
        return { ...d, daysLeft: diff };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 8);
  }, [items, tasks]);

  const weekSchedule = useMemo(() => {
    const map = {};
    (tasks || []).forEach((t) => {
      if (!t.endDate) return;
      const dt = new Date(t.endDate);
      const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
      if (!map[key]) map[key] = { date: dt, items: [] };
      map[key].items.push(t);
    });
    return Object.values(map).sort((a, b) => a.date - b.date);
  }, [tasks]);

  const reminders = useMemo(() => {
    const out = [];
    (upcomingDeadlines || []).slice(0, 4).forEach((d) => {
      const urgent = d.daysLeft <= 3;
      out.push({
        id: `rem-${d.id}`,
        type: d.kind === 'task' ? 'task' : 'deadline',
        title: urgent ? `Sắp đến hạn: ${d.title}` : `Nhắc hạn: ${d.title}`,
        link: d.kind === 'task' ? '/kanban' : '/items',
        meta: d.owner || 'Chưa gán',
        color: d.daysLeft < 0 ? '#EF4444' : d.daysLeft <= 3 ? '#F5803E' : '#2F5CE0',
        date: d.daysLeft < 0 ? `trễ ${-d.daysLeft} ngày` : `còn ${d.daysLeft} ngày`,
      });
    });
    (view.recentCosts || []).slice(0, 2).forEach((c) => {
      out.push({
        id: `rc-${c.id}`,
        type: 'cost',
        title: `Chi phí mới: ${fmtShort(c.amount)} ₫`,
        link: '/cost',
        meta: c.note || 'Chi phí',
        color: '#10B981',
        date: c.date ? new Date(c.date).toLocaleDateString('vi-VN') : '',
      });
    });
    return out;
  }, [upcomingDeadlines, view.recentCosts]);

  const taskStats = useMemo(() => {
    const s = { todo: 0, inprogress: 0, review: 0, done: 0 };
    (tasks || []).forEach((t) => {
      const k = toKey(t.status);
      if (s[k] !== undefined) s[k] += 1;
    });
    const total = tasks.length || 1;
    return Object.entries(s).map(([k, v]) => ({ status: k, label: TASK_STATUS[k]?.label || k, value: v, pct: Math.round((v / total) * 100), color: TASK_STATUS[k]?.color }));
  }, [tasks]);

  const costSpark = useMemo(() => (view.recentCosts || []).slice(-12).map((c) => Number(c.amount) || 0), [view.recentCosts]);
  const progressSpark = useMemo(() => {
    const arr = (view.ports || []).map((p) => p.progress ?? 0);
    return arr.length ? arr : [0];
  }, [view.ports]);

  // ===== health / module proxies (derived from real item status) =====
  const itemStatusCounts = useMemo(() => {
    const c = {};
    (items || []).forEach((it) => {
      const k = it.status || 'unknown';
      c[k] = (c[k] || 0) + 1;
    });
    return c;
  }, [items]);

  const totalItems = items.length || 0;
  const ev = view.totalPlannedCost ? Math.round((view.avgProgress / 100) * view.totalPlannedCost) : 0;
  const ac = view.totalLoggedCost || 0;
  const cpi = ac > 0 ? ev / ac : 1;
  const costPct = Math.max(0, Math.min(100, Math.round(cpi * 100)));

  const seg = (label, value, color) => ({ label, value, color });

  // Real EPC phase distribution (counts of items currently at each phase)
  const engCount = itemStatusCounts.Engineering || 0;
  const approvedCount = itemStatusCounts.Approved || 0;
  const procCount = itemStatusCounts.Procurement || 0;
  const fabCount = itemStatusCounts.Fabrication || 0;
  const deliveryCount = itemStatusCounts.Delivery || 0;
  const installCount = itemStatusCounts.Installation || 0;
  const doneCount = itemStatusCounts.Completed || 0;

  // % of items that have reached (or passed) each phase — drives the gauges
  const procurementPct = pctReached(items, 0.3);
  const fabricationPct = pctReached(items, 0.6);
  const installPct = pctReached(items, 0.9);

  const procurementProxy = {
    total: totalItems,
    pct: procurementPct,
    segments: [
      seg('Thiết kế', engCount + approvedCount, '#2F5CE0'),
      seg('Mua sắm', procCount, '#F5A623'),
      seg('Chế tạo', fabCount, '#8B5CF6'),
      seg('Đã giao', deliveryCount + installCount + doneCount, '#1FA971'),
    ],
  };
  const engineeringProxy = {
    total: totalItems,
    pct: pctReached(items, 0.1),
    segments: [
      seg('Đang vẽ', engCount, '#2F5CE0'),
      seg('Đã duyệt', approvedCount + procCount + fabCount + deliveryCount + installCount + doneCount, '#1FA971'),
    ],
  };
  const installationProxy = {
    total: totalItems,
    pct: installPct,
    segments: [
      seg('Chế tạo', fabCount + deliveryCount, '#8B5CF6'),
      seg('Lắp đặt', installCount, '#F5A623'),
      seg('Hoàn thành', doneCount, '#1FA971'),
    ],
  };

  const healthItems = [
    { key: 'schedule', label: 'Tiến độ', name: 'Schedule', value: view.avgProgress || 0 },
    { key: 'cost', label: 'Chi phí (CPI)', name: 'CPI', value: costPct },
    { key: 'procurement', label: 'Mua sắm', name: 'Procurement', value: procurementPct },
    { key: 'fabrication', label: 'Chế tạo', name: 'Fabrication', value: fabricationPct },
  ];

  const perPortRows = useMemo(() => {
    return (view.ports || []).map((p) => {
      const pid = pId(p);
      const itemsInPort = (items || []).filter((it) => it.port === pid || (it.port && it.port.id === pid));
      const budget = itemsInPort.reduce((s, it) => s + (Number(it.qty) * Number(it.internalCost || it.cost || 0)), 0);
      const actual = (costLogs || []).filter((c) => c.portId === pid).reduce((s, c) => s + Number(c.amount || 0), 0);
      const progress = itemsInPort.length
        ? Math.round(itemsInPort.reduce((s, it) => s + (Number(it.progress) || 0), 0) / itemsInPort.length)
        : 0;
      const e = budget ? (progress / 100) * budget : 0;
      const cpi = actual > 0 ? e / actual : 1;
      return {
        id: pid,
        name: pName(p),
        progress,
        budget: Math.round(budget),
        actual: Math.round(actual),
        forecast: Math.round(budget),
        spi: 1,
        cpi: Number(cpi.toFixed(2)),
      };
    });
  }, [view.ports, items, costLogs]);

  const milestones = useMemo(
    () =>
      upcomingDeadlines
        .map((d) => ({ id: d.id, title: d.title, date: d.endDate, owner: d.owner, days: d.daysLeft, color: getUrgencyColor(d.daysLeft) }))
        .sort((a, b) => a.days - b.days),
    [upcomingDeadlines]
  );

  const resourceData = useMemo(() => {
    const map = {};
    (tasks || []).forEach((t) => {
      const o = t.owner || 'Chưa gán';
      map[o] = (map[o] || 0) + 1;
    });
    const palette = ['#2F5CE0', '#1FA971', '#F5A623', '#8B5CF6', '#EF4444', '#3B82F6', '#14B8A6', '#F5803E'];
    return Object.entries(map)
      .map(([name, count], i) => ({ name, count, color: palette[i % palette.length] }))
      .sort((a, b) => b.count - a.count);
  }, [tasks]);

  const kanbanCounts = useMemo(() => {
    let open = 0;
    let completed = 0;
    let overdue = 0;
    let blocked = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    (tasks || []).forEach((t) => {
      if (t.status === 'done') completed++;
      else {
        open++;
        if (t.endDate && new Date(t.endDate) < today) overdue++;
      }
      if (t.status === 'blocked') blocked++;
    });
    return { open, completed, overdue, blocked };
  }, [tasks]);

  const notifications = reminders.map((r) => ({ id: r.id, title: r.title, project: r.meta, date: r.date, color: r.color }));

  // ===== hero header: live summary chips =====
  const portCount = (view.ports || []).filter((p) => !p.virtual).length || (view.ports || []).length;

  const handleCreateProject = async () => {
    try {
      const v = await form.validateFields();
      setCreating(true);
      await createProject(v.name.trim(), (v.description || '').trim());
      setCreateOpen(false);
      form.resetFields();
    } catch (e) {
      if (e?.errorFields) return; // validation error already shown
      message.error('Không tạo được dự án');
    } finally {
      setCreating(false);
    }
  };

  const handleExport = () => {
    setExporting(true);
    try {
      // PDF-safe formatters (jsPDF default font is Latin-only)
      const money = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(Number(n) || 0)) + ' VND';
      const ascii = (s) => (s ?? '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
      const doc = new jsPDF();
      const title = ascii(portfolioView ? 'Tong quan toan bo du an' : (projectName || 'Tong quan du an'));
      // Banner
      doc.setFillColor(47, 92, 224);
      doc.rect(0, 0, 210, 26, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont(undefined, 'bold');
      doc.text('DASHBOARD - BAO CAO NHANH', 105, 11, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(title, 105, 19, { align: 'center' });

      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, 14, 34);
      doc.text(`Nguoi xuat: ${ascii(user?.name || user?.username || '-')}`, 120, 34);

      let y = 42;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(20, 20, 20);
      doc.text('1. CHI SO CHINH', 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Chi so', 'Gia tri']],
        body: [
          ['Ngan sach (ke hoach)', money(view.totalPlannedCost)],
          ['Da chi', money(view.totalLoggedCost)],
          ['Doanh thu', money(view.totalRevenue)],
          ['Loi nhuan', `${money(view.totalProfit)} (bien ${Math.round(view.totalProfitMargin || 0)}%)`],
          ['Tien do trung binh', `${Math.round(view.avgProgress || 0)}%`],
          ['Tong hang muc', String(totalItems)],
          ['Rui ro dang mo', String(view.openRisks || 0)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [47, 92, 224], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 70 } },
      });
      y = doc.lastAutoTable.finalY + 10;

      // Performance by port
      if (perPortRows.length) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('2. HIEU SUAT THEO CANG / GOI', 14, y);
        y += 4;
        autoTable(doc, {
          startY: y,
          head: [['Cang/Goi', 'Tien do %', 'Ngan sach', 'Da chi', 'CPI']],
          body: perPortRows.map((p) => [
            ascii(p.name), `${p.progress}%`, money(p.budget), money(p.actual), String(p.cpi),
          ]),
          theme: 'striped',
          headStyles: { fillColor: [31, 169, 113], fontSize: 9 },
          bodyStyles: { fontSize: 9 },
        });
        y = doc.lastAutoTable.finalY + 10;
      }

      // High risks
      const highRisks = view.highRisks || [];
      if (highRisks.length) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('3. RUI RO UU TIEN', 14, y);
        y += 4;
        autoTable(doc, {
          startY: y,
          head: [['Rui ro', 'Cang', 'Diem', 'Phu trach']],
          body: highRisks.map((r) => [ascii(r.title), ascii(r.portName || '-'), String(r.score ?? '-'), ascii(r.owner || '-')]),
          theme: 'striped',
          headStyles: { fillColor: [239, 68, 68], fontSize: 9 },
          bodyStyles: { fontSize: 9 },
        });
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Golden Point Co., Ltd | Trang ${i}/${pageCount}`, 105, 290, { align: 'center' });
      }
      doc.save(`Bao_cao_dashboard_${new Date().toISOString().slice(0, 10)}.pdf`);
      message.success('Đã xuất báo cáo PDF');
    } catch (e) {
      console.error(e);
      message.error('Lỗi khi xuất báo cáo: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="dash-shell">
        <div className="dash-grid">
          <div className="col-12">
            <Card loading style={{ minHeight: 360 }} />
          </div>
        </div>
      </div>
    );
  }

  const bannerTitle = portfolioView ? 'Tổng quan toàn bộ dự án' : view.projectName || view.name || projectName || 'Tổng quan';
  const todayStr = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const projectOptions = [
    { value: 'all', label: 'Tất cả dự án' },
    ...(projects || []).map((p) => ({ value: p.id, label: p.name || p.id })),
  ];

  const handleSelectProject = (v) => {
    if (v === 'all') selectAllProjects();
    else selectProject(v);
  };

  const heroStats = [
    { key: 'progress', icon: <RiseOutlined />, label: 'Tiến độ TB', value: `${Math.round(view.avgProgress || 0)}%`, tone: '#2F5CE0' },
    { key: 'budget', icon: <FundOutlined />, label: 'Ngân sách', value: `${fmtShort(view.totalPlannedCost || 0)} ₫`, tone: '#1FA971' },
    { key: 'spent', icon: <DollarOutlined />, label: 'Đã chi', value: `${fmtShort(view.totalLoggedCost || 0)} ₫`, tone: '#F5A623' },
    { key: 'ports', icon: <AppstoreOutlined />, label: portfolioView ? 'Dự án' : 'Cảng / gói', value: portfolioView ? (projects?.length || 0) : portCount, tone: '#8B5CF6' },
    { key: 'items', icon: <InboxOutlined />, label: 'Hạng mục', value: totalItems, tone: '#0EA5E9' },
    { key: 'risks', icon: <WarningOutlined />, label: 'Rủi ro mở', value: view.openRisks || 0, tone: '#EF4444' },
  ];

  return (
    <div className="dash-shell">
      <div className="dash-grid">
        {/* ===== Hero header ===== */}
        <DashboardHero
          portfolioView={portfolioView}
          projectId={projectId}
          projects={projects}
          bannerTitle={bannerTitle}
          user={user}
          todayStr={todayStr}
          heroStats={heroStats}
          projectOptions={projectOptions}
          onSelectProject={handleSelectProject}
          onCreateOpen={() => setCreateOpen(true)}
          onExport={handleExport}
          exporting={exporting}
        />

        {/* ===== R1: Executive KPIs ===== */}
        <DashboardKPIs view={view} totalItems={totalItems} />

        {/* ===== Quick links ===== */}
        <QuickLinks />

        {/* ===== R2: Progress + Health ===== */}
        <section className="col-8">
          <ChartCard icon={<LineChartOutlined style={{ color: '#2F5CE0' }} />} title="Tiến độ & Chi phí (S-Curve)" extra={<Tag color="blue">EV = {fmtShort(ev)} ₫</Tag>}>
            <ProjectProgressChart data={sCurveData} avgProgress={view.avgProgress || 0} />
          </ChartCard>
        </section>
        <section className="col-4">
          <ChartCard icon={<FundOutlined style={{ color: '#1FA971' }} />} title="Chỉ số sức khỏe">
            <ProjectHealth items={healthItems} />
          </ChartCard>
        </section>

        {/* ===== Charts: Revenue / Status / Cost ===== */}
        <section className="col-4">
          <ChartCard icon={<BarChartOutlined style={{ color: '#2F5CE0' }} />} title="Doanh thu theo hạng mục" extra={<span className="dash-muted">tổng {fmtShort(view.totalRevenue || 0)} ₫</span>}>
            <div className="rev-mini-row">
              <div className="rev-mini">
                <span className="rev-mini-val">{fmtShort(revenueStats?.total || 0)}</span>
                <span className="rev-mini-lbl">Tổng</span>
              </div>
              <div className="rev-mini">
                <span className="rev-mini-val" style={{ color: '#10B981' }}>{fmtShort(revenueStats?.max?.value || 0)}</span>
                <span className="rev-mini-lbl">Cao nhất</span>
              </div>
              <div className="rev-mini">
                <span className="rev-mini-val" style={{ color: '#F5A623' }}>{fmtShort(revenueStats?.min?.value || 0)}</span>
                <span className="rev-mini-lbl">Thấp nhất</span>
              </div>
            </div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.costByItem} margin={{ top: 18, right: 6, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#eef1f5" />
                  <XAxis dataKey="code" tick={{ fontSize: 10, fill: '#8B95A5' }} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={54} />
                  <YAxis tick={{ fontSize: 10, fill: '#8B95A5' }} tickFormatter={(v) => fmtChart(v)} axisLine={false} tickLine={false} width={42} />
                  <RTooltip formatter={(v) => `${fmtVND(v)} ₫`} />
                  <Bar dataKey="actual" radius={[4, 4, 0, 0]} maxBarSize={36}>
                    {chartData.costByItem.map((d, i) => (
                      <Cell key={i} fill={getBarColor(d.actual, revenueStats?.avg || 1)} />
                    ))}
                    <LabelList dataKey="actual" position="top" formatter={(v) => fmtChart(v)} style={{ fontSize: 9, fill: '#8B95A5' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </section>
        <section className="col-4">
          <ChartCard icon={<PieChartOutlined style={{ color: '#8B5CF6' }} />} title="Trạng thái hạng mục">
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={chartData.pie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="60%" outerRadius="85%" paddingAngle={2} stroke="none">
                    {chartData.pie.map((e, i) => (
                      <Cell key={i} fill={['#4B5563', '#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'][i % 6]} />
                    ))}
                  </Pie>
                  <RTooltip formatter={(v) => `${v} mục`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <div className="donut-total">{chartData.pieTotal}</div>
                <div className="donut-label">Tổng số mục</div>
              </div>
            </div>
            <div className="donut-legend">
              {chartData.pie.map((e, i) => (
                <span key={i} className="donut-leg-item">
                  <span className="donut-leg-dot" style={{ background: ['#4B5563', '#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'][i % 6] }} />
                  {e.name} <b>{e.value}</b> ({chartData.pieTotal ? Math.round((e.value / chartData.pieTotal) * 100) : 0}%)
                </span>
              ))}
            </div>
          </ChartCard>
        </section>
        <section className="col-4">
          <ChartCard
            icon={<InboxOutlined style={{ color: '#F5A623' }} />}
            title="Chi phí theo hạng mục"
            extra={
              <Select size="small" value={sortBy} onChange={setSortBy} style={{ width: 120 }} options={[{ value: 'variance', label: 'Chênh lệch' }, { value: 'value', label: 'Giá trị' }]} />
            }
          >
            {costItems.display.length ? (
              <div className="cost-list">
                {costItems.display.map((it) => {
                  const plannedPct = costItems.max ? (it.planned / costItems.max) * 100 : 0;
                  const actualPct = costItems.max ? (it.actual / costItems.max) * 100 : 0;
                  return (
                    <div className="cost-row" key={it.code}>
                      <div>
                        <div className="cost-name">{it.name}<span className="cost-code">{it.code}</span></div>
                        <div className="cost-bars">
                          <div className="cost-bar planned" style={{ width: `${plannedPct}%` }} />
                          <div className="cost-bar actual" style={{ width: `${actualPct}%` }} />
                        </div>
                      </div>
                      <div className="cost-vals">
                        <span>{fmtShort(it.actual)}</span>
                        <span className="cost-planned-val">{fmtShort(it.planned)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={<DollarOutlined />} title="Chưa có dữ liệu chi phí" />
            )}
          </ChartCard>
        </section>

        {/* ===== R3: Risk / Notifications / Milestones ===== */}
        <section className="col-5">
          <ChartCard icon={<WarningOutlined style={{ color: '#EF4444' }} />} title="Cảnh báo rủi ro" extra={<a className="dash-link" onClick={() => navigate('/risk')}>Xem tất cả</a>}>
            <div className="dash-table">
              <RiskAlertsTable risks={view.highRisks || []} />
            </div>
          </ChartCard>
        </section>
        <section className="col-4">
          <ChartCard icon={<FilePdfOutlined style={{ color: '#2F5CE0' }} />} title="Thông báo mới">
            <NotificationsTimeline items={notifications} />
          </ChartCard>
        </section>
        <section className="col-3">
          <ChartCard icon={<CalendarOutlined style={{ color: '#0EA5E9' }} />} title="Mốc sắp tới" extra={<a className="dash-link" onClick={() => navigate('/timeline')}>Tiến độ</a>}>
            <MilestonesPanel items={milestones} onOpen={() => navigate('/timeline')} />
          </ChartCard>
        </section>

        {/* ===== R4: Performance by port ===== */}
        <section className="col-12">
          <ChartCard icon={<BarChartOutlined style={{ color: '#2F5CE0' }} />} title="Hiệu suất theo cảng / gói thầu" extra={<a className="dash-link" onClick={() => navigate('/cost')}>Chi tiết</a>}>
            <div className="dash-table">
              <PerformanceTable rows={perPortRows} onOpen={() => navigate('/cost')} />
            </div>
          </ChartCard>
        </section>

        {/* ===== R5: Module status (proxies) ===== */}
        <section className="col-4">
          <ChartCard icon={<ShopOutlined style={{ color: '#F5A623' }} />} title="Mua sắm">
            <ModuleStatusCard title="Procurement" icon={<ShopOutlined />} color="#F5A623" segments={procurementProxy.segments} total={procurementProxy.total} empty={totalItems === 0} />
          </ChartCard>
        </section>
        <section className="col-4">
          <ChartCard icon={<SolutionOutlined style={{ color: '#2F5CE0' }} />} title="Thiết kế">
            <ModuleStatusCard title="Engineering" icon={<SolutionOutlined />} color="#2F5CE0" segments={engineeringProxy.segments} total={engineeringProxy.total} empty={totalItems === 0} />
          </ChartCard>
        </section>
        <section className="col-4">
          <ChartCard icon={<CheckSquareOutlined style={{ color: '#1FA971' }} />} title="Lắp đặt & Nghiệm thu">
            <ModuleStatusCard title="Installation" icon={<CheckSquareOutlined />} color="#1FA971" segments={installationProxy.segments} total={installationProxy.total} empty={totalItems === 0} />
          </ChartCard>
        </section>

        {/* ===== R6: Kanban + Resource ===== */}
        <section className="col-6">
          <ChartCard icon={<UnorderedListOutlined style={{ color: '#8B5CF6' }} />} title="Tác vụ Kanban" extra={<a className="dash-link" onClick={() => navigate('/kanban')}>Mở bảng</a>}>
            <KanbanSnapshot counts={kanbanCounts} onOpen={() => navigate('/kanban')} />
          </ChartCard>
        </section>
        <section className="col-6">
          <ChartCard icon={<TeamOutlined style={{ color: '#EF4444' }} />} title="Phân bổ nguồn lực (theo người phụ trách)">
            <ResourceAllocation data={resourceData} />
          </ChartCard>
        </section>

        {/* ===== Item watchlist ===== */}
        <section className="col-12">
          <ItemWatchlist items={items} />
        </section>
      </div>

      <Modal
        title="Thêm dự án mới"
        open={createOpen}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        onOk={handleCreateProject}
        confirmLoading={creating}
        okText="Tạo dự án"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 8 }}>
          <Form.Item
            name="name"
            label="Tên dự án"
            rules={[{ required: true, message: 'Vui lòng nhập tên dự án' }]}
          >
            <Input placeholder="VD: Block B Gas Project" autoFocus />
          </Form.Item>
          <Form.Item name="description" label="Mô tả (tùy chọn)">
            <Input.TextArea rows={3} placeholder="Mô tả ngắn về phạm vi, chủ đầu tư, địa điểm..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
