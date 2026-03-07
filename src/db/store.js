/**
 * In-memory store for local development when DynamoDB is not available.
 * Mimics the DynamoDB operations needed for the application.
 */
const tasks = new Map();

async function createTable() {
  return Promise.resolve();
}

async function put(task) {
  tasks.set(task.taskId, { ...task });
  return task;
}

async function get(taskId) {
  const task = tasks.get(taskId);
  return task ? { ...task } : null;
}

async function scan() {
  return Array.from(tasks.values()).map(t => ({ ...t }));
}

async function update(taskId, updates) {
  const existing = tasks.get(taskId);
  if (!existing) return null;
  const updated = { ...existing, ...updates };
  tasks.set(taskId, updated);
  return updated;
}

module.exports = {
  createTable,
  put,
  get,
  scan,
  update
};
