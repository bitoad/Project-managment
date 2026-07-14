import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Typography, Button, Modal, Form, Input, Select, Upload,
  Space, message, Popconfirm, Row, Col, Statistic, Tree,
} from 'antd';
import {
  FolderOpenOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  UploadOutlined, FileOutlined, FilePdfOutlined, FileWordOutlined,
  FileExcelOutlined, DownloadOutlined,
} from '@ant-design/icons';
import { documentsApi } from '../api/api.js';
import { PORT_LIST, PORT_COLORS } from '../components/helpers.js';
import { useProject } from '../context/ProjectContext.jsx';

const { Title, Text } = Typography;

const DOC_TYPES = ['MTO', 'BOM', 'Drawing', 'Shopdrawing', 'Spec', 'Catalog', 'Contract', 'Report', 'Other'];

// Icon theo loại file
const fileIcon = (name) => {
  if (!name) return <FileOutlined />;
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return <FileWordOutlined style={{ color: '#1677ff' }} />;
  if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return <FileExcelOutlined style={{ color: '#52c41a' }} />;
  return <FileOutlined style={{ color: '#8c8c8c' }} />;
};

export default function Documents() {
  const { currentProjectId, portfolioView } = useProject();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [form] = Form.useForm();

  const load = async () => {
    try {
      setLoading(true);
      setDocs(await documentsApi.getAll('', portfolioView));
    } catch (e) {
      message.error('Không tải được tài liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [currentProjectId, portfolioView]);

  const openAdd = () => {
    setEditDoc(null);
    form.resetFields();
    form.setFieldsValue({ type: 'Drawing', portId: 'PORT 1', revision: 'Rev A' });
    setModalOpen(true);
  };

  const openEdit = (doc) => {
    setEditDoc(doc);
    form.setFieldsValue(doc);
    setModalOpen(true);
  };

  const onSubmit = async () => {
    try {
      const v = await form.validateFields();
      if (editDoc) {
        await documentsApi.update(editDoc.id, v);
        message.success('Đã cập nhật');
      } else {
        // Nếu có file upload
        const file = form.getFieldValue('_file');
        if (file && file[0]?.originFileObj) {
          const formData = new FormData();
          Object.keys(v).forEach((k) => formData.append(k, v[k] || ''));
          formData.append('file', file[0].originFileObj);
          await documentsApi.create(formData);
        } else {
          await documentsApi.create(v);
        }
        message.success('Đã thêm tài liệu');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      if (e?.errorFields) return;
      message.error('Lỗi khi lưu');
    }
  };

  const onDelete = async (id) => {
    await documentsApi.remove(id);
    message.success('Đã xóa');
    load();
  };

  // Nhóm tài liệu theo Port
  const grouped = PORT_LIST.map((p) => ({
    port: p,
    docs: docs.filter((d) => d.portId === p),
  }));

  const typeColors = {
    MTO: 'blue', BOM: 'cyan', Drawing: 'purple', Shopdrawing: 'geekblue',
    Spec: 'gold', Catalog: 'orange', Contract: 'red', Report: 'green', Other: 'default',
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}><FolderOpenOutlined /> Bản vẽ & Tài liệu</Title>
          <Text type="secondary">Quản lý bản vẽ, MTO, BOM theo từng Port</Text>
        </div>
          <Button className="btn-gradient" icon={<PlusOutlined />} onClick={openAdd} disabled={portfolioView} title={portfolioView ? 'Chọn 1 dự án để thêm tài liệu' : undefined}>Thêm tài liệu</Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: 20, marginBottom: 8 }}>
        <Col xs={6}><Card size="small"><Statistic title="Tổng tài liệu" value={docs.length} /></Card></Col>
        <Col xs={6}><Card size="small"><Statistic title="Bản vẽ/SX" value={docs.filter(d => ['Drawing', 'Shopdrawing'].includes(d.type)).length} valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col xs={6}><Card size="small"><Statistic title="MTO/BOM" value={docs.filter(d => ['MTO', 'BOM'].includes(d.type)).length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={6}><Card size="small"><Statistic title="Hợp đồng" value={docs.filter(d => d.type === 'Contract').length} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Table
          dataSource={docs}
          rowKey={(r) => r.__key || r.id}
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 12 }}
          columns={[
            ...(portfolioView
              ? [{ title: 'Dự án', dataIndex: 'projectName', key: 'projectName', width: 160, ellipsis: true }]
              : []),
            {
              title: 'Tên tài liệu', dataIndex: 'name', key: 'name',
              render: (t, r) => (
                <Space>
                  {r.filePath ? fileIcon(r.fileOriginalName || r.filePath) : fileIcon(r.name)}
                  {r.filePath ? (
                    <a href={r.filePath} target="_blank" rel="noreferrer"><Text strong>{t}</Text></a>
                  ) : (
                    <Text strong>{t}</Text>
                  )}
                </Space>
              ),
            },
            {
              title: 'Loại', dataIndex: 'type', key: 'type', width: 120,
              render: (t) => <Tag color={typeColors[t] || 'default'}>{t}</Tag>,
            },
            {
              title: 'Port', dataIndex: 'portId', key: 'port', width: 90,
              render: (t) => <Tag color={PORT_COLORS[t] || 'blue'}>{t}</Tag>,
            },
            { title: 'Rev', dataIndex: 'revision', key: 'rev', width: 80, render: (t) => <Tag>{t || '-'}</Tag> },
            { title: 'Ghi chú', dataIndex: 'note', key: 'note', ellipsis: true },
            {
              title: 'Ngày', dataIndex: 'uploadedAt', key: 'date', width: 110,
              render: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '-',
            },
            {
              title: '', key: 'action', width: 130,
              render: (_, r) => (
                <Space>
                  {r.filePath && (
                    <Button size="small" icon={<DownloadOutlined />} href={r.filePath} target="_blank" />
                  )}
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} disabled={portfolioView} />
                  <Popconfirm title="Xóa?" onConfirm={() => onDelete(r.id)} disabled={portfolioView}>
                    <Button size="small" danger icon={<DeleteOutlined />} disabled={portfolioView} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editDoc ? 'Sửa tài liệu' : 'Thêm tài liệu'}
        open={modalOpen}
        onOk={onSubmit}
        onCancel={() => setModalOpen(false)}
        width={560}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên tài liệu" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="type" label="Loại" rules={[{ required: true }]}>
                <Select options={DOC_TYPES.map((t) => ({ value: t, label: t }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="portId" label="Port" rules={[{ required: true }]}>
                <Select options={PORT_LIST.map((p) => ({ value: p, label: p }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="revision" label="Revision">
                <Input placeholder="Rev A" />
              </Form.Item>
            </Col>
          </Row>
          {!editDoc && (
            <Form.Item name="_file" label="File đính kèm" valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}>
              <Upload beforeUpload={() => false} maxCount={1}>
                <Button icon={<UploadOutlined />}>Chọn file</Button>
              </Upload>
            </Form.Item>
          )}
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
