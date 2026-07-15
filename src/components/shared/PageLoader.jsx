import React from 'react';
import { Spin } from 'antd';

/**
 * PageLoader — consistent full-page / section loading indicator.
 * variant: "page" (full viewport center) | "section" (compact inline)
 */
export default function PageLoader({ variant = 'page', tip = 'Đang tải...' }) {
  if (variant === 'section') {
    return (
      <div className="ds-page-loader ds-page-loader--section">
        <Spin size="small" />
        {tip && <span className="ds-page-loader-tip">{tip}</span>}
      </div>
    );
  }
  return (
    <div className="ds-page-loader ds-page-loader--page">
      <Spin size="large" tip={tip}>
        <div className="ds-page-loader-content" />
      </Spin>
    </div>
  );
}
