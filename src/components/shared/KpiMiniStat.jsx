import React from 'react';

// Ô số liệu tóm tắt nhỏ đặt phía trên biểu đồ (light theme).
// Dùng cho hàng KPI mini của các chart trong Dashboard.
const KpiMiniStat = ({ label, value, color }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <div
      style={{
        fontSize: 11, color: '#8c8c8c', marginBottom: 2,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 15, fontWeight: 700, color: color || '#1e293b',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}
    >
      {value}
    </div>
  </div>
);

export default KpiMiniStat;
