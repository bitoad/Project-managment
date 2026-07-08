import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Tabs,
  Tag,
  Timeline,
  Typography,
  message,
} from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  FileSearchOutlined,
  LineChartOutlined,
  ProjectOutlined,
  ProfileOutlined,
  ReloadOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Items from './Items';
import CostLog from './CostLog';
import Kanban from './Kanban';
import Team from './Team';
import Quotations from './Quotations';
import SCurve from './SCurve';
import { costLogsApi, dashboardApi, itemsApi, portsApi, risksApi, tasksApi, teamApi } from '../api/api.js';
import { fmtShort, costOf } from '../components/helpers.js';
import { useProject } from '../context/ProjectContext.jsx';

const { Title, Text, Paragraph } = Typography;

const DATA_STEPS = [
  {
    key: 'scope',
    title: '1. Khối lượng & phạm vi',
    description: 'Nhập Item Master theo từng Port, số lượng, đơn vị, giá vốn, giá bán và ngày bắt đầu/kết thúc.',
  },
  {
    key: 'schedule',
    title: '2. Tiến độ & công việc',
    description: 'Tạo công việc, người phụ trách, deadline, trạng thái và phần trăm hoàn thành để dashboard phản ánh đúng.',
  },
  {
    key: 'cost',
    title: '3. Chi phí thực tế',
    description: 'Ghi Cost Log theo ngày, Port, Item và loại chi phí để theo dõi ngân sách và lợi nhuận.',
  },
  {
    key: 'risk',
    title: '4. Rủi ro & hành động',
    description: 'Đánh giá rủi ro theo xác suất x tác động, gán owner, hạn xử lý và biện pháp giảm thiểu.',
  },
  {
    key: 'control',
    title: '5. Kiểm soát báo cáo',
    description: 'Cập nhật S-Curve, báo giá, đội dự án và xuất báo cáo định kỳ.',
  },
];

