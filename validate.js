// Input validation helpers for API write endpoints (P2 — ADR-015).
// Minimal, non-breaking: only rejects when a required field is missing/empty,
// or when a provided numeric field is out of its safe range. Extra fields are
// passed through untouched so existing frontend payloads keep working.

export class ValidationError extends Error {
  constructor(details) {
    super('Dữ liệu không hợp lệ');
    this.code = 'VALIDATION';
    this.status = 400;
    this.details = details;
  }
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

const CHECKS = {
  string: (v) => typeof v === 'string' && v.trim().length > 0,
  stringOpt: (v) => v === undefined || v === null || v === '' || typeof v === 'string',
  num: (v) => typeof v === 'number' && !isNaN(v),
  nonNegNum: (v) => typeof v === 'number' && !isNaN(v) && v >= 0,
  percent: (v) => typeof v === 'number' && !isNaN(v) && v >= 0 && v <= 100,
  int1to5: (v) => typeof v === 'number' && !isNaN(v) && v >= 1 && v <= 5,
};

const MESSAGES = {
  string: 'phải là chuỗi không rỗng',
  stringOpt: 'phải là chuỗi',
  num: 'phải là số',
  nonNegNum: 'phải là số >= 0',
  percent: 'phải là số từ 0 đến 100',
  int1to5: 'phải là số từ 1 đến 5',
};

// spec: { field: 'type' } or { field: { type, required } }
// Default for POST (create) is required:true; for PUT (update) pass required:false.
export function validateBody(spec) {
  return (req, res, next) => {
    const body = req.body;
    if (!isPlainObject(body)) {
      return next(new ValidationError({ _body: 'body phải là object JSON' }));
    }
    const errors = {};
    for (const [field, rule] of Object.entries(spec)) {
      const normalized = typeof rule === 'string' ? { type: rule, required: true } : rule;
      const check = CHECKS[normalized.type];
      const required = normalized.required !== false;
      const val = body[field];
      if (val === undefined || val === null || val === '') {
        if (required) errors[field] = 'bắt buộc';
        continue;
      }
      if (check && !check(val)) errors[field] = MESSAGES[normalized.type];
    }
    if (Object.keys(errors).length > 0) return next(new ValidationError(errors));
    next();
  };
}
