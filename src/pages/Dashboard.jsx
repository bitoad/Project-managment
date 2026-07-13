import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Row, Col, Card, Statistic, Progress, Table, Tag, Spin, message, Typography, Button, Select, Space, Calendar, Badge, Tooltip,
} from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined, DollarOutlined,
  ExperimentOutlined, WarningOutlined, ClockCircleOutlined,
  FilePdfOutlined, FilterOutlined,
} from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, Legend,
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

const KpiCard = ({ icon, iconBg, title, value, valueStyle, formatter, suffix, progress, footer, extra }) => (
  <Card className="stat-card stat-card-accent" bordered={false} style={{ height: '100%' }}>
    <div className="kpi-card-body">
      <div className="kpi-icon" style={{ background: iconBg }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Statistic title={title} value={value} formatter={formatter} suffix={suffix} valueStyle={valueStyle} />
        {progress != null && (
          <Progress percent={progress} showInfo={false} size="small" strokeColor={valueStyle?.color || '#2F5CE0'} style={{ marginTop: 4 }} />
        )}
        {extra && <div style={{ marginTop: 4 }}>{extra}</div>}
        {footer && <div className="stat-label">{footer}</div>}
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

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const filtered = useMemo(() => {
    if (filterPort === 'all' || !data) {
      const actualCost = data?.totalLoggedCost || 0;
      const rev = data?.totalRevenue || 0;
      return {
        ports: data?.ports || [],
        totalRevenue: rev, totalCost: actualCost,
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
      totalRevenue: revenue, totalCost: cost, totalPlannedCost: plannedCost,
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
        return { ...t, days: Math.round((d - today) / 86400000) };
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
  const view = mode === 'single' ? filtered : {
    ports: [],
    totalRevenue: A?.totalRevenue || 0,
    totalCost: A?.totalLoggedCost || 0,
    totalPlannedCost: A?.totalCost || 0,
    totalProfit: (A?.totalRevenue || 0) - (A?.totalLoggedCost || 0),
    totalProfitMargin: (A?.totalRevenue || 0) > 0 ? (((A.totalRevenue - A.totalLoggedCost) / A.totalRevenue) * 100).toFixed(1) : 0,
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
    ? view.ports.map((p) => ({ name: p.id, 'Tiến độ': p.progress, 'Chi phí': Math.round(p.logged / 1e6) }))
    : (agg?.perProject || []).map((p) => ({ name: p.name.length > 12 ? p.name.slice(0, 12) + '...' : p.name, 'Tiến độ': p.avgProgress, 'Chi phí': Math.round((p.totalLoggedCost || 0) / 1e6) }));

  const compareChartData = (agg?.perProject || []).slice(0, 10).map((p) => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + '...' : p.name,
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
        {dayTasks.slice(0, 2).map((t) => {
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
        {dayTasks.length > 2 && <li style={{ fontSize: 11, color: '#8c8c8c' }}>+{dayTasks.length - 2} khác</li>}
      </ul>
    );
  };

  return (
    <div className="page-container" style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ marginBottom: 2 }}>
            Dashboard Tổng quan
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {mode === 'aggregate' && `Tổng hợp ${agg?.projects?.length || 0} dự án`}
            {mode === 'single' && `${(projects.find((p) => p.id === singleId)?.name) || 'Dự án'}`}
            {mode === 'compare' && `So sánh ${selectedProjects.length} dự án`}
          </Text>
        </div>
        <Space wrap size={8}>
          <Select
            mode="multiple" allowClear
            value={selectedProjects} onChange={setSelectedProjects}
            style={{ minWidth: 220 }} maxTagCount="responsive"
            placeholder="Tất cả dự án"
            options={(projects || []).map((p) => ({ value: p.id, label: p.name }))}
          />
          {mode === 'single' && (
            <Select
              value={filterPort} onChange={setFilterPort}
              style={{ width: 160 }} suffixIcon={<FilterOutlined />}
              options={[
                { value: 'all', label: 'Tất cả HP' },
                ...(data?.ports || []).map((p) => ({ value: p.id, label: p.id })),
              ]}
            />
          )}
          <Button icon={<FilePdfOutlined />} onClick={() => navigate('/reports')}>Báo cáo</Button>
        </Space>
      </div>

      {/* ROW 1: KPI CARDS — clean, no sparklines */}
      <Row gutter={[16, 16]} align="stretch">
        <Col xs={12} md={6}>
          <KpiCard
            icon={<DollarOutlined />}
            iconBg="linear-gradient(135deg,#2F5CE0,#5b82f0)"
            title="Doanh thu hợp đồng"
            value={view.totalRevenue}
            formatter={(v) => fmtShort(v)}
            valueStyle={{ color: '#2F5CE0' }}
            footer={<>{view.totalItems} items · {view.itemsInFab} đang SX</>}
          />
        </Col>
        <Col xs={12} md={6}>
          <KpiCard
            icon={view.totalProfit >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            iconBg={view.totalProfit >= 0 ? 'linear-gradient(135deg,#1FA971,#3cc995)' : 'linear-gradient(135deg,#EF4444,#ff7875)'}
            title="Lợi nhuận"
            value={view.totalProfit}
            formatter={(v) => fmtShort(v)}
            valueStyle={{ color: profitColor }}
            suffix={`(${view.totalProfitMargin}%)`}
            footer={<>{fmtVND(view.totalLoggedCost)} đã ghi nhận</>}
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
            footer={mode === 'single' ? 'Simple average' : 'Weighted theo GT HĐ'}
          />
        </Col>
        <Col xs={12} md={6}>
          <KpiCard
            icon={<WarningOutlined />}
            iconBg={view.openRisks > 0 ? 'linear-gradient(135deg,#EF4444,#ff7875)' : 'linear-gradient(135deg,#1FA971,#3cc995)'}
            title="Rủi ro đang mở"
            value={view.openRisks}
            valueStyle={{ color: view.openRisks > 0 ? '#EF4444' : '#1FA971' }}
            footer={
              <span>
                {view.highRisks.length} cao ·{' '}
                <span style={{ color: view.overdueTasks > 0 ? '#ff4d4f' : '#52c41a' }}>{view.overdueTasks} quá hạn</span>
              </span>
            }
          />
        </Col>
      </Row>

      {/* ROW 2: CHARTS — bar + donut, cleaner */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card bordered={false} title={mode === 'single' ? 'Theo Hạng mục' : 'Theo Dự án'} styles={{ body: { padding: '8px 16px 16px' } }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={progressChartData} barGap={4}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8c8c8c' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#8c8c8c' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#8c8c8c' }} axisLine={false} tickLine={false} />
                <RTooltip
                  cursor={{ fill: 'rgba(47,92,224,0.06)' }}
                  formatter={(v, n) => (n === 'Chi phí' ? fmtShort(v * 1e6) + ' ₫' : v + '%')}
                  contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="Tiến độ" fill="#2F5CE0" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar yAxisId="right" dataKey="Chi phí" fill="#faad14" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card bordered={false} title="Công việc" styles={{ body: { padding: '8px 16px 16px' } }}>
            {taskPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={taskPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                    {taskPieData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                  <RTooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text type="secondary">Chưa có công việc</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* SO SÁNH (compare mode) */}
      {mode === 'compare' && (
        <Card bordered={false} title="So sánh tài chính (triệu ₫)" style={{ marginTop: 16 }} styles={{ body: { padding: '8px 16px 16px' } }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={compareChartData} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8c8c8c' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8c8c8c' }} axisLine={false} tickLine={false} />
              <RTooltip cursor={{ fill: 'rgba(47,92,224,0.06)' }} formatter={(v) => `${v} Tr`} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Doanh thu" fill="#2F5CE0" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="Chi phí" fill="#fa8c16" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="Lợi nhuận" fill="#1FA971" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ROW 3: CALENDAR (chủ đạo) + DEADLINE LIST */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card bordered={false} title="Lịch báo cáo tiến độ" styles={{ body: { padding: '4px 8px 8px' } }}>
            <Calendar
              cellRender={(current, info) => (info.type === 'date' ? calendarCellRender(current) : info.originNode)}
              style={{ fontSize: 12 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} title="Deadline sắp tới" styles={{ body: { padding: '8px 16px' } }} style={{ marginBottom: 16 }}>
            {upcomingDeadlines.length === 0 ? (
              <Text type="secondary" style={{ fontSize: 13 }}>Không có task đến hạn</Text>
            ) : (
              upcomingDeadlines.map((t) => {
                const overdue = t.days < 0;
                const color = overdue ? '#ff4d4f' : TASK_STATUS[t.status]?.color || '#1677ff';
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <Badge status={overdue ? 'error' : 'default'} color={color} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                      <Text type="secondary" style={{ fontSize: 11 }}>{t.owner || 'Chưa gán'}</Text>
                    </div>
                    <Tag color={overdue ? 'error' : 'default'} style={{ margin: 0, fontSize: 11 }}>
                      {overdue ? `Quá hạn ${Math.abs(t.days)}d` : t.days === 0 ? 'Hôm nay' : `Còn ${t.days}d`}
                    </Tag>
                  </div>
                );
              })
            )}
          </Card>

          {/* RỦI RO ƯU TIÊN */}
          <Card bordered={false} title={<span><WarningOutlined style={{ color: '#ff4d4f' }} /> Rủi ro cao</span>} styles={{ body: { padding: '8px 16px' } }}>
            {view.highRisks.length === 0 ? (
              <Text type="secondary" style={{ fontSize: 13 }}>Không có rủi ro nghiêm trọng</Text>
            ) : (
              view.highRisks.slice(0, 5).map((r) => {
                const color = r.score >= 15 ? '#ff4d4f' : r.score >= 12 ? '#fa8c16' : '#faad14';
                return (
                  <div key={r.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</Text>
                      <Tag color={color} style={{ marginLeft: 8, flexShrink: 0 }}>{r.score}</Tag>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', marginTop: 2 }}>
                      {mode !== 'single' && r.projectName && <Tag color="geekblue" style={{ fontSize: 11, margin: 0 }}>{r.projectName}</Tag>}
                      <Tag color={PORT_COLORS[r.portId] || 'blue'} style={{ fontSize: 11, margin: 0 }}>{r.portId}</Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>{r.owner}</Text>
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </Col>
      </Row>

      {/* ROW 4: PERFORMANCE TABLE + CHI PHÍ GẦN ĐÂY */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card bordered={false} title={mode === 'single' ? 'Hiệu suất theo Hạng mục' : 'Hiệu suất theo Dự án'}>
            {mode === 'single' ? (
              <Table
                dataSource={view.ports} rowKey="id" size="small" pagination={false}
                columns={[
                  { title: 'HP', dataIndex: 'id', key: 'id', render: (t) => <Tag color={PORT_COLORS[t] || 'blue'}>{t}</Tag> },
                  { title: 'Mô tả', dataIndex: 'description', key: 'desc', ellipsis: true },
                  { title: 'Tiến độ', dataIndex: 'progress', key: 'prog', width: 140, render: (v, r) => <Progress percent={v} size="small" strokeColor={r.color} /> },
                  { title: 'Doanh thu', dataIndex: 'revenue', key: 'rev', align: 'right', width: 120, render: (v) => fmtShort(v) },
                  { title: 'Đã ghi', dataIndex: 'logged', key: 'logged', align: 'right', width: 120, render: (v) => <Text type="secondary">{fmtShort(v)}</Text> },
                  { title: 'Items', dataIndex: 'itemCount', key: 'ic', align: 'center', width: 50 },
                ]}
              />
            ) : (
              <Table
                dataSource={agg?.perProject || []} rowKey="id" size="small" pagination={false}
                columns={[
                  { title: 'Dự án', dataIndex: 'name', key: 'name', ellipsis: true, render: (t, r) => <a onClick={() => setSelectedProjects([r.id])}>{t}</a> },
                  { title: 'Tiến độ', dataIndex: 'avgProgress', key: 'prog', width: 140, render: (v) => <Progress percent={v} size="small" /> },
                  { title: 'Doanh thu', dataIndex: 'totalRevenue', key: 'rev', align: 'right', width: 120, render: (v) => fmtShort(v) },
                  { title: 'Đã ghi', dataIndex: 'totalLoggedCost', key: 'logged', align: 'right', width: 120, render: (v) => <Text type="secondary">{fmtShort(v)}</Text> },
                  { title: 'Items', dataIndex: 'totalItems', key: 'ic', align: 'center', width: 50 },
                ]}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} title="Chi phí gần đây" styles={{ body: { padding: '8px 16px' } }}>
            {view.recentCosts.length === 0 ? (
              <Text type="secondary" style={{ fontSize: 13 }}>Chưa có chi phí</Text>
            ) : (
              view.recentCosts.map((c) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 2 }}>
                      {mode !== 'single' && c.projectName && <Tag color="geekblue" style={{ fontSize: 11, margin: 0 }}>{c.projectName}</Tag>}
                      <Tag color={PORT_COLORS[c.portId] || 'blue'} style={{ fontSize: 11, margin: 0 }}>{c.portId}</Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>{c.date ? new Date(c.date).toLocaleDateString('vi-VN') : '-'}</Text>
                    </div>
                  </div>
                  <Text strong style={{ color: '#fa541c', flexShrink: 0, marginLeft: 8 }}>{fmtShort(c.amount)}</Text>
                </div>
              ))
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
