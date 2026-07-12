// One-time admin seed script (P0 real authentication).
// Run ONCE after deploy / first setup:
//   ADMIN_USERNAME=admin ADMIN_PASSWORD="your-strong-pass" node seed-admin.js
// Creates the first User in database/users.json (bcrypt-hashed password).
// Does NOT print the password. Re-running is a no-op if users already exist.

import { getUsers, createUser, hashPassword } from './database/db.js';

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;

if (!username || !password) {
  console.error('[seed-admin] Thiếu biến môi trường. Chạy:');
  console.error("  ADMIN_USERNAME=admin ADMIN_PASSWORD='<mat-khau>' node seed-admin.js");
  process.exit(1);
}

if (getUsers().length > 0) {
  console.error('[seed-admin] Đã có user trong hệ thống — không seed lại.');
  process.exit(0);
}

const passwordHash = hashPassword(password);
createUser({ username, passwordHash, role: 'admin', teamId: null, name: 'Administrator' });

// Allow the async write (withWriteLock) to flush before exit.
await new Promise((r) => setTimeout(r, 200));
console.log('[seed-admin] Đã tạo user admin:', username, '(role: admin).');
process.exit(0);
