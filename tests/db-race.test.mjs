// Race-condition regression test (hotfix ADR-011).
// Simulates 2 concurrent write requests (addItem) to the SAME project and
// verifies no data is lost (both changes applied, not overwritten).
//
// Run: node tests/db-race.test.mjs
import * as db from '../database/db.js';
import fs from 'fs';

const PROJECT_NAME = '__race_test__';

async function main() {
  const project = db.createProject(PROJECT_NAME, 'race test');
  const id = project.id;

  // Two "simultaneous" writers adding one item each.
  const writeA = db.addItem(id, {
    code: 'A', name: 'Item A', port: 'PORT 1', qty: 1,
    unitCost: 1, unitPrice: 1, status: 'Engineering', progress: 0,
  });
  const writeB = db.addItem(id, {
    code: 'B', name: 'Item B', port: 'PORT 1', qty: 1,
    unitCost: 1, unitPrice: 1, status: 'Engineering', progress: 0,
  });

  // Wait for async file writes to flush.
  await new Promise((r) => setTimeout(r, 200));

  const items = db.getItems(id);
  const onDisk = JSON.parse(fs.readFileSync(`database/projects/${id}/data.json`, 'utf-8')).items;

  const cacheOk = items.length === 2;
  const diskOk = onDisk.length === 2;

  console.log(`Cache items: ${items.length} (expected 2) -> ${cacheOk ? 'PASS' : 'FAIL'}`);
  console.log(`Disk  items: ${onDisk.length} (expected 2) -> ${diskOk ? 'PASS' : 'FAIL'}`);

  db.deleteProject(id);
  await new Promise((r) => setTimeout(r, 100));

  const ok = cacheOk && diskOk;
  console.log(ok ? '\nRESULT: PASS — no data loss under concurrent writes' : '\nRESULT: FAIL — data lost');
  process.exit(ok ? 0 : 1);
}

main();
