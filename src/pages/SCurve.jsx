import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, Table, Tag, message, Row, Col, Statistic } from 'antd';
import {
  LineChartOutlined, RiseOutlined, FallOutlined,
} from '@ant-design/icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend,
  ResponsiveContainer, ReferenceLine, Area, ComposedChart,
} from 'recharts';
import { sCurveApi } from '../api/api.js';

const { Title, Text } = Typography;

export default function SCurve() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const raw = await sCurveApi.getAll();
      // Tính cumulative planned & actual
      let cumPlan = 0;
      let cumActual = 0;
      const computed = raw.map((p) => {
        cumPlan += p.planned || 0;
        cumActual += p.actual || 0;
        return {
          ...p,
          cumPlan: Number(cumPlan.toFixed(2)),
          cumActual: Number(cumActual.toFixed(2)),
          variance: Number(((p.actual || 0) - (p.planned || 0)).toFixed(2)),
        };
      });
      setData(computed);
    } catch (e) {
      message.error('Không tải được S-Curve');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', paddingTop: 100 }}><Spin size="large" /></div>;
  }

  const last = data[data.length - 1] || {};
  const spi = last.cumPlan > 0 ? (last.cumActual / last.cumPlan).toFixed(2) : '0.00';
  const latestVariance = last.variance || 0;

  return (
    <div className="page-container">
      <Title level={3} style={{ marginBottom: 4 }}><LineChartOutlined /> S-Curve (Earned Value)</Title>
      <Text type="secondary">Tiến độ Kế hoạch vs Thực tế — SPI = EV / PV</Text>

      <Row gutter={[16, 16]} style={{ marginTop: 20, marginBottom: 8 }}>
        <Col xs={8}>
          <Card size="small"><Statistic title="Cum. Planned (PV)" value={last.cumPlan || 0} suffix="%" valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col xs={8}>
          <Card size="small"><Statistic title="Cum. Actual (EV)" value={last.cumActual || 0} suffix="%" valueStyle={{ color: '#1677ff' }} /></Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic
              title="SPI"
              value={spi}
              prefix={Number(spi) >= 1 ? <RiseOutlined /> : <FallOutlined />}
              valueStyle={{ color: Number(spi) >= 1 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Đường cong tiến độ S-Curve" className="chart-container" style={{ marginTop: 16 }}>
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="gradPlan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fa8c16" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#fa8c16" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1677ff" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#1677ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#595959' }} axisLine={{ stroke: '#e8e8e8' }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#595959' }} axisLine={false} tickLine={false} label={{ value: 'Tiến độ (%)', angle: -90, position: 'insideLeft', fill: '#8c8c8c' }} />
            <RTooltip formatter={(v) => v + '%'} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <ReferenceLine y={50} stroke="#bfbfbf" strokeDasharray="5 5" label={{ value: '50%', fill: '#8c8c8c', fontSize: 11, position: 'insideTopRight' }} />
            <Area type="monotone" dataKey="cumPlan" name="Cum. Planned (PV)" stroke="none" fill="url(#gradPlan)" strokeWidth={0} />
            <Area type="monotone" dataKey="cumActual" name="Cum. Actual (EV)" stroke="none" fill="url(#gradActual)" strokeWidth={0} />
            <Line type="monotone" dataKey="planned" name="Kế hoạch (tuần)" stroke="#faad14" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="cumPlan" name="Cum. Planned (PV)" stroke="#fa8c16" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="cumActual" name="Cum. Actual (EV)" stroke="#1677ff" strokeWidth={3} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Bảng dữ liệu chi tiết" style={{ marginTop: 16 }}>
        <Table
          dataSource={data}
          rowKey="week"
          size="small"
          pagination={false}
          columns={[
            { title: 'Tuần', dataIndex: 'week', key: 'w', width: 80, render: (t) => <Text strong>{t}</Text> },
            { title: 'Ngày', dataIndex: 'date', key: 'd', width: 120, render: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '-' },
            { title: 'KH tuần (%)', dataIndex: 'planned', key: 'p', width: 110, align: 'right', render: (v) => v + '%' },
            { title: 'TH tuần (%)', dataIndex: 'actual', key: 'a', width: 110, align: 'right', render: (v) => (v || 0) + '%' },
            { title: 'Cum. Plan', dataIndex: 'cumPlan', key: 'cp', width: 110, align: 'right', render: (v) => <Text style={{ color: '#fa8c16' }}>{v}%</Text> },
            { title: 'Cum. Actual', dataIndex: 'cumActual', key: 'ca', width: 110, align: 'right', render: (v) => <Text strong style={{ color: '#1677ff' }}>{v}%</Text> },
            {
              title: 'Variance', dataIndex: 'variance', key: 'v', width: 100, align: 'right',
              render: (v) => <Tag color={v >= 0 ? 'green' : 'red'}>{v >= 0 ? '+' : ''}{v}%</Tag>,
            },
          ]}
        />
      </Card>
    </div>
  );
}
