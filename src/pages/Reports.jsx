import React, { useState, useEffect } from 'react';
import {
  Card, Typography, Button, Row, Col, Spin, message, Tag, Divider, Table,
} from 'antd';
import {
  FilePdfOutlined, FileTextOutlined, BarChartOutlined, WarningOutlined,
  ShopOutlined, DollarOutlined, TeamOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import {
  dashboardApi, portsApi, itemsApi, risksApi, costLogsApi, suppliersApi, metaApi,
} from '../api/api.js';
import { fmtVND, fmtShort, PORT_COLORS, riskColor } from '../components/helpers.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const { Title, Text, Paragraph } = Typography;

export default function Reports() {
  const [data, setData] = useState(null);
  const [ports, setPorts] = useState([]);
  const [items, setItems] = useState([]);
  const [risks, setRisks] = useState([]);
  const [costLogs, setCostLogs] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [d, p, i, r, c, s, m] = await Promise.all([
        dashboardApi.get(), portsApi.getAll(), itemsApi.getAll(),
        risksApi.getAll(), costLogsApi.getAll(), suppliersApi.getAll(), metaApi.get(),
      ]);
      setData(d); setPorts(p); setItems(i); setRisks(r);
      setCostLogs(c); setSuppliers(s); setMeta(m);
    } catch (e) {
      message.error('Không tải được dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ============ Helper vẽ header báo cáo PDF ============
  const drawHeader = (doc, subtitle) => {
    // Banner
    doc.setFillColor(22, 119, 255);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('PROJECT CONTROL REPORT', 105, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(subtitle, 105, 20, { align: 'center' });

    // Info project
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
const m = meta || {};
doc.text(`Du an: ${m.projectName || '-'}`, 14, 36);
doc.text(`Nha thau: ${m.contractor || '-'}`, 14, 42);
doc.text(`Khach hang: ${m.client || '-'}`, 14, 48);
doc.text(`Dia diem: ${m.location || '-'}`, 120, 36);
    doc.text(`Ngay BC: ${new Date().toLocaleDateString('vi-VN')}`, 120, 42);

    doc.setDrawColor(220, 220, 220);
    doc.line(14, 53, 196, 53);
    return 58; // startY
  };

  const drawFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`CONFIDENTIAL - Golden Point Co., Ltd | Trang ${i}/${pageCount}`, 105, 290, { align: 'center' });
    }
  };

  // ============ 1. Báo cáo tổng quan ============
  const exportOverview = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      let y = drawHeader(doc, 'BAO CAO TONG QUAN (OVERVIEW)');

      // KPI box
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(20, 20, 20);
      doc.text('1. CHI SO CHINH (KPI)', 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [['Chi so', 'Gia tri', 'Ghi chu']],
        body: [
          ['Tong doanh thu', fmtShort(data.totalRevenue), 'Tong gia tri nhan thau'],
          ['Tong chi phi', fmtShort(data.totalCost), 'Chi phi du kien'],
          ['Loi nhuan du kien', fmtShort(data.totalProfit), `Bien LN: ${data.totalProfitMargin}%`],
          ['Tien do TB', `${data.avgProgress}%`, 'Cac item'],
          ['Tong Items', String(data.totalItems), `Dang SX: ${data.itemsInFab}`],
          ['Rui ro dang mo', String(data.openRisks || 0), `Muc cao: ${(data.highRisks || []).length}`],
          ['Viec ton dong', String(data.pendingTasks), `Qua han: ${data.overdueTasks}`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [22, 119, 255], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 50 } },
      });
      y = doc.lastAutoTable.finalY + 12;

      // Port table
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('2. HIEU SUAT THEO PORT', 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Port', 'Mo ta', 'Tien do %', 'Doanh thu', 'Chi phi da ghi', 'Items']],
        body: (data.ports || []).map((p) => [
          p.id, p.description, `${p.progress || 0}%`,
          fmtShort(p.revenue), fmtShort(p.logged), String(p.itemCount || 0),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [82, 196, 26], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
      });
      y = doc.lastAutoTable.finalY + 12;

      // Risk top
      const highRisks = data.highRisks || [];
      if (highRisks.length > 0) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('3. RUI RO UU TIEN', 14, y);
        y += 4;
        autoTable(doc, {
          startY: y,
          head: [['Rui ro', 'Port', 'Score', 'Phu trach']],
          body: highRisks.map((r) => [r.title, r.portName, String(r.score), r.owner]),
          theme: 'striped',
          headStyles: { fillColor: [255, 77, 79], fontSize: 9 },
          bodyStyles: { fontSize: 9 },
        });
      }

      drawFooter(doc);
      doc.save(`Bao_cao_tong_quan_${new Date().toISOString().slice(0, 10)}.pdf`);
      message.success('Đã xuất báo cáo tổng quan');
    } catch (e) {
      console.error(e);
      message.error('Lỗi khi xuất PDF: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  // ============ 2. Báo cáo chi tiết Port ============
  const exportPorts = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      let y = drawHeader(doc, 'BAO CAO CHI TIET PORT');

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('TRANG THAI CAC GOI THAU', 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [['Port', 'Mo ta', 'Trang thai', 'Tien do', 'Gia tri HD', 'Ghi chu']],
        body: ports.map((p) => [
          p.id, p.description, p.status, `${p.progress || 0}%`,
          p.contractValue > 0 ? fmtShort(p.contractValue) : 'Chua ky',
          p.note || '-',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [22, 119, 255], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
      });

      drawFooter(doc);
      doc.save(`Bao_cao_Port_${new Date().toISOString().slice(0, 10)}.pdf`);
      message.success('Đã xuất báo cáo Port');
    } catch (e) {
      message.error('Lỗi: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  // ============ 3. Báo cáo chi phí ============
  const exportCost = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      let y = drawHeader(doc, 'BAO CAO CHI PHI (COST LOG)');

      const total = costLogs.reduce((s, c) => s + (c.amount || 0), 0);
      doc.setFontSize(11);
      doc.text(`Tong chi phi da ghi: ${fmtVND(total)}`, 14, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [['Ngay', 'Port', 'Item', 'Loai', 'Mo ta', 'So tien']],
        body: costLogs.map((c) => [
          c.date ? new Date(c.date).toLocaleDateString('vi-VN') : '-',
          c.portId, c.itemCode || '-', c.costType, c.description || '-', fmtShort(c.amount),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [250, 84, 28], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        foot: [['', '', '', '', 'TONG CONG', fmtShort(total)]],
        footStyles: { fillColor: [250, 84, 28], textColor: [255, 255, 255] },
      });

      drawFooter(doc);
      doc.save(`Bao_cao_chi_phi_${new Date().toISOString().slice(0, 10)}.pdf`);
      message.success('Đã xuất báo cáo chi phí');
    } catch (e) {
      message.error('Lỗi: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  // ============ 4. Báo cáo rủi ro ============
  const exportRisks = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      let y = drawHeader(doc, 'BAO CAO RUI RO (RISK MATRIX)');

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(`Tong rui ro: ${risks.length} | Dang mo: ${risks.filter(r => r.status === 'open').length}`, 14, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [['Ma', 'Rui ro', 'Port', 'XS', 'MD', 'Score', 'Trang thai', 'Khac phuc']],
        body: risks.map((r) => [
          r.id, r.title, r.portId, String(r.probability), String(r.impact),
          String(r.score), r.status, (r.mitigation || '-').substring(0, 40),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [255, 77, 79], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
      });

      drawFooter(doc);
      doc.save(`Bao_cao_rui_ro_${new Date().toISOString().slice(0, 10)}.pdf`);
      message.success('Đã xuất báo cáo rủi ro');
    } catch (e) {
      message.error('Lỗi: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  // ============ 5. Báo cáo NCC ============
  const exportSuppliers = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      let y = drawHeader(doc, 'BAO CAO NHA CUNG CAP (SUPPLIERS)');

      autoTable(doc, {
        startY: y,
        head: [['Ma', 'Ten NCC', 'Loai SP', 'Port', 'Danh gia', 'Trang thai']],
        body: suppliers.map((s) => [
          s.id, s.name, s.type, s.port, `${s.rating}/5`, s.status,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [82, 196, 26], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
      });

      drawFooter(doc);
      doc.save(`Bao_cao_NCC_${new Date().toISOString().slice(0, 10)}.pdf`);
      message.success('Đã xuất báo cáo NCC');
    } catch (e) {
      message.error('Lỗi: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  // ============ UI ============
  if (loading || !data) {
    return <div style={{ textAlign: 'center', paddingTop: 100 }}><Spin size="large" /></div>;
  }

  const reports = [
    { key: 'overview', title: 'Báo cáo Tổng quan', desc: 'KPI, hiệu suất Port, rủi ro ưu tiên', icon: <BarChartOutlined />, color: '#1677ff', action: exportOverview },
    { key: 'ports', title: 'Báo cáo Chi tiết Port', desc: 'Trạng thái 7 hạng mục', icon: <FileTextOutlined />, color: '#52c41a', action: exportPorts },
    { key: 'cost', title: 'Báo cáo Chi phí', desc: 'Cost log chi tiết, tổng chi phí', icon: <DollarOutlined />, color: '#fa541c', action: exportCost },
    { key: 'risks', title: 'Báo cáo Rủi ro', desc: 'Danh sách & đánh giá rủi ro', icon: <WarningOutlined />, color: '#ff4d4f', action: exportRisks },
    { key: 'suppliers', title: 'Báo cáo Nhà cung cấp', desc: 'Danh sách NCC & đánh giá', icon: <ShopOutlined />, color: '#722ed1', action: exportSuppliers },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}><FilePdfOutlined /> Xuất Báo cáo PDF</Title>
          <Text type="secondary">Chọn loại báo cáo để tải file PDF về máy</Text>
        </div>
      </div>

      <div className="ev-guide">
        <InfoCircleOutlined /> Các báo cáo được tổng hợp tự động từ dữ liệu dự án hiện tại (doanh thu, chi phí, tiến độ, rủi ro, nhà cung cấp). Nhấn vào một thẻ để tạo &amp; tải PDF. Quá trình có thể mất vài giây với dự án lớn.
      </div>

      <Divider />

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        {reports.map((r) => (
          <Col xs={24} md={12} lg={8} key={r.key}>
            <Card
              hoverable
              style={{ height: '100%', borderLeft: `4px solid ${r.color}` }}
              onClick={() => !generating && r.action()}
              styles={{ body: { padding: 20 } }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 10, background: r.color + '15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: r.color,
                }}>
                  {r.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>{r.title}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{r.desc}</Text>
                  <Button type="link" icon={<FilePdfOutlined />} style={{ padding: 0, marginTop: 8, color: r.color }}>
                    Tải PDF
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="Dữ liệu sẵn sàng xuất" style={{ marginTop: 24 }}>
        <Table
          dataSource={[
            { key: '1', label: 'Ports (hạng mục)', count: ports.length },
            { key: '2', label: 'Items (hạng mục)', count: items.length },
            { key: '3', label: 'Rủi ro', count: risks.length },
            { key: '4', label: 'Cost Log (bản ghi chi phí)', count: costLogs.length },
            { key: '5', label: 'Nhà cung cấp', count: suppliers.length },
          ]}
          pagination={false}
          size="small"
          columns={[
            { title: 'Loại dữ liệu', dataIndex: 'label', key: 'l' },
            { title: 'Số lượng', dataIndex: 'count', key: 'c', align: 'right', render: (v) => <Tag color="blue">{v}</Tag> },
          ]}
        />
      </Card>
    </div>
  );
}
