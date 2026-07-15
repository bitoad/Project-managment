import React, { useMemo, useState } from 'react';
import { Table, Tag, Progress, Segmented, Tooltip } from 'antd';
import {
  WarningOutlined, CheckCircleOutlined, RightOutlined, InboxOutlined,
} from '@ant-design/icons';
import { fmtVND, PORT_COLORS, statusColor } from './helpers.js';
import { costOf } from '../../shared/formulas.js';
import EmptyState from './shared/EmptyState.jsx';

function buildRows(items, costLogs) {
  const logsByItem = {};
  (costLogs || []).forEach((c) => {
    const key = c.itemCode || c.itemId;
    if (!key) return;
    (logsByItem[key] = logsByItem[key] || []).push(c);
  });
  const totalCost = (costLogs || []).reduce((s, c) => s + (Number(c.amount) || 0), 0);
  return (items || []).map((it) => {
    const code = it.code || it.id;
    const logged = (logsByItem[code] || []).reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const cost = logged > 0 ? logged : costOf(it);
    const pct = totalCost > 0 ? (cost / totalCost) * 100 : 0;
    const needsAction =
      it.procStatus === 'Chưa đặt' ||
      (it.status !== 'Approved' && it.status !== 'Completed');
    return {
      key: `${it.projectId || ''}-${code}`,
      code,
      name: it.name,
      port: it.port || it.portId,
      cost,
      pct,
      status: it.status,
      procStatus: it.procStatus,
      needsAction,
    };
  }).sort((a, b) => b.pct - a.pct);
}

export default function ItemWatchlist({ items = [], costLogs = [], compact = false }) {
  const [filter, setFilter] = useState('all');

  const rows = useMemo(() => buildRows(items, costLogs), [items, costLogs]);
  const shown = useMemo(() => {
    const list = filter === 'action' ? rows.filter((r) => r.needsAction) : rows;
    return compact ? list.slice(0, 8) : list;
  }, [rows, filter, compact]);

  const columns = [
    {
      title: 'Item',
      dataIndex: 'code',
      key: 'code',
      fixed: compact ? undefined : 'left',
      width: compact ? 180 : 220,
      render: (code, r) => (
        <div style={{ lineHeight: 1.3 }}>
          <Tag color={PORT_COLORS[r.port] || 'blue'} style={{ marginInlineEnd: 4, fontWeight: 600 }}>{r.port || '—'}</Tag>
          <span style={{ fontWeight: 600 }}>{code}</span>
          <div style={{ fontSize: 12, color: '#8c8c8c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{r.name}</div>
        </div>
      ),
    },
    {
      title: 'Chi phí đã ghi',
      dataIndex: 'cost',
      key: 'cost',
      align: 'right',
      width: 130,
      render: (v) => <span className="ds-num" style={{ fontWeight: 600 }}>{fmtVND(v)}</span>,
    },
    {
      title: '% tổng chi phí',
      dataIndex: 'pct',
      key: 'pct',
      width: 150,
      sorter: (a, b) => a.pct - b.pct,
      defaultSortOrder: 'descend',
      render: (v) => (
        <Progress percent={Math.round(v)} size="small" showInfo strokeColor={v >= 20 ? '#ff4d4f' : v >= 8 ? '#fa8c16' : '#1677ff'} />
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (s) => <Tag color={statusColor[s] || 'default'}>{s || '—'}</Tag>,
    },
    {
      title: compact ? 'Cần làm rõ' : 'Cần hành động',
      key: 'action',
      width: 130,
      render: (_, r) =>
        r.needsAction ? (
          <Tooltip title="Chưa chốt giá / chưa duyệt / thiếu spec">
            <Tag color="error" icon={<WarningOutlined />}>Cần làm rõ</Tag>
          </Tooltip>
        ) : (
          <Tag color="success" icon={<CheckCircleOutlined />}>Ổn</Tag>
        ),
    },
  ];

  if (rows.length === 0) {
    return <EmptyState icon={<InboxOutlined />} title="Chưa có item nào" />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <Segmented
          size="small"
          value={filter}
          onChange={setFilter}
          options={[
            { label: `Tất cả (${rows.length})`, value: 'all' },
            { label: `Cần làm rõ (${rows.filter((r) => r.needsAction).length})`, value: 'action' },
          ]}
        />
        {compact && (
          <a onClick={() => window.dispatchEvent(new CustomEvent('navigate-watchlist'))}>
            Xem tất cả <RightOutlined />
          </a>
        )}
      </div>
      <Table
        className="ds-table-premium"
        dataSource={shown}
        rowKey="key"
        size="small"
        pagination={compact ? false : { pageSize: 10, showSizeChanger: false }}
        scroll={{ x: compact ? 620 : 760 }}
        columns={columns}
        locale={{ emptyText: <EmptyState icon={<InboxOutlined />} title="Không có item cần làm rõ" /> }}
      />
    </div>
  );
}

export { buildRows };
