import React, { useState, useRef } from 'react';
import {
  Card, Table, Tag, Typography, Button, Modal, Form, Input, Space, message,
  Popconfirm, Row, Col, Statistic, Upload, Alert, Progress, Divider, Tooltip, Empty,
} from 'antd';
import {
  ProjectOutlined, PlusOutlined, DeleteOutlined, UploadOutlined, DownloadOutlined,
  FileExcelOutlined, CheckCircleOutlined, ReloadOutlined, FolderOpenOutlined, EditOutlined,
} from '@ant-design/icons';
import { useProject } from '../context/ProjectContext.jsx';
import { projectsApi, dashboardApi } from '../api/api.js';

const { Title, Text, Paragraph } = Typography;

export default function Projects() {
  const {
    projects, currentProject, currentProjectId, selectProject,
    createProject, deleteProject, reloadProjects,
  } = useProject();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [dashboards, setDashboards] = useState({});
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const fileInputRef = useRef(null);
  const [targetProjectId, setTargetProjectId] = useState(null);

  // Load dashboard cho mỗi project (đếm items, tasks...)
  const loadDashboards = async () => {
    const result = {};
    for (const p of projects) {
      try {
        result[p.id] = await dashboardApi.get(p.id);
      } catch (e) {
        console.error('Load dashboard error', p.id);
      }
    }
    setDashboards(result);
  };

  React.useEffect(() => {
    loadDashboards();
  }, [projects.length]);

  const handleCreate = async () => {
    const v = await form.validateFields();
    await createProject(v.name, v.description);
    form.resetFields();
    setCreateOpen(false);
    message.success('Đã tạo dự án');
  };

  const handleEdit = (project) => {
    setEditTarget(project);
    editForm.setFieldsValue(project);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    const v = await editForm.validateFields();
    await projectsApi.update(editTarget.id, v);
    await reloadProjects();
    setEditOpen(false);
    message.success('Đã cập nhật');
  };

  const handleDelete = async (id) => {
    if (projects.length <= 1) {
      message.warning('Không thể xóa dự án cuối cùng');
      return;
    }
    await deleteProject(id);
  };

  // ===== Import Excel =====
  const triggerImport = (projectId) => {
    setTargetProjectId(projectId);
    setImportResult(null);
    fileInputRef.current?.click();
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !targetProjectId) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      message.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
      e.target.value = '';
      return;
    }

    setImporting(true);
    try {
      const result = await projectsApi.importExcel(targetProjectId, file);
      setImportResult(result);
      message.success(`Đã import thành công từ ${(result?.summary?.sheets || []).length} sheets!`);
      await loadDashboards();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      message.error('Lỗi import: ' + msg);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleExport = async (projectId, projectName) => {
    try {
      message.loading({ content: 'Đang xuất Excel...', key: 'export' });
      const saved = localStorage.getItem('currentProjectId');
      localStorage.setItem('currentProjectId', projectId);
      await projectsApi.exportExcel(projectId);
      if (saved) localStorage.setItem('currentProjectId', saved);
      message.success({ content: 'Đã tải file Excel', key: 'export' });
    } catch (e) {
      message.error({ content: 'Lỗi xuất Excel', key: 'export' });
    }
  };

  const handleReset = async (projectId) => {
    await projectsApi.reset(projectId);
    await loadDashboards();
    message.success('Đã xóa toàn bộ dữ liệu');
  };

  return (
    <div className="page-container projects-page">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />

      <div className="page-header">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}><ProjectOutlined /> Quản lý Dự án</Title>
          <Text type="secondary">Tạo dự án mới, nhập dữ liệu từ Excel, chuyển đổi giữa các dự án</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { reloadProjects(); loadDashboards(); }}>Tải lại</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            Tạo dự án mới
          </Button>
        </Space>
      </div>

      {/* Import result banner */}
      {importResult && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginTop: 16 }}
          message={`Import Excel thành công vào dự án!`}
          description={
            <div>
              <Space wrap>
                <Tag color="blue">{importResult.summary.items} Items</Tag>
                <Tag color="orange">{importResult.summary.tasks} Tasks</Tag>
                <Tag color="red">{importResult.summary.costLogs} Cost Logs</Tag>
                <Tag color="green">{importResult.summary.quotations} Báo giá</Tag>
                <Tag color="purple">{importResult.summary.team} Nhân sự</Tag>
                <Tag color="cyan">{importResult.summary.sCurve} S-Curve points</Tag>
              </Space>
              <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                Sheets đã đọc: {importResult.summary.sheets.join(', ')}
              </div>
            </div>
          }
          closable
          onClose={() => setImportResult(null)}
        />
      )}

      <Card style={{ marginTop: 16 }}>
        {projects.length === 0 ? (
          <Empty description="Chưa có dự án nào" />
        ) : (
          <Table
            dataSource={projects}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: 'Dự án', dataIndex: 'name', key: 'name',
                render: (t, r) => (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text strong style={{ fontSize: 15 }}>{t}</Text>
                      {r.id === currentProjectId && <Tag color="green">Đang chọn</Tag>}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{r.description || '-'}</Text>
                  </div>
                ),
              },
              {
                title: 'Số liệu', key: 'stats', width: 280,
                render: (_, r) => {
                  const d = dashboards[r.id];
                  if (!d) return <Text type="secondary">Đang tải...</Text>;
                  return (
                    <Space size="small" wrap>
                      <Tag color="blue">{d.totalItems} Items</Tag>
                      <Tag color="orange">{d.pendingTasks} việc chờ</Tag>
                      <Tag color="red">{d.openRisks} rủi ro</Tag>
                      <Tag color="purple">{d.avgProgress}%</Tag>
                    </Space>
                  );
                },
              },
              {
                title: 'Ngày tạo', dataIndex: 'createdAt', key: 'created', width: 130,
                render: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '-',
              },
              {
                title: 'Thao tác', key: 'action', width: 360,
                render: (_, r) => (
                  <Space size="small" wrap>
                    <Button
                      size="small"
                      type={r.id === currentProjectId ? 'default' : 'primary'}
                      onClick={() => selectProject(r.id)}
                      disabled={r.id === currentProjectId}
                    >
                      Chọn
                    </Button>
                    <Tooltip title="Import dữ liệu từ Excel (.xlsx)">
                      <Button
                        size="small"
                        icon={<FileExcelOutlined />}
                        loading={importing && targetProjectId === r.id}
                        onClick={() => triggerImport(r.id)}
                      >
                        Import
                      </Button>
                    </Tooltip>
                    <Tooltip title="Xuất dữ liệu ra Excel">
                      <Button size="small" icon={<DownloadOutlined />} onClick={() => handleExport(r.id)}>
                        Export
                      </Button>
                    </Tooltip>
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)} />
                    <Popconfirm
                      title="Xóa dự án này? Toàn bộ dữ liệu sẽ mất."
                      onConfirm={() => handleDelete(r.id)}
                      okText="Xóa"
                      okButtonProps={{ danger: true }}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Card>

      {/* ===== Hướng dẫn Import ===== */}
      <Card title="📋 Hướng dẫn nhập dữ liệu" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Paragraph>
              <Text strong>Cách 1: Import từ Excel (nhanh nhất)</Text>
            </Paragraph>
            <ol style={{ paddingLeft: 20, fontSize: 13, color: '#555', lineHeight: 1.8 }}>
              <li>Chuẩn bị file Excel (.xlsx) theo cấu trúc chuẩn</li>
              <li>Bấm nút <Tag color="green">Import</Tag> cạnh dự án</li>
              <li>Chọn file Excel → app tự đọc tất cả sheets</li>
              <li>Các sheets được import: <br />
                <Text code>ITEM_MASTER</Text>, <Text code>COST_LOG</Text>, <Text code>TASK_LIST</Text>, <br />
                <Text code>SUPPLIER_QUOTATION</Text>, <Text code>S_CURVE</Text>, <Text code>REGISTRATION LIST</Text>
              </li>
              <li>Dữ liệu cũ sẽ bị thay thế bằng dữ liệu mới</li>
            </ol>
          </Col>
          <Col xs={24} md={12}>
            <Paragraph>
              <Text strong>Cách 2: Nhập tay trên web</Text>
            </Paragraph>
            <ol style={{ paddingLeft: 20, fontSize: 13, color: '#555', lineHeight: 1.8 }}>
              <li>Chọn dự án ở dropdown header</li>
              <li>Vào trang <Text strong>Item Master</Text> → bấm "Thêm Item"</li>
              <li>Vào <Text strong>Cost Log</Text> → "Thêm chi phí"</li>
              <li>Vào <Text strong>Kanban</Text> → "Thêm việc"</li>
              <li>Vào <Text strong>Team</Text> → "Thêm thành viên"</li>
              <li>Tự động lưu ngay khi thêm</li>
            </ol>
            <Divider style={{ margin: '12px 0' }} />
            <Paragraph>
              <Text strong>💡 Mẹo:</Text> Bạn có thể <b>xuất Excel</b> từ 1 dự án, chỉnh sửa trên Excel, rồi <b>import</b> lại để cập nhật hàng loạt.
            </Paragraph>
          </Col>
        </Row>
      </Card>

      {/* ===== Modal tạo dự án ===== */}
      <Modal
        title="Tạo dự án mới"
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => setCreateOpen(false)}
        okText="Tạo"
        cancelText="Hủy"
        centered
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên dự án" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
            <Input placeholder="vd: Offshore Platform X" autoFocus />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} placeholder="Khách hàng, địa điểm..." />
          </Form.Item>
        </Form>
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 8 }}
          message="Sau khi tạo, bấm Import để nạp dữ liệu từ Excel, hoặc nhập tay từng hạng mục."
        />
      </Modal>

      {/* ===== Modal sửa dự án ===== */}
      <Modal
        title="Sửa thông tin dự án"
        open={editOpen}
        onOk={handleEditSave}
        onCancel={() => setEditOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="Tên dự án" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
        <Divider style={{ margin: '12px 0' }} />
        <Popconfirm title="Xóa toàn bộ dữ liệu dự án (giữ dự án trống)?" onConfirm={() => handleReset(editTarget.id)}>
          <Button danger icon={<ReloadOutlined />}>Reset dữ liệu dự án</Button>
        </Popconfirm>
      </Modal>
    </div>
  );
}
