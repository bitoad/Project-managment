// Migration script: JSON (data.json) → SQLite (app.sqlite)
// Run once: node database/migrateToSqlite.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getIndex } from './db.js';
import { saveEntity, createProjectRow, ENTITY_NAMES, close } from './sqliteStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.join(__dirname, 'projects');

function migrateProject(projectId) {
  const dataPath = path.join(PROJECTS_DIR, projectId, 'data.json');
  if (!fs.existsSync(dataPath)) {
    console.log(`  SKIP: ${projectId} — no data.json`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const meta = data.meta || {};

  // Create project row in SQLite
  createProjectRow(
    projectId,
    meta.projectName || projectId,
    meta.client || '',
    meta.createdAt || new Date().toISOString()
  );

  // Save each entity (meta and settings are objects, wrap in arrays)
  let totalRows = 0;
  for (const entity of ENTITY_NAMES) {
    let arr = data[entity];
    if (entity === 'meta' || entity === 'settings') {
      // These are objects in JSON, wrap in single-element arrays for SQLite
      arr = arr ? [arr] : [];
    }
    if (Array.isArray(arr) && arr.length > 0) {
      saveEntity(projectId, entity, arr);
      console.log(`    ${entity}: ${arr.length} rows`);
      totalRows += arr.length;
    }
  }

  console.log(`  OK: ${projectId} — ${totalRows} total rows migrated`);
}

// Main
const projects = getIndex();
console.log(`Migrating ${projects.length} projects to SQLite...\n`);

for (const p of projects) {
  console.log(`[${p.id}]`);
  migrateProject(p.id);
}

close();
console.log('\nMigration complete.');
