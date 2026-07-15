import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Spin, message } from 'antd';
import {
  WarningOutlined, DollarOutlined, ContainerOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { itemsApi, costLogsApi } from '../api/api.js';
import ItemWatchlist from '../components/ItemWatchlist.jsx';
import StatCard from '../components/StatCard.jsx';
import { fmtVND } from '../components/helpers.js';
import { useProject } from '../context/ProjectContext.jsx';

export default function ItemWatchlistPage() {
  const { portfolioView } = useProject();
  const [items, setItems] = useState([]);
  const [costLogs, setCostLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [i, c] = await Promise.all([
          itemsApi.getAll(null, portfolioView),
          costLogsApi.getAll(null, portfolioView),
        ]);
        if (!active) return;
        setItems(i);
        setCostLogs(c);
      } catch (e) {
        message.error('Không tải được dữ liệu Item');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [portfolioView]);

  const totalCost = costLogs.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const needAction = items.filter((it) => it.procStatus === 'Chưa đặt' || (it.status !== 'Approved' && it.status !== 'Completed')).length;

  return (
    <div className="ds-container">
      <div className="ds-page-header">
        <div>
          <div className="ds-h1">Item Watchlist</div>
          <div className="ds-caption">Item chiếm nhiều chi phí hoặc cần làm rõ (chưa chốt giá, chưa duyệt, thiếu spec)</div>
        </div>
      </div>

      <div className="ds-stat-grid">
        <StatCard icon={<ContainerOutlined />} accent="linear-gradient(135deg,#2F5CE0,#5b82f0)" title="Tổng số Item" value={items.length} />
        <StatCard icon={<DollarOutlined />} accent="linear-gradient(135deg,#722ed1,#9254de)" title="Tổng chi phí đã ghi" value={fmtVND(totalCost)} formatter={(v) => v} />
        <StatCard icon={<WarningOutlined />} accent="linear-gradient(135deg,#EF4444,#ff7875)" title="Cần làm rõ" value={needAction} valueStyle={{ color: '#EF4444' }} />
        <StatCard icon={<CheckCircleOutlined />} accent="linear-gradient(135deg,#1FA971,#3cc995)" title="Đã ổn" value={items.length - needAction} valueStyle={{ color: '#1FA971' }} />
      </div>

      <Card className="ds-chart-card" bordered={false} title="Danh sách Item" style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
        ) : (
          <ItemWatchlist items={items} costLogs={costLogs} compact={false} />
        )}
      </Card>
    </div>
  );
}
