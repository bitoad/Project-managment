import React from 'react';
import { Table, Tag } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { fmtShort } from '../helpers.js';
import EmptyState from '../shared/EmptyState.jsx';

function statusOf(row) {
  if (row.progress >= 100) return { label: 'Hoàn thành', color: 'var(--color-success)' };
  if (row.spi < 0.9 || row.cpi < 0.9) return { label: 'Chậm', color: 'var(--color-danger)' };
  if (row.spi < 1 || row.cpi < 1) return { label: 'Cảnh báo', color: 'var(--color-warning)' };
  return { label: 'Đúng tiến độ', color: 'var(--color-primary)' };
}

// rows: { id, name, progress, budget, actual, forecast, spi, cpi }
export default function PerformanceTable({ rows = [], onOpen }) {
  const navigate = useNavigate();
  if (!rows.length) return <EmptyState icon={<BarChartOutlined />} title="Chưa có dữ liệu" />;

  const columns = [
    {
      title: 'Cảng / Gói thầu',
      dataIndex: 'name',
      key: 'name',
      render: (v, r) => <a className="dash-link" onClick={() => onOpen && onOpen(r)}>{v}</a>,
    },
    {
      title: 'Tiến độ',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (v) => (
        <div className="perf-prog">
          <div className="perf-prog-bar" style={{ width: `${Math.min(100, v)}%` }} />
          <span>{v}%</span>
        </div>
      ),
    },
    {
      title: 'Ngân sách',
      dataIndex: 'budget',
      key: 'budget',
      width: 110,
      align: 'right',
      render: (v) => <span className="dash-num">{fmtShort(v)}</span>,
    },
    {
      title: 'Thực chi',
      dataIndex: 'actual',
      key: 'actual',
      width: 110,
      align: 'right',
      render: (v) => <span className="dash-num">{fmtShort(v)}</span>,
    },
    {
      title: 'Dự báo',
      dataIndex: 'forecast',
      key: 'forecast',
      width: 110,
      align: 'right',
      render: (v) => <span className="dash-num">{fmtShort(v)}</span>,
    },
    {
      title: 'SPI',
      dataIndex: 'spi',
      key: 'spi',
      width: 64,
      align: 'center',
      render: (v) => <span style={{ color: v < 1 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>{Number(v).toFixed(2)}</span>,
    },
    {
      title: 'CPI',
      dataIndex: 'cpi',
      key: 'cpi',
      width: 64,
      align: 'center',
      render: (v) => <span style={{ color: v < 1 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>{Number(v).toFixed(2)}</span>,
    },
    {
      title: '',
      key: 'status',
      width: 130,
      render: (_, r) => {
        const s = statusOf(r);
        return <Tag color={s.color} style={{ fontWeight: 600 }}>{s.label}</Tag>;
      },
    },
  ];

  return (
    <Table
      className="ds-table-premium"
      rowKey="id"
      size="small"
      pagination={false}
      columns={columns}
      dataSource={rows}
      onRow={() => ({ style: { cursor: 'pointer' } })}
      scroll={{ x: 760 }}
    />
  );
}
