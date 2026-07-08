import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Typography, Button, Modal, Form, Input, Select, Rate,
  Space, message, Popconfirm, Row, Col, Statistic,
} from 'antd';
import {
  ShopOutlined, PlusOutlined, EditOutlined, DeleteOutlined, PhoneOutlined, MailOutlined,
} from '@ant-design/icons';
import { suppliersApi } from '../api/api.js';
import { PORT_LIST } from '../components/helpers.js';

const { Title, Text } = Typography;

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSup, setEditSup] = useState(null);
  const [form] = Form.useForm();

  const load = async () => {
    try {
      setLoading(true);
      setSuppliers(await suppliersApi.getAll());
    } catch (e) {
      message.error('Không tải được NCC');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditSup(null);
    form.resetFields();
    form.setFieldsValue({ rating: 4, status: 'active', port: 'PORT 2' });
    setModalOpen(true);
  };

  const openEdit = (sup) => {
    setEditSup(sup);
    form.setFieldsValue(sup);
    setModalOpen(true);
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editSup) {
        await suppliersApi.update(editSup.id, values);
        message.success('Đã cập nhật');
      } else {
        await suppliersApi.create(values);
        message.success('Đã thêm NCC');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      if (e?.errorFields) return;
      message.error('Lỗi khi lưu');
    }
  };

  const onDelete = async (id) => {
    await suppliersApi.remove(id);
    message.success('Đã xóa');
    load();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}><ShopOutlined /> Quản lý Nhà cung cấp</Title>
          <Text type="secondary">Danh mục nhà cung cấp & đối tác (SUPPLIER_QUOTATION)</Text>
        </div>
          <Button className="btn-gradient" icon={<PlusOutlined />} onClick={openAdd}>Thêm NCC</Button>
      </div>

      <Card style={{ marginTop: 20 }}>
        <Table
          dataSource={suppliers}
          rowKey="id"
          loading={loading}
          scroll={{ x: 900 }}
          columns={[
            { title: 'Mã', dataIndex: 'id', key: 'id', width: 90, render: (t) => <Text strong>{t}</Text> },
            { title: 'Tên nhà cung cấp', dataIndex: 'name', key: 'name',
              render: (t) => <Text strong>{t}</Text> },
            { title: 'Loại sản phẩm', dataIndex: 'type', key: 'type', ellipsis: true },
            {
              title: 'Port', dataIndex: 'port', key: 'port', width: 90,
              render: (t) => <Tag color="blue">{t}</Tag>,
            },
            {
              title: 'Liên hệ', key: 'contact', width: 180,
              render: (_, r) => (
                <div>
                  {r.phone && <div><PhoneOutlined /> {r.phone}</div>}
                  {r.email && <div><MailOutlined /> <Text style={{ fontSize: 12 }}>{r.email}</Text></div>}
                </div>
              ),
            },
            {
              title: 'Đánh giá', dataIndex: 'rating', key: 'rating', width: 150,
              render: (v) => <Rate disabled count={5} value={v} style={{ fontSize: 14 }} />,
            },
            {
              title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 100,
              render: (s) => <Tag color={s === 'active' ? 'green' : 'default'}>{s === 'active' ? 'Đang HĐ' : 'Ngưng'}</Tag>,
            },
            {
              title: 'Ghi chú', dataIndex: 'note', key: 'note', ellipsis: true,
            },
            {
              title: '', key: 'action', width: 90,
              render: (_, r) => (
                <Space>
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                  <Popconfirm title="Xóa NCC?" onConfirm={() => onDelete(r.id)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editSup ? `Sửa NCC ${editSup.id}` : 'Thêm NCC mới'}
        open={modalOpen}
        onOk={onSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên nhà cung cấp" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Loại sản phẩm / dịch vụ" rules={[{ required: true }]}>
            <Input placeholder="vd: Gia công sắt Z275, Sơn tĩnh điện..." />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="port" label="Port phụ trách">
                <Select options={[...PORT_LIST, 'All'].map((p) => ({ value: p, label: p }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Trạng thái">
                <Select options={[{ value: 'active', label: 'Đang hoạt động' }, { value: 'inactive', label: 'Ngưng' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="SĐT">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="rating" label="Đánh giá (1-5 sao)">
            <Rate count={5} />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
