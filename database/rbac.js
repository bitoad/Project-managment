// Role & Permission model (P0 follow-up — MODELED ONLY, not enforced yet).
// Global role per user (see User.role in database/users.json).
// Route enforcement is deferred to Version 1.2 (RBAC per roadmap).

export const ROLES = ['admin', 'pm', 'engineer', 'supervisor', 'viewer'];

export const PERMISSIONS = [
  'project:read', 'project:write',
  'port:read', 'port:write',
  'item:read', 'item:write',
  'task:read', 'task:write',
  'cost:read', 'cost:write',
  'supplier:read', 'supplier:write',
  'quotation:read', 'quotation:write',
  'risk:read', 'risk:write',
  'team:read', 'team:write',
  'document:read', 'document:write', 'document:upload',
  'user:manage',
  'rbac:read',
  'dashboard:view', 'report:export',
];

// Matrix: role -> granted permission keys. '*' means all.
export const ROLE_PERMISSIONS = {
  admin: ['*'],
  pm: [
    'project:read', 'project:write',
    'port:read', 'port:write',
    'item:read', 'item:write',
    'task:read', 'task:write',
    'cost:read', 'cost:write',
    'supplier:read', 'supplier:write',
    'quotation:read', 'quotation:write',
    'risk:read', 'risk:write',
    'team:read', 'team:write',
    'document:read', 'document:write', 'document:upload',
    'dashboard:view', 'report:export', 'rbac:read',
  ],
  engineer: [
    'project:read',
    'port:read', 'port:write',
    'item:read', 'item:write',
    'task:read', 'task:write',
    'cost:read', 'cost:write',
    'supplier:read', 'quotation:read',
    'risk:read', 'risk:write',
    'team:read',
    'document:read', 'document:write', 'document:upload',
    'dashboard:view', 'report:export',
  ],
  supervisor: [
    'project:read',
    'port:read', 'item:read',
    'task:read', 'task:write',
    'cost:read', 'cost:write',
    'risk:read', 'risk:write',
    'document:read',
    'dashboard:view', 'report:export',
  ],
  viewer: [
    'project:read', 'port:read', 'item:read', 'task:read',
    'cost:read', 'supplier:read', 'quotation:read', 'risk:read',
    'team:read', 'document:read', 'dashboard:view',
  ],
};

export function roleCan(role, permission) {
  const granted = ROLE_PERMISSIONS[role] || [];
  return granted.includes('*') || granted.includes(permission);
}
