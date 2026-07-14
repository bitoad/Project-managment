import React from 'react';
import { Card, Statistic, Progress } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const Sparkline = ({ data, color }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100, h = 34, pad = 3;
  const pts = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
      const y = h - pad - ((v - min) / range) * (h - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 34, display: 'block', marginTop: 10 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
    </svg>
  );
};

const KpiCard = ({ icon, accent, title, value, valueStyle, formatter, suffix, progress, footer, trend, spark, sparkColor }) => (
  <Card className="ds-kpi" bordered={false} style={{ '--kpi-accent': accent, height: '100%' }}>
    <div className="ds-kpi-content">
      <div className="ds-kpi-icon" style={{ background: accent }}>{icon}</div>
      <div className="ds-kpi-body">
        <Statistic
          title={title}
          value={value}
          formatter={formatter}
          suffix={suffix}
          valueStyle={{ ...valueStyle, fontFamily: "var(--font-num)", fontVariantNumeric: 'tabular-nums' }}
        />
        {progress != null && (
          <Progress percent={progress} showInfo={false} size="small" strokeColor={valueStyle?.color || '#2F5CE0'} style={{ marginTop: 6, marginBottom: 0 }} />
        )}
        {trend && (
          <div className="ds-kpi-footer" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className={
              trend.tone === 'bad' ? 'ds-trend-down'
                : trend.tone === 'good' ? 'ds-trend-up'
                  : (trend.dir === 'up' ? 'ds-trend-up' : 'ds-trend-down')
            }>
              {trend.dir === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {trend.value}
            </span>
            <span>{trend.label}</span>
          </div>
        )}
        {!trend && footer && <div className="ds-kpi-footer">{footer}</div>}
        <Sparkline data={spark} color={sparkColor || accent} />
      </div>
    </div>
  </Card>
);

export default KpiCard;
