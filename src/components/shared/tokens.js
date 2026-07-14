// Chart/format tokens dùng chung cho Dashboard & các biểu đồ
// Tuân theo Design.md: light theme, blue palette.

// Format tiền rút gọn có 1 chữ số thập phân — dễ đọc trên biểu đồ
export const fmtChart = (n) => {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  if (abs >= 1e9) return (v / 1e9).toFixed(2) + ' Tỷ';
  if (abs >= 1e6) return (v / 1e6).toFixed(1) + ' Tr';
  if (abs >= 1e3) return (v / 1e3).toFixed(0) + ' K';
  return String(v);
};

// Ngưỡng đánh giá lệch ngân sách (theo % vượt kế hoạch)
export const VARIANCE_COLOR = { critical: '#ff4d4f', warning: '#fa8c16', safe: '#52c41a' };
export const varianceLevel = (pct) => (pct > 20 ? 'critical' : pct > 10 ? 'warning' : 'safe');
export const varianceColor = (pct) => VARIANCE_COLOR[varianceLevel(pct)];
