const config = require('../config');

async function processTask(task) {
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));

  if (Math.random() < config.processing.failureRate) {
    throw new Error(`Simulated processing failure for task ${task.taskId}`);
  }

  return { success: true };
}

module.exports = { processTask };
