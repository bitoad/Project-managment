import React from 'react';
import { Progress } from 'antd';
import {
  FundOutlined,
  DollarOutlined,
  ExperimentOutlined,
  ProjectOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { fmtShort } from '../helpers.js';
import StatCard from '../StatCard.jsx';

export default function DashboardKPIs({ view, totalItems }) {
  return (
    <section className="col-12">
      <div className="dash-kpi-grid">
        <StatCard
          icon={<FundOutlined />}
          title="Ngân sách"
          value={fmtShort(view.totalPlannedCost || 0)}
          accent="linear-gradient(135deg,#0F5132,#2F9E6E)"
        />
        <StatCard
          icon={<DollarOutlined />}
          title="Đã chi"
          value={fmtShort(view.totalLoggedCost || 0)}
          accent="linear-gradient(135deg,#D9A441,#F0C977)"
        />
        <StatCard
          icon={<DollarOutlined />}
          title="Doanh thu"
          value={fmtShort(view.totalRevenue || 0)}
          accent="linear-gradient(135deg,#2F9E6E,#7CC9A9)"
        />
        <StatCard
          icon={<ExperimentOutlined />}
          title="Lợi nhuận"
          value={fmtShort(view.totalProfit || 0)}
          accent="linear-gradient(135deg,#2F9E6E,#7CC9A9)"
          footer={`Biên ${Math.round(view.totalProfitMargin || 0)}%`}
        />
        <StatCard
          icon={<ProjectOutlined />}
          title="Tiến độ TB"
          value={`${Math.round(view.avgProgress || 0)}%`}
          accent="linear-gradient(135deg,#0F5132,#2F9E6E)"
        >
          <Progress
            percent={Math.round(view.avgProgress || 0)}
            size="small"
            showInfo={false}
          />
        </StatCard>
        <StatCard
          icon={<WarningOutlined />}
          title="Rủi ro"
          value={view.openRisks || 0}
          accent="linear-gradient(135deg,#C1502E,#E0795A)"
          footer={`${view.itemsInFab || 0} mục chế tạo`}
        />
      </div>
    </section>
  );
}
