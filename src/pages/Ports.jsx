import React, { useMemo, useState, useEffect } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Timeline,
  Typography,
  message,
} from 'antd';
import {
  AppstoreOutlined,
  CalendarOutlined,
  ClearOutlined,
  DollarOutlined,
  DownOutlined,
  FileDoneOutlined,
  ProfileOutlined,
  SearchOutlined,
  ShopOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { costLogsApi, itemsApi, portsApi, supplierPortsApi, suppliersApi, tasksApi } from '../api/api.js';
import { fmtDate, fmtShort, fmtVND, PORT_COLORS, statusColor } from '../components/helpers.js';

const { Title, Text } = Typography;

const STATUS_LABELS = {
  Engineering: 'Engineering',
  Approved: 'Approved',
  Procurement: 'Procurement',
  Fabrication: 'Fabrication',
  Delivery: 'Delivery',
  Installation: 'Installation',
  Completed: 'Completed',
};

const TASK_STATUS_LABELS = {
  todo: 'Chưa bắt đầu',
  inprogress: 'Đang làm',
  review: 'Đang duyệt',
  done: 'Hoàn thành',
};

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function getDaysUntil(dateValue) {
  if (!dateValue) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateValue);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function getPortDeadline(port, portItems, portTasks) {
  if (port.deadline) return port.deadline;
  const dates = [...portItems.map((item) => item.endDate), ...portTasks.map((task) => task.endDate)]
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a));
  return dates[0] || null;
}

function getDeadlineState(deadline, progress) {
  const days = getDaysUntil(deadline);
  if (days === null || progress >= 100) return { days, type: 'default', label: null };
  if (days < 0) return { days, type: 'error', label: `Quá hạn ${Math.abs(days)} ngày` };
  if (days <= 7) return { days, type: 'warning', label: `Còn ${days} ngày` };
  return { days, type: 'success', label: null };
}

function buildHistory(port, portItems, portTasks, portSupplierPorts, suppliersById) {
  if (Array.isArray(port.history) && port.history.length > 0) {
    return port.history.map((item) => ({
      date: item.date,
      text: item.text,
      color: 'blue',
    }));
  }

  const supplierEvents = portSupplierPorts.map((sp) => {
    const supplierName = suppliersById.get(sp.supplierId)?.name;
    return {
      date: sp.updatedAt || sp.createdAt || null,
      text: `Nhà cung cấp: ${supplierName || sp.supplierId || 'N/A'} - ${sp.role || 'Chưa phân vai trò'}`,
      color: sp.status === 'in-progress' ? 'green' : 'blue',
    };
  });

  const taskEvents = portTasks
    .slice()
    .sort((a, b) => new Date(b.endDate || 0) - new Date(a.endDate || 0))
    .slice(0, 4)
    .map((task) => ({
      date: task.endDate,
      text: `${task.title} - ${TASK_STATUS_LABELS[task.status] || task.status || 'N/A'} (${task.progress || 0}%)`,
      color: task.status === 'done' ? 'green' : task.priority === 'high' ? 'red' : 'blue',
    }));

  const itemEvents = portItems
    .slice()
    .sort((a, b) => new Date(b.endDate || 0) - new Date(a.endDate || 0))
    .slice(0, 3)
    .map((item) => ({
      date: item.endDate,
      text: `${item.code} - ${item.name}: ${item.status || 'N/A'} (${item.progress || 0}%)`,
      color: 'gray',
    }));

  return [
    {
      date: null,
      text: `Trạng thái port: ${port.status || 'N/A'} - tiến độ ${port.progress || 0}%`,
      color: 'blue',
    },
    ...supplierEvents,
    ...taskEvents,
    ...itemEvents,
  ];
}

function getPortManageUrl(portId, tab = 'items') {
  return `/data-entry?tab=${tab}&port=${encodeURIComponent(portId)}`;
}

