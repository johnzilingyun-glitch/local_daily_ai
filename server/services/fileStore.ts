import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const HISTORY_DIR = path.join(DATA_DIR, 'history');
const LOG_FILE = path.join(DATA_DIR, 'optimization_log.json');

export async function ensureDirs() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(HISTORY_DIR, { recursive: true });
    try {
      await fs.access(LOG_FILE);
    } catch {
      await fs.writeFile(LOG_FILE, JSON.stringify([], null, 2));
    }
  } catch (err) {
    console.error('Failed to ensure data directories:', err);
  }
}

export async function saveAnalysis(type: 'market' | 'stock', data: any) {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const dataWithId = { ...data, id };
  const filename = `${type}_${new Date().toISOString().replace(/[:.]/g, '-')}_${Math.random().toString(36).substr(2, 5)}.json`;
  const filePath = path.join(HISTORY_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(dataWithId, null, 2));
  console.log(`Analysis saved to ${filePath} with ID ${id}`);
  return id;
}

export async function getHistory(limit: number = 10) {
  const files = await fs.readdir(HISTORY_DIR);
  const sortedFiles = files.sort().reverse().slice(0, limit);
  const history = await Promise.all(
    sortedFiles.map(async (f) => {
      const content = await fs.readFile(path.join(HISTORY_DIR, f), 'utf-8');
      return JSON.parse(content);
    })
  );
  return history;
}

export async function addLogEntry(field: string, oldValue: any, newValue: any, description: string) {
  try {
    let logs = [];
    try {
      const content = await fs.readFile(LOG_FILE, 'utf-8');
      logs = JSON.parse(content);
      if (!Array.isArray(logs)) logs = [];
    } catch (parseErr) {
      console.error('Failed to parse log file, resetting to empty array:', parseErr);
      logs = [];
    }

    logs.push({
      timestamp: new Date().toISOString(),
      field,
      oldValue,
      newValue,
      description
    });
    
    // Limit log size to prevent infinite growth issues (keep last 1000 entries)
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }

    await fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('Failed to add log entry:', err);
  }
}

export async function getLogs() {
  const content = await fs.readFile(LOG_FILE, 'utf-8');
  return JSON.parse(content);
}
