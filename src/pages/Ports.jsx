import React, { useMemo, useState, useEffect } from 'react';
import {
  Badge,
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
  Select,
  Space,
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
  DeleteOutlined,
  DollarOutlined,
  DownOutlined,
  EditOutlined,
  FileDoneOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  ProfileOutlined,
  SearchOutlined,
  ShopOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { costLogsApi, itemsApi, portsApi, supplierPortsApi, suppliersApi, tasksApi } from '../api/api.js';
import { useProject } from '../context/ProjectContext.jsx';
import { fmtDate, fmtVND, PORT_COLORS, statusColor, STATUS_LIST } from '../components/helpers.js';
import { sumRevenue, sumPlannedCost, sumActualCost, sumContractValue } from '../../shared/formulas.js';
import StatCard from '../components/StatCard.jsx';

const { Text } = Typography;

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
  const { currentProjectId, portfolioView } = useProject();
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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingPort, setEditingPort] = useState(null);
  const [form] = Form.useForm();

  const load = async () => {
    try {
      setLoading(true);
      const [p, sp, sup, itemList, taskList, logList] = await Promise.all([
        portsApi.getAll(currentProjectId, portfolioView),
        supplierPortsApi.getAll(currentProjectId, portfolioView),
        suppliersApi.getAll(currentProjectId, portfolioView),
        itemsApi.getAll(currentProjectId, portfolioView),
        tasksApi.getAll(currentProjectId, portfolioView),
        costLogsApi.getAll(currentProjectId, portfolioView),
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
  }, [currentProjectId, portfolioView]);

  const openAdd = () => {
    setModalMode('add');
    setEditingPort(null);
    form.resetFields();
    form.setFieldsValue({ id: 'PORT ' + (ports.length + 1), status: 'Engineering', progress: 0 });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setModalMode('edit');
    setEditingPort(record);
    form.resetFields();
    form.setFieldsValue({ ...record });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    try {
      const v = await form.validateFields();
      if (modalMode === 'add') {
        const created = await portsApi.create(v);
        setPorts((prev) => [...prev, created]);
        message.success('Đã thêm Port');
      } else {
        const updated = await portsApi.update(editingPort.id, v);
        setPorts((prev) => prev.map((p) => (p.id === editingPort.id ? updated : p)));
        message.success('Đã cập nhật Port');
      }
      setModalOpen(false);
    } catch (e) {
      if (e?.errorFields) return;
      message.error('Lỗi khi lưu');
    }
  };

  const onDelete = async (record) => {
    try {
      await portsApi.remove(record.id);
      setPorts((prev) => prev.filter((p) => p.id !== record.id));
      message.success(`Đã xóa Port ${record.id}`);
    } catch (e) {
      const status = e?.response?.status;
      const details = e?.response?.data?.details;
      if (status === 409 && details) {
        const parts = [];
        if (details.items) parts.push(`${details.items} item`);
        if (details.tasks) parts.push(`${details.tasks} công việc`);
        if (details.costLogs) parts.push(`${details.costLogs} chi phí`);
        message.error(`Không thể xóa: Port đang có ${parts.join(', ')} liên kết`);
      } else {
        message.error('Lỗi khi xóa');
      }
    }
  };

  const suppliersById = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier])), [suppliers]);

  const enrichedPorts = useMemo(() => {
    return ports.map((port) => {
       const portItems = items.filter((item) => (item.port === port.id || item.portId === port.id) && (!portfolioView || item.projectId === port.projectId));
       const portTasks = tasks.filter((task) => task.portId === port.id && (!portfolioView || task.projectId === port.projectId));
       const portCostLogs = costLogs.filter((log) => log.portId === port.id && (!portfolioView || log.projectId === port.projectId));
       const portSupplierPorts = supplierPorts.filter((sp) => sp.portId === port.id && (!portfolioView || sp.projectId === port.projectId));
      const deadline = getPortDeadline(port, portItems, portTasks);
      const deadlineState = getDeadlineState(deadline, port.progress || 0);
      const plannedCost = sumPlannedCost(portItems);
      const plannedRevenue = sumRevenue(portItems);
      const actualCost = sumActualCost(portCostLogs);
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
        hasChildren: portItems.length > 0 || portTasks.length > 0 || portCostLogs.length > 0,
        history: buildHistory(port, portItems, portTasks, portSupplierPorts, suppliersById),
      };
    });
  }, [costLogs, items, ports, supplierPorts, suppliersById, tasks, portfolioView]);

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
    const totalValue = sumContractValue(enrichedPorts);
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
    <div className="ds-container">
      <div className="ds-page-header">
        <div>
          <div className="ds-h1">Ports</div>
          <div className="ds-caption">Hạng mục công việc (Port)</div>
        </div>
        <Button className="btn-gradient" icon={<PlusOutlined />} onClick={openAdd} disabled={portfolioView} title={portfolioView ? 'Chọn 1 dự án để thêm Port' : undefined}>
          Thêm Port
        </Button>
      </div>

      <div className="ev-guide">
        <InfoCircleOutlined /> <b>Port</b> là hạng mục/cụm công việc của dự án. Mỗi Port có tiến độ, doanh thu (giá trị hợp đồng), chi phí kế hoạch &amp; chi phí thực tế. Bảng bên dưới so sánh hiệu suất từng Port — tiến độ càng cao và chi phí thực tế càng thấp kế hoạch là tốt.
      </div>

      <div className="ds-stat-grid">
        <StatCard
          icon={<AppstoreOutlined />}
          accent="linear-gradient(135deg,#2F5CE0,#5b82f0)"
          title="Tổng số Port"
          value={stats.total}
        />
        <StatCard
          icon={<FileDoneOutlined />}
          accent="linear-gradient(135deg,#1FA971,#3cc995)"
          title="Đã ký hợp đồng"
          value={stats.signed}
          valueStyle={{ color: '#1FA971' }}
        />
        <StatCard
          icon={<DollarOutlined />}
          accent="linear-gradient(135deg,#722ed1,#9254de)"
          title="Tổng giá trị HĐ"
          value={fmtVND(stats.totalValue)}
          formatter={(v) => v}
        />
        <StatCard
          icon={<WarningOutlined />}
          accent="linear-gradient(135deg,#EF4444,#ff7875)"
          title="Quá hạn"
          value={stats.overdue}
          valueStyle={{ color: '#EF4444' }}
        />
      </div>

      <Card className="ds-section" style={{ marginTop: 16 }} styles={{ body: { padding: 16 } }}>
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

      <Card className="ds-chart-card" bordered={false} title="Danh sách Port" style={{ marginTop: 16 }}>
        <Table
          className="ds-table-premium"
          dataSource={filteredPorts}
          rowKey={(record) => record.__key || record.id}
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
            ...(portfolioView
              ? [{ title: 'Dự án', dataIndex: 'projectName', key: 'projectName', width: 160, ellipsis: true, fixed: 'left' }]
              : []),
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
              render: (value) => (value > 0 ? <Text strong><span className="ds-num">{fmtVND(value)}</span></Text> : <Text type="secondary">Chưa ký</Text>),
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
                  <Text strong><span className="ds-num">{fmtVND(record.actualCost || record.plannedCost)}</span></Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    KH: <span className="ds-num">{fmtVND(record.plannedCost)}</span> / DT: <span className="ds-num">{fmtVND(record.plannedRevenue)}</span>
                  </Text>
                </Space>
              ),
            },
            {
              title: 'Quản lý',
              key: 'manage',
              width: 280,
              fixed: 'right',
              render: (_, record) => (
                <Space>
                  <Button size="small" icon={<ProfileOutlined />} onClick={() => navigate(getPortManageUrl(record.id, 'items'))} disabled={portfolioView}>
                    Item
                  </Button>
                  <Button size="small" icon={<DollarOutlined />} onClick={() => navigate(getPortManageUrl(record.id, 'costs'))} disabled={portfolioView}>
                    Chi phí
                  </Button>
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} disabled={portfolioView}>
                    Sửa
                  </Button>
                  <Popconfirm
                    title={`Xóa Port ${record.id}?`}
                    description={record.hasChildren ? 'Port đang có item/công việc/chi phí liên kết, cần xóa hết trước' : 'Hành động này không thể hoàn tác'}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                    disabled={portfolioView}
                    onConfirm={() => onDelete(record)}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={portfolioView || record.hasChildren}
                    >
                      Xóa
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={modalMode === 'edit' ? 'Sửa Port' : 'Thêm Port'}
        open={modalOpen}
        onOk={onSubmit}
        onCancel={() => setModalOpen(false)}
        okText={modalMode === 'edit' ? 'Lưu' : 'Thêm'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="id" label="Mã Port" rules={[{ required: true, message: 'Vui lòng nhập mã' }]}>
            <Input placeholder="vd: PORT 1" disabled={modalMode === 'edit'} />
          </Form.Item>
          <Form.Item name="name" label="Tên Port" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
            <Input placeholder="vd: Topside Module" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái">
            <Select options={STATUS_LIST.map((s) => ({ value: s, label: s }))} />
          </Form.Item>
          <Form.Item name="progress" label="Tiến độ (%)">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="contractValue" label="Giá trị hợp đồng">
            <InputNumber min={0} style={{ width: '100%' }} formatter={(value) => `${value || ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