export default function Ports() {
  const navigate = useNavigate();
  const [ports, setPorts] = useState([]);
  const [supplierPorts, setSupplierPorts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [costLogs, setCostLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState();
  const [supplierFilter, setSupplierFilter] = useState();

  const load = async () => {
    try {
      setLoading(true);
      const [p, sp, sup, itemList, taskList, logList] = await Promise.all([
        portsApi.getAll(),
        supplierPortsApi.getAll(),
        suppliersApi.getAll(),
        itemsApi.getAll(),
        tasksApi.getAll(),
        costLogsApi.getAll(),
      ]);
      setPorts(p);
      setSupplierPorts(sp);
      setSuppliers(sup);
      setItems(itemList);
      setTasks(taskList);
      setCostLogs(logList);
    } catch (e) {
      message.error('Không tải được danh sách Port');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const suppliersById = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier])), [suppliers]);

  const enrichedPorts = useMemo(() => {
    return ports.map((port) => {
      const portItems = items.filter((item) => item.port === port.id || item.portId === port.id);
      const portTasks = tasks.filter((task) => task.portId === port.id);
      const portCostLogs = costLogs.filter((log) => log.portId === port.id);
      const portSupplierPorts = supplierPorts.filter((sp) => sp.portId === port.id);
      const deadline = getPortDeadline(port, portItems, portTasks);
      const deadlineState = getDeadlineState(deadline, port.progress || 0);
      const plannedCost = portItems.reduce((sum, item) => sum + ((item.qty || 0) * (item.unitCost || 0)), 0);
      const plannedRevenue = portItems.reduce((sum, item) => sum + ((item.qty || 0) * (item.unitPrice || 0)), 0);
      const actualCost = portCostLogs.reduce((sum, log) => sum + (log.amount || 0), 0);
      const suppliersForPort = portSupplierPorts.map((sp) => ({
        ...sp,
        supplier: suppliersById.get(sp.supplierId),
      }));

      return {
        ...port,
        deadline,
        deadlineState,
        suppliersForPort,
        itemCount: portItems.length,
        taskCount: portTasks.length,
        plannedCost,
        plannedRevenue,
        actualCost,
        history: buildHistory(port, portItems, portTasks, portSupplierPorts, suppliersById),
      };
    });
  }, [costLogs, items, ports, supplierPorts, suppliersById, tasks]);

  const supplierOptions = useMemo(() => {
    const optionMap = new Map();
    enrichedPorts.forEach((port) => {
      port.suppliersForPort.forEach((sp) => {
        const supplierName = sp.supplier?.name || sp.supplierId || sp.role;
        if (supplierName) optionMap.set(supplierName, supplierName);
        if (sp.role) optionMap.set(sp.role, sp.role);
      });
    });
    return [...optionMap.values()].map((value) => ({ value, label: value }));
  }, [enrichedPorts]);

  const filteredPorts = useMemo(() => {
    const q = normalizeText(search);
    return enrichedPorts.filter((port) => {
      const supplierTexts = port.suppliersForPort.flatMap((sp) => [sp.role, sp.supplier?.name, sp.supplierId]);
      const matchesSearch = !q || [port.id, port.name, port.description, port.status, ...supplierTexts]
        .some((field) => normalizeText(field).includes(q));
      const matchesStatus = !statusFilter || port.status === statusFilter;
      const matchesSupplier = !supplierFilter || supplierTexts.some((field) => field === supplierFilter);
      return matchesSearch && matchesStatus && matchesSupplier;
    });
  }, [enrichedPorts, search, statusFilter, supplierFilter]);

  const stats = useMemo(() => {
    const totalValue = enrichedPorts.reduce((sum, port) => sum + (port.contractValue || 0), 0);
    return {
      total: enrichedPorts.length,
      signed: enrichedPorts.filter((port) => port.contractValue > 0).length,
      totalValue,
      overdue: enrichedPorts.filter((port) => port.deadlineState.type === 'error').length,
    };
  }, [enrichedPorts]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter(undefined);
    setSupplierFilter(undefined);
  };

  return (
    <div className="page-container">
      <Title level={3} style={{ marginBottom: 4 }}>
        <AppstoreOutlined /> Quản lý Hạng mục (Ports)
      </Title>
      <Text type="secondary">
        {stats.total} hạng mục - Hợp đồng Golden Point x PTSC M&C (via Hà Quang)
      </Text>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="stat-card">
            <Statistic title="Tổng số Port" value={stats.total} prefix={<AppstoreOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="stat-card">
            <Statistic
              title="Đã ký hợp đồng"
              value={stats.signed}
              prefix={<FileDoneOutlined />}
              valueStyle={{ color: '#22a35d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="stat-card">
            <Statistic title="Tổng giá trị HĐ" value={fmtShort(stats.totalValue)} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="stat-card">
            <Statistic
              title="Quá hạn"
              value={stats.overdue}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#d64545' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }} styles={{ body: { padding: 16 } }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Tìm theo port, mô tả, nhà cung cấp..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ width: 320 }}
            />
            <Select
              allowClear
              placeholder="Tất cả trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 190 }}
              options={[...new Set(enrichedPorts.map((port) => port.status).filter(Boolean))]
                .map((status) => ({ value: status, label: STATUS_LABELS[status] || status }))}
            />
            <Select
              allowClear
              showSearch
              placeholder="Tất cả nhà cung cấp"
              value={supplierFilter}
              onChange={setSupplierFilter}
              style={{ width: 240 }}
              optionFilterProp="label"
              options={supplierOptions}
            />
            <Button icon={<ClearOutlined />} onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          </Space>
          <Text type="secondary">
            Hiển thị {filteredPorts.length} / {enrichedPorts.length} port
          </Text>
        </Space>
      </Card>

      <Card title="Danh sách Port" style={{ marginTop: 16 }}>
        <Table
          dataSource={filteredPorts}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 1180 }}
          locale={{ emptyText: <Empty description="Không tìm thấy port phù hợp với bộ lọc" /> }}
          expandable={{
            expandIcon: ({ expanded, onExpand, record }) => (
              <DownOutlined
                rotate={expanded ? 180 : 0}
                onClick={(event) => onExpand(record, event)}
                style={{ color: '#8c8c8c', cursor: 'pointer' }}
              />
            ),
            expandedRowRender: (record) => (
              <div style={{ padding: '8px 8px 2px 8px' }}>
                <Text strong>Lịch sử hoạt động - {record.id}</Text>
                <Timeline
                  style={{ marginTop: 16, marginBottom: 0 }}
                  items={record.history.map((item, index) => ({
                    key: `${record.id}-${index}`,
                    color: item.color,
                    children: (
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.date ? fmtDate(item.date) : 'Cập nhật hiện tại'}
                        </Text>
                        <div>{item.text}</div>
                      </div>
                    ),
                  }))}
                />
              </div>
            ),
          }}
          columns={[
            {
              title: 'Port',
              dataIndex: 'id',
              key: 'id',
              width: 110,
              render: (id, record) => (
                <Button
                  type="link"
                  onClick={() => navigate(getPortManageUrl(id))}
                  style={{ padding: 0, height: 'auto' }}
                >
                  <Tag color={record.color || PORT_COLORS[id] || 'blue'} style={{ fontWeight: 700, marginInlineEnd: 0 }}>
                    {id}
                  </Tag>
                </Button>
              ),
            },
            {
              title: 'Mô tả',
              dataIndex: 'description',
              key: 'description',
              width: 260,
              render: (value, record) => (
                <div>
                  <Text strong>{value}</Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {record.itemCount} item - {record.taskCount} công việc
                    </Text>
                  </div>
                </div>
              ),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              key: 'status',
              width: 140,
              render: (status) => <Tag color={statusColor[status] || 'default'}>{STATUS_LABELS[status] || status}</Tag>,
            },
            {
              title: 'Tiến độ',
              dataIndex: 'progress',
              key: 'progress',
              width: 190,
              render: (value, record) => (
                <Progress percent={value || 0} size="small" strokeColor={record.color || PORT_COLORS[record.id]} />
              ),
            },
            {
              title: 'Deadline',
              dataIndex: 'deadline',
              key: 'deadline',
              width: 190,
              render: (deadline, record) => {
                if (!deadline) return <Text type="secondary">-</Text>;
                const badgeStatus = record.deadlineState.type === 'error'
                  ? 'error'
                  : record.deadlineState.type === 'warning'
                    ? 'warning'
                    : 'default';
                return (
                  <Space direction="vertical" size={2}>
                    <Text>
                      <CalendarOutlined /> {fmtDate(deadline)}
                    </Text>
                    {record.deadlineState.label && (
                      <Badge status={badgeStatus} text={record.deadlineState.label} />
                    )}
                  </Space>
                );
              },
            },
            {
              title: 'Giá trị HĐ',
              dataIndex: 'contractValue',
              key: 'contractValue',
              width: 150,
              align: 'right',
              render: (value) => (value > 0 ? <Text strong>{fmtVND(value)}</Text> : <Text type="secondary">Chưa ký</Text>),
            },
            {
              title: 'Nhà cung cấp',
              key: 'suppliers',
              width: 310,
              render: (_, record) => {
                if (record.suppliersForPort.length === 0) return <Text type="secondary">-</Text>;
                return (
                  <Space size={[4, 4]} wrap>
                    {record.suppliersForPort.map((sp) => (
                      <Tag key={sp.id} icon={<ShopOutlined />} style={{ marginInlineEnd: 0 }}>
                        {sp.role || sp.supplier?.name || sp.supplierId}
                      </Tag>
                    ))}
                  </Space>
                );
              },
            },
            {
              title: 'Tổng chi phí',
              key: 'costs',
              width: 190,
              align: 'right',
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{fmtShort(record.actualCost || record.plannedCost)}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    KH: {fmtShort(record.plannedCost)} / DT: {fmtShort(record.plannedRevenue)}
                  </Text>
                </Space>
              ),
            },
            {
              title: 'Quản lý',
              key: 'manage',
              width: 180,
              fixed: 'right',
              render: (_, record) => (
                <Space>
                  <Button size="small" icon={<ProfileOutlined />} onClick={() => navigate(getPortManageUrl(record.id, 'items'))}>
                    Item
                  </Button>
                  <Button size="small" icon={<DollarOutlined />} onClick={() => navigate(getPortManageUrl(record.id, 'costs'))}>
                    Chi phí
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
