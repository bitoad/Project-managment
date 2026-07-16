import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, message, Typography, Spin } from 'antd';
import {
  LineChartOutlined, RiseOutlined, FallOutlined, InfoCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend,
  ResponsiveContainer, ReferenceLine, Area, ComposedChart,
} from 'recharts';
import { sCurveApi } from '../api/api.js';
import StatCard from '../components/StatCard.jsx';
import { TONE, cardListColumns } from '../components/helpers.js';
import { sCurveCumulative, evm } from '../../shared/formulas.js';
import EmptyState from '../components/shared/EmptyState.jsx';
import PageLoader from '../components/shared/PageLoader.jsx';

const { Text } = Typography;

export default function SCurve() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const raw = await sCurveApi.getAll();
      const computed = sCurveCumulative(raw);
      setData(computed);
    } catch (e) {
      message.error('Không tải được S-Curve');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="ds-container" style={{ maxWidth: 1400, margin: '0 auto' }}>
        <PageLoader />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="ds-container" style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div className="ds-page-header">
          <div>
            <div className="ds-h1"><LineChartOutlined /> S-Curve</div>
            <div className="ds-caption">Phân tích Earned Value (EV / PV / AC)</div>
          </div>
        </div>
        <EmptyState icon={<InboxOutlined />} title="Chưa có dữ liệu S-Curve" />
      </div>
    );
  }

  const last = data[data.length - 1] || {};
  const spi = evm({ PV: last.cumPlan, EV: last.cumActual }).SPI;
  const latestVariance = last.variance || 0;

  return (
    <div className="ds-container" style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div className="ds-page-header">
        <div>
          <div className="ds-h1"><LineChartOutlined /> S-Curve</div>
          <div className="ds-caption">Phân tích Earned Value (EV / PV / AC)</div>
        </div>
      </div>

      <div className="ev-guide">
        <InfoCircleOutlined /> <b>SPI (Schedule Performance Index)</b> = EV ÷ PV. &nbsp;
        SPI &gt; 1: tiến độ nhanh hơn kế hoạch · = 1: đúng kế hoạch · &lt; 1: chậm. &nbsp;
        <b>PV</b> = giá trị kế hoạch (Planned), <b>EV</b> = giá trị thực đạt được (Earned). Đường Cong tích lũy càng sát nhau càng tốt.
      </div>

      <div className="ds-stat-grid">
        <StatCard
          icon={<LineChartOutlined />}
          accent="linear-gradient(135deg,#fa8c16,#ffc069)"
          title="Cum. Planned (PV)"
          value={last.cumPlan || 0}
          suffix="%"
          valueStyle={{ color: TONE.warning }}
        />
        <StatCard
          icon={<LineChartOutlined />}
           accent="var(--accent-primary)"
          title="Cum. Actual (EV)"
          value={last.cumActual || 0}
          suffix="%"
          valueStyle={{ color: TONE.primary }}
        />
        <StatCard
          icon={Number(spi) >= 1 ? <RiseOutlined /> : <FallOutlined />}
          accent={Number(spi) >= 1 ? 'linear-gradient(135deg,#1FA971,#3cc995)' : 'linear-gradient(135deg,#EF4444,#ff7875)'}
          title="SPI"
          value={spi}
          valueStyle={{ color: Number(spi) >= 1 ? TONE.success : TONE.danger }}
          trend={{ dir: Number(spi) >= 1 ? 'up' : 'down', value: '', label: Number(spi) >= 1 ? '>= kế hoạch' : '< kế hoạch' }}
        />
      </div>

      <Card className="ds-chart-card" bordered={false} title="Đường cong tiến độ S-Curve" style={{ marginTop: 16 }}>
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

      <Card className="ds-chart-card" bordered={false} title="Bảng dữ liệu chi tiết" style={{ marginTop: 16 }}>
        <Table
          className="ds-table-premium card-list"
          dataSource={data}
          rowKey="week"
          size="small"
          pagination={false}
          scroll={{ x: 800 }}
          columns={cardListColumns([
            { title: 'Tuần', dataIndex: 'week', key: 'w', width: 80, render: (t) => <Text strong>{t}</Text> },
            { title: 'Ngày', dataIndex: 'date', key: 'd', width: 120, render: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '-' },
            { title: 'KH tuần (%)', dataIndex: 'planned', key: 'p', width: 110, align: 'right', render: (v) => <span className="ds-num">{v}%</span> },
            { title: 'TH tuần (%)', dataIndex: 'actual', key: 'a', width: 110, align: 'right', render: (v) => <span className="ds-num">{(v || 0)}%</span> },
             { title: 'Cum. Plan', dataIndex: 'cumPlan', key: 'cp', width: 110, align: 'right', render: (v) => <Text style={{ color: TONE.warning }} className="ds-num">{v}%</Text> },
             { title: 'Cum. Actual', dataIndex: 'cumActual', key: 'ca', width: 110, align: 'right', render: (v) => <Text strong style={{ color: TONE.primary }} className="ds-num">{v}%</Text> },
            {
              title: 'Variance', dataIndex: 'variance', key: 'v', width: 100, align: 'right',
              render: (v) => <Tag color={v >= 0 ? 'green' : 'red'}>{v >= 0 ? '+' : ''}{v}%</Tag>,
            },
          ])}
        />
      </Card>
    </div>
  );
}