function pct(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export default function DataEntry() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentProject } = useProject();
  const [activeKey, setActiveKey] = useState(searchParams.get('tab') || 'items');
  const [focusedPort, setFocusedPort] = useState(searchParams.get('port') || null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    dashboard: null,
    ports: [],
    items: [],
    tasks: [],
    risks: [],
    team: [],
    costLogs: [],
  });

  const loadSummary = async () => {
    try {
      setLoading(true);
      const [dashboard, ports, items, tasks, risks, team, costLogs] = await Promise.all([
        dashboardApi.get(),
        portsApi.getAll(),
        itemsApi.getAll(),
        tasksApi.getAll(),
        risksApi.getAll(),
        teamApi.getAll(),
        costLogsApi.getAll(),
      ]);
      setSummary({ dashboard, ports, items, tasks, risks, team, costLogs });
    } catch (e) {
      message.error('Không tải được tình trạng dữ liệu dự án');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    setActiveKey(searchParams.get('tab') || 'items');
    setFocusedPort(searchParams.get('port') || null);
  }, [searchParams]);

  const changeTab = (key) => {
    setActiveKey(key);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', key);
    if (focusedPort) nextParams.set('port', focusedPort);
    setSearchParams(nextParams);
  };

  const clearFocusedPort = () => {
    setFocusedPort(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('port');
    setSearchParams(nextParams);
  };

  const dataHealth = useMemo(() => {
    const { ports, items, tasks, risks, team } = summary;
    const portsWithItems = ports.filter((port) => items.some((item) => item.port === port.id || item.portId === port.id)).length;
    const itemsWithDates = items.filter((item) => item.startDate && item.endDate).length;
    const tasksWithOwner = tasks.filter((task) => task.owner && task.endDate).length;
    const openHighRisks = risks.filter((risk) => risk.status === 'open' && (risk.score || 0) >= 12).length;
    const teamReady = team.length > 0 ? 1 : 0;

    const checks = [
      { label: 'Port có item', done: portsWithItems, total: ports.length || 1 },
      { label: 'Item có mốc thời gian', done: itemsWithDates, total: items.length || 1 },
      { label: 'Công việc có owner/deadline', done: tasksWithOwner, total: tasks.length || 1 },
      { label: 'Đã có nhân sự dự án', done: teamReady, total: 1 },
      { label: 'Rủi ro cao đang mở', done: openHighRisks === 0 ? 1 : 0, total: 1, warning: openHighRisks },
    ];

    const score = Math.round(checks.reduce((sum, item) => sum + pct(item.done, item.total), 0) / checks.length);
    return { checks, score, openHighRisks };
  }, [summary]);

  const dashboard = summary.dashboard || {};
  const pendingTasks = dashboard.pendingTasks || 0;
  const overdueTasks = dashboard.overdueTasks || 0;
  const focusedPortItems = focusedPort
    ? summary.items.filter((item) => item.port === focusedPort || item.portId === focusedPort)
    : [];
  const focusedPortCosts = focusedPort
    ? summary.costLogs.filter((log) => log.portId === focusedPort)
    : [];
  const focusedPortPlannedCost = focusedPortItems.reduce((sum, item) => sum + ((item.qty || 0) * costOf(item)), 0);
  const focusedPortRevenue = focusedPortItems.reduce((sum, item) => sum + ((item.qty || 0) * (item.unitPrice || 0)), 0);
  const focusedPortActualCost = focusedPortCosts.reduce((sum, log) => sum + (log.amount || 0), 0);

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            <ProjectOutlined /> Trung tâm nhập liệu dự án
          </Title>
          <Text type="secondary">
            Nhập, kiểm tra và cập nhật dữ liệu vận hành cho {currentProject?.name || 'dự án hiện tại'}.
          </Text>
        </div>
        <Space wrap>
          <Button icon={<WarningOutlined />} onClick={() => navigate('/risks')}>
            Ma trận rủi ro
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadSummary} loading={loading}>
            Tải lại
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} md={12} xl={6}>
          <Card size="small" className="stat-card">
            <Statistic title="Độ đầy đủ dữ liệu" value={dataHealth.score} suffix="%" prefix={<CheckCircleOutlined />} />
            <Progress percent={dataHealth.score} size="small" status={dataHealth.score < 70 ? 'exception' : 'active'} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card size="small" className="stat-card">
            <Statistic title="Item Master" value={summary.items.length} prefix={<ProfileOutlined />} />
            <Text type="secondary">{summary.ports.length} Port đang quản lý</Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card size="small" className="stat-card">
            <Statistic title="Doanh thu dự kiến" value={fmtShort(dashboard.totalRevenue || 0)} prefix={<DollarOutlined />} />
            <Text type="secondary">Chi phí: {fmtShort(dashboard.totalCost || 0)}</Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card size="small" className="stat-card">
            <Statistic title="Việc chờ / quá hạn" value={`${pendingTasks} / ${overdueTasks}`} prefix={<UnorderedListOutlined />} />
            <Text type={overdueTasks > 0 ? 'danger' : 'secondary'}>
              {overdueTasks > 0 ? 'Cần xử lý deadline' : 'Không có việc quá hạn'}
            </Text>
          </Card>
        </Col>
      </Row>

      {focusedPort && (
        <Alert
          style={{ marginTop: 16 }}
          type="info"
          showIcon
          message={`Đang quản lý dữ liệu cho ${focusedPort}`}
          description={
            <Space wrap>
              <Tag color="blue">{focusedPortItems.length} item</Tag>
              <Tag color="orange">Chi phí kế hoạch: {fmtShort(focusedPortPlannedCost)}</Tag>
              <Tag color="red">Chi phí thực tế: {fmtShort(focusedPortActualCost)}</Tag>
              <Tag color="green">Doanh thu dự kiến: {fmtShort(focusedPortRevenue)}</Tag>
            </Space>
          }
          action={<Button size="small" onClick={clearFocusedPort}>Xem tất cả Port</Button>}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={14}>
          <Card title="Tình trạng dữ liệu nhập">
            <Row gutter={[12, 12]}>
              {dataHealth.checks.map((item) => {
                const percent = pct(item.done, item.total);
                return (
                  <Col xs={24} sm={12} key={item.label}>
                    <Card size="small" styles={{ body: { padding: 12 } }}>
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                          <Text strong>{item.label}</Text>
                          {item.warning ? <Tag color="red">{item.warning} cần xử lý</Tag> : <Tag>{item.done}/{item.total}</Tag>}
                        </Space>
                        <Progress percent={percent} size="small" status={item.warning ? 'exception' : undefined} />
                      </Space>
                    </Card>
                  </Col>
                );
              })}
            </Row>
            {dataHealth.score < 70 && (
              <Alert
                style={{ marginTop: 16 }}
                type="warning"
                showIcon
                message="Dữ liệu dự án chưa đủ tin cậy"
                description="Hãy ưu tiên nhập đầy đủ Item Master, deadline công việc, owner và xử lý các rủi ro cao trước khi dùng báo cáo quản trị."
              />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Quy trình nhập chuẩn">
            <Timeline
              items={DATA_STEPS.map((step) => ({
                color: 'blue',
                children: (
                  <div>
                    <Text strong>{step.title}</Text>
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                      {step.description}
                    </Paragraph>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }} styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeKey}
          onChange={changeTab}
          type="card"
          tabBarStyle={{ margin: 0, padding: '12px 12px 0' }}
          items={[
            {
              label: <span><ProfileOutlined /> Item Master</span>,
              key: 'items',
              children: <Items initialPortFilter={focusedPort} />,
            },
            {
              label: <span><DollarOutlined /> Cost Log</span>,
              key: 'costs',
              children: <CostLog initialPortFilter={focusedPort} />,
            },
            {
              label: <span><UnorderedListOutlined /> Công việc</span>,
              key: 'tasks',
              children: <Kanban />,
            },
            {
              label: <span><TeamOutlined /> Nhân sự</span>,
              key: 'team',
              children: <Team />,
            },
            {
              label: <span><FileSearchOutlined /> Báo giá</span>,
              key: 'quotes',
              children: <Quotations />,
            },
            {
              label: <span><LineChartOutlined /> S-Curve</span>,
              key: 'curve',
              children: <SCurve />,
            },
            {
              label: <span><BarChartOutlined /> Kiểm soát rủi ro</span>,
              key: 'risks',
              children: (
                <div style={{ padding: 24 }}>
                  <Alert
                    type="info"
                    showIcon
                    message="Rủi ro được quản lý ở màn riêng để có ma trận, bộ lọc và action plan đầy đủ."
                    action={<Button type="primary" onClick={() => navigate('/risks')}>Mở ma trận rủi ro</Button>}
                  />
                </div>
              ),
            },
            {
              label: <span><AppstoreOutlined /> Ports</span>,
              key: 'ports',
              children: (
                <div style={{ padding: 24 }}>
                  <Alert
                    type="success"
                    showIcon
                    message="Hạng mục Port đã có màn tổng quan riêng với deadline, nhà cung cấp và lịch sử hoạt động."
                    action={<Button onClick={() => navigate('/ports')}>Mở trang Ports</Button>}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
