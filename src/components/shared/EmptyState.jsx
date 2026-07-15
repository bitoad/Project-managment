import React from 'react';

/**
 * EmptyState — shared empty/no-data component with optional CTA action.
 * icon: any React node (e.g. <InboxOutlined />)
 * title: short heading
 * description: longer explanation
 * action: { label, onClick } renders a primary CTA button
 */
export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="ds-empty-state">
      {icon && <div className="ds-empty-state-icon">{icon}</div>}
      {title && <div className="ds-empty-state-title">{title}</div>}
      {description && <div className="ds-empty-state-desc">{description}</div>}
      {action && (
        <button className="btn btn-primary" onClick={action.onClick} style={{ marginTop: 12 }}>
          {action.label}
        </button>
      )}
    </div>
  );
}
