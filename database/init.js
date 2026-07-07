import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECTS_DIR = path.join(__dirname, 'projects');
const SEED_PATH = path.join(__dirname, 'seed-data.json');
const INDEX_PATH = path.join(PROJECTS_DIR, '_index.json');

if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

// Tạo project mặc định nếu chưa có
if (!fs.existsSync(INDEX_PATH)) {
  const defaultIndex = [{
    id: 'block-b-gas',
    name: 'Block B Gas Project',
    description: 'Golden Point Co., Ltd - PTSC M&C',
    createdAt: new Date().toISOString(),
  }];
  fs.writeFileSync(INDEX_PATH, JSON.stringify(defaultIndex, null, 2), 'utf-8');

  // Copy seed data
  const projectDir = path.join(PROJECTS_DIR, 'block-b-gas');
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
    const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'));
    fs.writeFileSync(path.join(projectDir, 'data.json'), JSON.stringify(seed, null, 2), 'utf-8');
  }

  console.log('[Init] Database initialized with default project.');
} else {
  console.log('[Init] Database already exists.');
}
