import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Typography, Button, Modal, Form, Grid, Input, Select, InputNumber,
  Space, message, Popconfirm, Row, Col, Statistic, Tooltip,
} from 'antd';
import {
  FileSearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import { quotationsApi } from '../api/api.js';
import { fmtVND, TONE } from '../components/helpers.js';
import { useProject } from '../context/ProjectContext.jsx';
import { quotationBest, quotationTotalBest } from '../../shared/formulas.js';

const { Title, Text } = Typography;

export default function Quotations() {
  const { currentProjectId, portfolioView } = useProject();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editQ, setEditQ] = useState(null);
  const [form] = Form.useForm();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const load = async () => {
    try {
      setLoading(true);
      setQuotes(await quotationsApi.getAll(currentProjectId, portfolioView));
    } catch (e) {
      message.error('Không tải được báo giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [currentProjectId, portfolioView]);

  const openAdd = () => {
    setEditQ(null);
    form.resetFields();
    form.setFieldsValue({ unit: 'pcs', qty: 1, supplierA: 0, supplierB: 0, supplierC: 0, selected: 'Supplier A' });
    setModalOpen(true);
  };

  const openEdit = (q) => {
    setEditQ(q);
    form.setFieldsValue(q);
    setModalOpen(true);
  };

  const onSubmit = async () => {
    try {
      const v = await form.validateFields();
      if (editQ) {
        await quotationsApi.update(editQ.id, v);
        message.success('Đã cập nhật');
      } else {
        await quotationsApi.create(v);
        message.success('Đã thêm báo giá');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      if (e?.errorFields) return;
      message.error('Lỗi khi lưu');
    }
  };

  const onDelete = async (id) => {
    await quotationsApi.remove(id);
    message.success('Đã xóa');
    load();
  };

  // Tính giá tốt nhất cho mỗi item
  const getBest = quotationBest;
  const totalBest = quotationTotalBest(quotes);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}><FileSearchOutlined /> So sánh Báo giá</Title>
          <Text type="secondary">So sánh 3 nhà cung cấp & chọn giá tốt nhất (SUPPLIER_QUOTATION)</Text>
        </div>
          <Button className="btn-gradient" icon={<PlusOutlined />} onClick={openAdd} disabled={portfolioView} title={portfolioView ? 'Chọn 1 dự án để thêm báo giá' : undefined}>Thêm báo giá</Button>
      </div>

      <div className="ev-guide">
        <InfoCircleOutlined /> <b>So sánh báo giá</b>: nhập giá từ 3 nhà cung cấp (A/B/C) cho mỗi hạng mục, hệ thống tự đánh dấu <b>giá tốt nhất</b> (xanh). Cột "Đã chốt" cho biết bạn đã chọn supplier chính thức. Tổng giá trị ở trên tính theo giá tốt nhất × số lượng.
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: 16, marginBottom: 8 }}>
        <Col xs={8}><Card size="small"><Statistic title="Số mục báo giá" value={quotes.length} /></Card></Col>
        <Col xs={8}><Card size="small"><Statistic title="Tổng giá trị (giá tốt nhất)" value={fmtVND(totalBest)} valueStyle={{ color: TONE.success }} /></Card></Col>
        <Col xs={8}><Card size="small"><Statistic title="Đã chốt" value={quotes.filter(q => q.selected).length} /></Card></Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Table
          dataSource={quotes}
          rowKey={(r) => r.__key || r.id}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 12 }}
          columns={[
            ...(portfolioView
              ? [{ title: 'Dự án', dataIndex: 'projectName', key: 'projectName', width: 160, ellipsis: true }]
              : []),
            { title: 'Item', dataIndex: 'itemCode', key: 'ic', width: 80, render: (t) => <Text strong>{t}</Text> },
            { title: 'Tên hạng mục', dataIndex: 'itemName', key: 'in', ellipsis: true },
            { title: 'ĐVT', dataIndex: 'unit', key: 'unit', width: 70 },
            { title: 'SL', dataIndex: 'qty', key: 'qty', width: 70, align: 'right' },
            {
              title: 'Supplier A', dataIndex: 'supplierA', key: 'sA', width: 120, align: 'right',
              render: (v, r) => (
                <Text style={{ color: r.selected === 'Supplier A' ? TONE.success : undefined, fontWeight: r.selected === 'Supplier A' ? 700 : 400 }}>
                  {fmtVND(v)}
                </Text>
              ),
            },
            {
              title: 'Supplier B', dataIndex: 'supplierB', key: 'sB', width: 120, align: 'right',
              render: (v, r) => (
                <Text style={{ color: r.selected === 'Supplier B' ? TONE.success : undefined, fontWeight: r.selected === 'Supplier B' ? 700 : 400 }}>
                  {fmtVND(v)}
                </Text>
              ),
            },
            {
              title: 'Supplier C', dataIndex: 'supplierC', key: 'sC', width: 120, align: 'right',
              render: (v, r) => (
                <Text style={{ color: r.selected === 'Supplier C' ? TONE.success : undefined, fontWeight: r.selected === 'Supplier C' ? 700 : 400 }}>
                  {fmtVND(v)}
                </Text>
              ),
            },
            {
              title: 'Tốt nhất', key: 'best', width: 110, align: 'right',
              render: (_, r) => {
                const best = getBest(r);
                return (
                  <Tooltip title={best.name}>
                    <Tag color="green" icon={<CheckCircleOutlined />}>{fmtVND(best.val)}</Tag>
                  </Tooltip>
                );
              },
            },
            {
              title: 'Đã chọn', dataIndex: 'selected', key: 'sel', width: 110,
              render: (t) => <Tag color="blue">{t}</Tag>,
            },
            {
              title: '', key: 'action', width: 90,
              render: (_, r) => (
                <Space>
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
        title={editQ ? 'Sửa báo giá' : 'Thêm báo giá'}
        open={modalOpen}
        onOk={onSubmit}
        onCancel={() => setModalOpen(false)}
        width={isMobile ? '92%' : 600}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="itemCode" label="Mã Item" rules={[{ required: true }]}>
                <Input placeholder="A001" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="itemName" label="Tên hạng mục" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="unit" label="Đơn vị" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="qty" label="Số lượng" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="selected" label="Chọn NCC">
                <Select options={['Supplier A', 'Supplier B', 'Supplier C'].map((s) => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="supplierA" label="Supplier A" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => value.replace(/[^\d.]/g, '')} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="supplierB" label="Supplier B" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => value.replace(/[^\d.]/g, '')} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="supplierC" label="Supplier C" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => value.replace(/[^\d.]/g, '')} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
