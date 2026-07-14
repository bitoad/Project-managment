import React from 'react';
import { Card, Statistic, Progress } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

/**
 * StatCard — thẻ thống kê chuẩn design system (dùng chung mọi tab).
 * icon + giá trị + label + (tuỳ chọn) progress / trend / footer.
 * Chỉ lớp UI, không chứa logic nghiệp vụ.
 */
const StatCard = ({ icon, accent, title, value, valueStyle, formatter, suffix, progress, footer, trend }) => (
  <Card className="ds-kpi" bordered={false} style={{ '--kpi-accent': accent, height: '100%' }}>
    <div className="ds-kpi-content">
      {icon && <div className="ds-kpi-icon" style={{ background: accent }}>{icon}</div>}
      <div className="ds-kpi-body">
        <Statistic
          title={title}
          value={value}
          formatter={formatter}
          suffix={suffix}
          valueStyle={{ ...valueStyle, fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums' }}
        />
        {progress != null && (
          <Progress percent={progress} showInfo={false} size="small" strokeColor={valueStyle?.color || '#2F5CE0'} style={{ marginTop: 6, marginBottom: 0 }} />
        )}
        {trend && (
          <div className="ds-kpi-footer" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className={trend.dir === 'up' ? 'ds-trend-up' : 'ds-trend-down'}>
              {trend.dir === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {trend.value}
            </span>
            <span>{trend.label}</span>
          </div>
        )}
        {!trend && footer && <div className="ds-kpi-footer">{footer}</div>}
      </div>
    </div>
  </Card>
);

export default StatCard;
