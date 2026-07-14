import React from 'react';
import { Card } from 'antd';

// Card biểu đồ dùng chung: tiêu đề kèm icon theo pattern .ds-card-head-icon.
// Mọi prop khác (extra, style, styles, size...) được truyền thẳng xuống antd Card.
const ChartCard = ({ icon, title, children, className = 'ds-chart-card', bordered = false, ...rest }) => {
  const head = icon ? <span className="ds-card-head-icon">{icon} {title}</span> : title;
  return (
    <Card className={className} bordered={bordered} title={head} {...rest}>
      {children}
    </Card>
  );
};

export default ChartCard;
