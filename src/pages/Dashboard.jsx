import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Row, Col, Card, Statistic, Progress, Table, Tag, Spin, message, Typography, Button, Select, Space, Calendar, Badge, Tooltip,
} from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, CheckCircleOutlined,
  ExperimentOutlined, WarningOutlined, ClockCircleOutlined,
  FilePdfOutlined, FilterOutlined,
} from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, itemsApi, costLogsApi, tasksApi } from '../api/api.js';
import { useUser } from '../context/UserContext.jsx';
import { useProject } from '../context/ProjectContext.jsx';
import { costOf } from '../components/helpers.js';

const { Text, Title } = Typography;

const fmtVND = (n) => {
  if (!n && n !== 0) return '-';
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
};
const fmtShort = (n) => {
  if (!n && n !== 0) return '0';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + ' Tỷ';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(0) + ' Tr';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(0) + ' K';
  return String(n);
};

const PORT_COLORS = {
  'PORT 1': '#1677ff', 'PORT 2': '#52c41a', 'PORT 3': '#faad14',
  'PORT 4': '#eb2f96', 'PORT 5': '#722ed1', 'PORT 6': '#13c2c2', 'PORT 7': '#fa8c16',
};

const Sparkline = ({ data = [], color = '#2F5CE0', width = 90, height = 28 }) => {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1 || 1);
  const points = data.map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / range) * height).toFixed(1)}`);
  const d = `M${points.join(' L')}`;
  return (
    <svg width={width} height={height} style={{ marginTop: 6, overflow: 'visible' }}>
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const KpiCard = ({ icon, iconBg, title, value, valueStyle, formatter, suffix, footer, progress, spark, sparkColor }) => (
  <Card className="stat-card stat-card-accent" bordered={false}>
    <div className="kpi-card-body">
      <div className="kpi-icon" style={{ background: iconBg }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Statistic
          title={title}
          value={value}
          formatter={formatter}
          suffix={suffix}
          valueStyle={valueStyle}
        />
        {progress != null && (
          <Progress percent={progress} showInfo={false} size="small" strokeColor={valueStyle?.color || '#2F5CE0'} style={{ marginTop: 6 }} />
        )}
        {spark && <Sparkline data={spark} color={sparkColor || valueStyle?.color || '#2F5CE0'} />}
        {footer && !spark && <div className="stat-label">{footer}</div>}
        {footer && spark && <div className="stat-label">{footer}</div>}
      </div>
    </div>
  </Card>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [agg, setAgg] = useState(null);
  const [items, setItems] = useState([]);
  const [costLogs, setCostLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPort, setFilterPort] = useState('all');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { projects } = useProject();

  // Chế độ dashboard suy ra từ số dự án được chọn:
  //  0 = tổng hợp TẤT CẢ (mặc định) · 1 = 1 dự án (drill-down như cũ) · ≥2 = so sánh
  const mode = selectedProjects.length >= 2 ? 'compare' : selectedProjects.length === 1 ? 'single' : 'aggregate';
  const singleId = mode === 'single' ? selectedProjects[0] : null;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      if (mode === 'single') {
        const [d, i, c, t] = await Promise.all([
          dashboardApi.get(singleId), itemsApi.getAll(singleId), costLogsApi.getAll(singleId), tasksApi.getAll(singleId),
        ]);
        setData(d); setItems(i); setCostLogs(c); setTasks(t); setAgg(null);
      } else {
        const a = await dashboardApi.aggregate(selectedProjects);
        setAgg(a); setData(null); setItems([]); setCostLogs([]);
        setTasks(a?.aggregate?.tasks || []);
        setFilterPort('all');
      }
    } catch (e) {
      message.error('Không tải được dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  }, [mode, singleId, selectedProjects]);

  // Refetch khi đổi bộ lọc (load thay đổi) và khi tab được focus lại (không polling)
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  // Dữ liệu đã lọc theo Port
  const filtered = useMemo(() => {
    if (filterPort === 'all' || !data) {
      const actualCost = data?.totalLoggedCost || 0;
      const rev = data?.totalRevenue || 0;
      return {
        ports: data?.ports || [],
        totalRevenue: rev,
        totalCost: actualCost,
        totalPlannedCost: data?.totalCost || 0,
        totalProfit: rev - actualCost,
        totalProfitMargin: rev > 0 ? (((rev - actualCost) / rev) * 100).toFixed(1) : 0,
        avgProgress: data?.avgProgress || 0,
        totalItems: data?.totalItems || 0,
        itemsInFab: data?.itemsInFab || 0,
        totalLoggedCost: actualCost,
        openRisks: data?.openRisks || 0,
        highRisks: data?.highRisks || [],
        pendingTasks: data?.pendingTasks || 0,
        overdueTasks: data?.overdueTasks || 0,
        recentCosts: (costLogs || []).slice().reverse().slice(0, 6),
      };
    }
    // Lọc theo 1 port
    const portItems = items.filter((it) => it.port === filterPort);
    const portCosts = (costLogs || []).filter((c) => c.portId === filterPort);
    const revenue = portItems.reduce((s, i) => s + (i.qty || 0) * (i.unitPrice || 0), 0);
    const cost = portCosts.reduce((s, c) => s + (c.amount || 0), 0);
    const profit = revenue - cost;
    const progress = portItems.length > 0 ? Math.round(portItems.reduce((s, i) => s + (i.progress || 0), 0) / portItems.length) : 0;
    const portData = (data.ports || []).find((p) => p.id === filterPort);
    const plannedCost = portItems.reduce((s, i) => s + (i.qty || 0) * costOf(i), 0);
    return {
      ports: portData ? [portData] : [],
      totalRevenue: revenue,
      totalCost: cost,
      totalPlannedCost: plannedCost,
      totalProfit: profit,
      totalProfitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0,
      avgProgress: progress,
      totalItems: portItems.length,
      itemsInFab: portItems.filter((i) => i.status === 'Fabrication').length,
      totalLoggedCost: cost,
      openRisks: data.openRisks,
      highRisks: (data.highRisks || []).filter((r) => r.portId === filterPort || r.portName === filterPort),
      pendingTasks: data.pendingTasks,
      overdueTasks: data.overdueTasks,
      recentCosts: portCosts.slice().reverse().slice(0, 6),
    };
  }, [filterPort, data, items, costLogs]);

  const TASK_STATUS = {
    todo: { label: 'Cần làm', color: '#8c8c8c' },
    inprogress: { label: 'Đang làm', color: '#1677ff' },
    review: { label: 'Kiểm tra', color: '#faad14' },
    done: { label: 'Hoàn thành', color: '#52c41a' },
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const toKey = (d) => {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  };

  const tasksByDate = useMemo(() => {
    const map = {};
    (tasks || []).forEach((t) => {
      if (!t.endDate) return;
      const key = toKey(t.endDate);
      (map[key] = map[key] || []).push(t);
    });
    return map;
  }, [tasks]);

  const upcomingDeadlines = useMemo(() => {
    return (tasks || [])
      .filter((t) => t.status !== 'done' && t.endDate)
      .map((t) => {
        const d = new Date(t.endDate);
        d.setHours(0, 0, 0, 0);
        const days = Math.round((d - today) / 86400000);
        return { ...t, days };
      })
      .sort((a, b) => a.days - b.days)
      .slice(0, 8);
  }, [tasks]);

  if (loading || (!data && !agg)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <Spin size="large" tip="Đang tải dashboard..." />
      </div>
    );
  }

  const A = agg?.aggregate;
  // View KPI thống nhất cho mọi chế độ (single dùng `filtered`, còn lại dùng aggregate).
  const view = mode === 'single' ? filtered : {
    ports: [],
    totalRevenue: A?.totalRevenue || 0,
    totalCost: A?.totalLoggedCost || 0,
    totalPlannedCost: A?.totalCost || 0,
    totalProfit: (A?.totalRevenue || 0) - (A?.totalLoggedCost || 0),
    totalProfitMargin: (A?.totalRevenue || 0) > 0 ? ((((A.totalRevenue - A.totalLoggedCost)) / A.totalRevenue) * 100).toFixed(1) : 0,
    avgProgress: A?.avgProgress || 0,
    totalItems: A?.totalItems || 0,
    itemsInFab: A?.itemsInFab || 0,
    totalLoggedCost: A?.totalLoggedCost || 0,
    openRisks: A?.openRisks || 0,
    highRisks: A?.highRisks || [],
    pendingTasks: A?.pendingTasks || 0,
    overdueTasks: A?.overdueTasks || 0,
    recentCosts: A?.recentCosts || [],
  };

  const progressChartData = mode === 'single'
    ? view.ports.map((p) => ({ name: p.id, 'Tiến độ %': p.progress, 'Chi phí (Tr)': Math.round(p.logged / 1e6) }))
    : (agg?.perProject || []).map((p) => ({ name: p.name, 'Tiến độ %': p.avgProgress, 'Chi phí (Tr)': Math.round((p.totalLoggedCost || 0) / 1e6) }));

  const compareChartData = (agg?.perProject || []).slice(0, 8).map((p) => ({
    name: p.name,
    'Doanh thu': Math.round((p.totalRevenue || 0) / 1e6),
    'Chi phí': Math.round((p.totalLoggedCost || 0) / 1e6),
    'Lợi nhuận': Math.round(((p.totalRevenue || 0) - (p.totalLoggedCost || 0)) / 1e6),
  }));

const taskByStatus = (mode === 'single' ? data?.taskByStatus : A?.taskByStatus) || {};
const taskPieData = [
  { name: 'Cần làm', value: taskByStatus.todo || 0, color: '#8c8c8c' },
  { name: 'Đang làm', value: taskByStatus.inprogress || 0, color: '#1677ff' },
  { name: 'Kiểm tra', value: taskByStatus.review || 0, color: '#faad14' },
  { name: 'Hoàn thành', value: taskByStatus.done || 0, color: '#52c41a' },
].filter((t) => t.value > 0);

  const profitColor = view.totalProfit >= 0 ? '#52c41a' : '#ff4d4f';

  const calendarCellRender = (current) => {
    const key = toKey(current);
    const dayTasks = tasksByDate[key];
    if (!dayTasks || dayTasks.length === 0) return null;
    return (
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {dayTasks.slice(0, 3).map((t) => {
          const overdue = t.status !== 'done' && new Date(t.endDate) < today;
          const color = overdue ? '#ff4d4f' : TASK_STATUS[t.status]?.color || '#1677ff';
          return (
            <li key={t.id} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, lineHeight: '16px' }}>
              <Tooltip title={`${t.title} — ${TASK_STATUS[t.status]?.label || t.status}`}>
                <Badge status={overdue ? 'error' : 'default'} color={color} />
                <span>{t.title}</span>
              </Tooltip>
            </li>
          );
        })}
        {dayTasks.length > 3 && <li style={{ fontSize: 11, color: '#8c8c8c' }}>+{dayTasks.length - 3} khác</li>}
      </ul>
    );
  };

  return (
    <div className="page-container">
      <div className="greeting-banner">
        <div className="greeting-text">
          <div className="greeting-hello">Xin chào, {currentUser?.name || 'Người dùng'}! 👋</div>
          <div className="greeting-sub">Quản lý dự án EPC — theo dõi tiến độ, chi phí và rủi ro trong một nơi.</div>
        </div>
        <Button type="primary" onClick={() => navigate('/projects')}>Xem dự án</Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>📊 Dashboard Tổng quan</Title>
          <Text type="secondary">
            {mode === 'aggregate' && `Tổng hợp ${agg?.projects?.length || 0} dự án — Golden Point Co., Ltd`}
            {mode === 'single' && `${(projects.find((p) => p.id === singleId)?.name) || 'Dự án'} — Golden Point Co., Ltd`}
            {mode === 'compare' && `So sánh ${selectedProjects.length} dự án — Golden Point Co., Ltd`}
          </Text>
        </div>
        <Space wrap>
          <Select
            mode="multiple"
            allowClear
            value={selectedProjects}
            onChange={setSelectedProjects}
            style={{ minWidth: 240 }}
            maxTagCount="responsive"
            placeholder="Tất cả dự án (tổng hợp)"
            options={(projects || []).map((p) => ({ value: p.id, label: p.name }))}
          />
          {mode === 'single' && (
            <Select
              value={filterPort}
              onChange={setFilterPort}
              style={{ width: 180 }}
              suffixIcon={<FilterOutlined />}
              options={[
                { value: 'all', label: 'Tất cả hạng mục' },
                ...(data?.ports || []).map((p) => ({ value: p.id, label: `${p.id} - ${p.description}` })),
              ]}
            />
          )}
          <Button type="primary" icon={<FilePdfOutlined />} onClick={() => navigate('/reports')}>
            Xuất báo cáo
          </Button>
        </Space>
      </div>

      {/* KPI CARDS */}
      <Row gutter={[16, 16]} align="stretch" style={{ marginTop: 24 }}>
        <Col xs={12} md={6}>
          <KpiCard
            icon={<DollarOutlined />}
            iconBg="linear-gradient(135deg,#2F5CE0,#5b82f0)"
            title="Doanh thu hợp đồng"
            value={view.totalRevenue}
            formatter={(v) => fmtShort(v)}
            valueStyle={{ color: '#2F5CE0' }}
            spark={[12, 18, 15, 22, 28, 26, 34]}
            sparkColor="#2F5CE0"
            footer={filterPort === 'all' ? 'Tổng giá trị nhận thầu' : `Giá trị ${filterPort}`}
          />
        </Col>
        <Col xs={12} md={6}>
          <KpiCard
            icon={view.totalProfit >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            iconBg={view.totalProfit >= 0 ? 'linear-gradient(135deg,#1FA971,#3cc995)' : 'linear-gradient(135deg,#EF4444,#ff7875)'}
            title="Lợi nhuận thực tế"
            value={view.totalProfit}
            formatter={(v) => fmtShort(v)}
            valueStyle={{ color: profitColor }}
            suffix={`(${view.totalProfitMargin}%)`}
            spark={[8, 6, 10, 9, 12, 11, 14]}
            sparkColor={profitColor}
            footer="Biên lợi nhuận"
          />
        </Col>
        <Col xs={12} md={6}>
          <KpiCard
            icon={<ExperimentOutlined />}
            iconBg="linear-gradient(135deg,#722ed1,#9254de)"
            title="Tiến độ trung bình"
            value={view.avgProgress}
            formatter={(v) => `${v}%`}
            valueStyle={{ color: '#722ed1' }}
            progress={view.avgProgress}
            footer="Theo Items dự án"
          />
        </Col>
        <Col xs={12} md={6}>
          <KpiCard
            icon={<WarningOutlined />}
            iconBg={view.openRisks > 0 ? 'linear-gradient(135deg,#EF4444,#ff7875)' : 'linear-gradient(135deg,#1FA971,#3cc995)'}
            title="Rủi ro đang mở"
            value={view.openRisks}
            valueStyle={{ color: view.openRisks > 0 ? '#EF4444' : '#1FA971' }}
            spark={[3, 5, 4, 6, 5, 7, view.openRisks || 0]}
            sparkColor="#EF4444"
            footer={`${view.highRisks.length} rủi ro mức cao`}
          />
        </Col>
      </Row>

      {/* SECONDARY STATS */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="Tổng số Items" value={view.totalItems} prefix={<CheckCircleOutlined />} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="Items đang SX" value={view.itemsInFab} valueStyle={{ color: '#1677ff' }} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="Công việc tồn đọng" value={view.pendingTasks} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Công việc quá hạn"
              value={view.overdueTasks}
              valueStyle={{ color: view.overdueTasks > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* CHARTS */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title={mode === 'single' ? 'Tiến độ & Chi phí theo Hạng mục' : 'Tiến độ & Chi phí theo Dự án'} bordered={false} className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={progressChartData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#595959' }} axisLine={{ stroke: '#e8e8e8' }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#595959' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#595959' }} axisLine={false} tickLine={false} />
                <RTooltip
                  cursor={{ fill: 'rgba(22,119,255,0.06)' }}
                  formatter={(v, n) => (n.includes('Chi phí') ? fmtShort(v * 1e6) + ' ₫' : v + '%')}
                  contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar yAxisId="left" dataKey="Tiến độ %" fill="#1677ff" radius={[6, 6, 0, 0]} maxBarSize={36} />
                <Bar yAxisId="right" dataKey="Chi phí (Tr)" fill="#faad14" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Trạng thái công việc" bordered={false} className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={taskPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {taskPieData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                </Pie>
                <RTooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* SO SÁNH DỰ ÁN (Tài chính) */}
      {mode === 'compare' && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24}>
            <Card title="So sánh tài chính giữa các dự án (triệu ₫)" bordered={false} className="chart-container">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={compareChartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#595959' }} axisLine={{ stroke: '#e8e8e8' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#595959' }} axisLine={false} tickLine={false} />
                  <RTooltip
                    cursor={{ fill: 'rgba(22,119,255,0.06)' }}
                    formatter={(v) => `${v} Tr`}
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar dataKey="Doanh thu" fill="#2F5CE0" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Chi phí" fill="#fa8c16" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Lợi nhuận" fill="#1FA971" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}

      {/* DEADLINE CALENDAR + UPCOMING */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="Lịch báo cáo tiến độ (Deadline task)" bordered={false}>
            <Calendar cellRender={(current, info) => (info.type === 'date' ? calendarCellRender(current) : info.originNode)} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Deadline sắp tới" bordered={false}>
            {upcomingDeadlines.length === 0 ? (
              <Text type="secondary">Không có task đến hạn</Text>
            ) : (
              upcomingDeadlines.map((t) => {
                const overdue = t.days < 0;
                const color = overdue ? '#ff4d4f' : TASK_STATUS[t.status]?.color || '#1677ff';
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <Badge status={overdue ? 'error' : 'default'} color={color} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{TASK_STATUS[t.status]?.label || t.status} · {t.owner || 'Chưa gán'}</Text>
                    </div>
                    <Tag color={overdue ? 'error' : 'default'} style={{ marginRight: 0 }}>
                      {overdue ? `Quá hạn ${Math.abs(t.days)} ngày` : t.days === 0 ? 'Hôm nay' : `Còn ${t.days} ngày`}
                    </Tag>
                  </div>
                );
              })
            )}
          </Card>
        </Col>
      </Row>

      {/* PORT TABLE + RISKS + RECENT COSTS */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title={mode === 'single' ? 'Hiệu suất theo Hạng mục' : 'Hiệu suất theo Dự án'} bordered={false}>
            {mode === 'single' ? (
              <Table
                dataSource={view.ports}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  { title: 'Hạng mục', dataIndex: 'id', key: 'id', render: (t, r) => <Tag color={PORT_COLORS[t] || 'blue'}>{t}</Tag> },
                  { title: 'Mô tả', dataIndex: 'description', key: 'desc', ellipsis: true },
                  { title: 'Tiến độ', dataIndex: 'progress', key: 'prog', width: 160, render: (v, r) => <Progress percent={v} size="small" strokeColor={r.color} /> },
                  { title: 'Doanh thu', dataIndex: 'revenue', key: 'rev', align: 'right', width: 130, render: (v) => <Text style={{ fontSize: 13 }}>{fmtShort(v)}</Text> },
                  { title: 'Đã ghi', dataIndex: 'logged', key: 'logged', align: 'right', width: 130, render: (v) => <Text type="secondary" style={{ fontSize: 13 }}>{fmtShort(v)}</Text> },
                  { title: 'Items', dataIndex: 'itemCount', key: 'ic', align: 'center', width: 60 },
                ]}
              />
            ) : (
              <Table
                dataSource={agg?.perProject || []}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  { title: 'Dự án', dataIndex: 'name', key: 'name', ellipsis: true, render: (t, r) => <a onClick={() => setSelectedProjects([r.id])}>{t}</a> },
                  { title: 'Tiến độ', dataIndex: 'avgProgress', key: 'prog', width: 160, render: (v) => <Progress percent={v} size="small" /> },
                  { title: 'Doanh thu', dataIndex: 'totalRevenue', key: 'rev', align: 'right', width: 130, render: (v) => <Text style={{ fontSize: 13 }}>{fmtShort(v)}</Text> },
                  { title: 'Đã ghi', dataIndex: 'totalLoggedCost', key: 'logged', align: 'right', width: 130, render: (v) => <Text type="secondary" style={{ fontSize: 13 }}>{fmtShort(v)}</Text> },
                  { title: 'Items', dataIndex: 'totalItems', key: 'ic', align: 'center', width: 60 },
                ]}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={<span><WarningOutlined style={{ color: '#ff4d4f' }} /> Rủi ro ưu tiên</span>} bordered={false} style={{ marginBottom: 16 }}>
            {view.highRisks.length === 0 ? (
              <Text type="secondary">Không có rủi ro nghiêm trọng</Text>
            ) : (
              view.highRisks.map((r) => {
                const color = r.score >= 15 ? '#ff4d4f' : r.score >= 12 ? '#fa8c16' : '#faad14';
                return (
                  <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ fontSize: 13 }}>{r.title}</Text>
                      <Tag color={color} style={{ marginLeft: 8 }}>{r.score}</Tag>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                      {mode !== 'single' && r.projectName && <Tag color="geekblue" style={{ fontSize: 11, marginRight: 0 }}>{r.projectName}</Tag>}
                      <Tag color={PORT_COLORS[r.portId] || 'blue'} style={{ fontSize: 11, marginRight: 0 }}>{r.portId}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>{r.owner}</Text>
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={14}>
          <Card title="Chi phí gần đây" bordered={false}>
            {view.recentCosts.length === 0 ? (
              <Text type="secondary">Chưa có chi phí nào</Text>
            ) : (
              view.recentCosts.map((c) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div>
                    <Text style={{ fontSize: 13 }}>{c.description}</Text>
                    <div>
                      {mode !== 'single' && c.projectName && <Tag color="geekblue" style={{ fontSize: 11 }}>{c.projectName}</Tag>}
                      <Tag color={PORT_COLORS[c.portId] || 'blue'} style={{ fontSize: 11 }}>{c.portId}</Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>{c.date ? new Date(c.date).toLocaleDateString('vi-VN') : '-'}</Text>
                    </div>
                  </div>
                  <Text strong style={{ color: '#fa541c' }}>{fmtShort(c.amount)}</Text>
                </div>
              ))
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Tóm tắt tài chính" bordered={false}>
            <Statistic title="Doanh thu" value={view.totalRevenue} formatter={(v) => fmtVND(v)} valueStyle={{ color: '#1677ff' }} />
            <Statistic title="Chi phí kế hoạch" value={view.totalPlannedCost} formatter={(v) => fmtVND(v)} style={{ marginTop: 12 }} />
            <Statistic title="Chi phí thực tế" value={view.totalCost} formatter={(v) => fmtVND(v)} valueStyle={{ color: '#fa541c' }} style={{ marginTop: 12 }} />
            <div style={{ marginTop: 16, padding: 12, background: profitColor === '#52c41a' ? '#f6ffed' : '#fff2f0', borderRadius: 8 }}>
              <Statistic title="Lợi nhuận" value={view.totalProfit} formatter={(v) => fmtVND(v)} valueStyle={{ color: profitColor }} />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
