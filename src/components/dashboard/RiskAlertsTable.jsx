import React from 'react';
import { Table, Tag } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../shared/EmptyState.jsx';

const RISK_COLOR = { critical: 'var(--color-danger)', high: 'var(--color-warning)', medium: 'var(--color-accent)', low: 'var(--color-success)' };

// risks: from dashboardApi highRisks: { id, title, projectName, severity, status, dueDate }
export default function RiskAlertsTable({ risks = [], onViewAll }) {
  const navigate = useNavigate();
  if (!risks.length) return <EmptyState icon={<WarningOutlined />} title="Không có rủi ro" />;

  const columns = [
    {
      title: 'Rủi ro',
      dataIndex: 'title',
      key: 'title',
      render: (t, r) => (
        <a className="dash-link" onClick={() => navigate('/risk')}>
          {t}
        </a>
      ),
    },
    {
      title: 'Dự án',
      dataIndex: 'projectName',
      key: 'projectName',
      ellipsis: true,
      render: (v) => <span className="dash-muted">{v}</span>,
    },
    {
      title: 'Mức độ',
      dataIndex: 'severity',
      key: 'severity',
      width: 96,
      render: (s) => (
        <Tag color={RISK_COLOR[s] || '#94a3b8'} style={{ fontWeight: 600 }}>
          {(s || '').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Hạn',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 96,
      render: (d) => <span className="dash-muted">{d ? new Date(d).toLocaleDateString('vi-VN') : '—'}</span>,
    },
  ];

  return (
    <Table
      className="ds-table-premium"
      rowKey="id"
      size="small"
      pagination={false}
      columns={columns}
      dataSource={risks.slice(0, 6)}
      onRow={() => ({ style: { cursor: 'pointer' } })}
      scroll={{ y: 230 }}
    />
  );
}
