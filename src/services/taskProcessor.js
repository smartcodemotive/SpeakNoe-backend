const config = require('../config');
const { processTask } = require('../lambda/handler');

function getDb() {
  const useDynamoDB = process.env.USE_DYNAMODB === 'true' || !!config.dynamodb.endpoint;
  return useDynamoDB ? require('../db/dynamodb') : require('../db/store');
}

function getBackoffDelay(retryCount) {
  return config.processing.baseDelayMs * Math.pow(2, retryCount);
}

async function processTaskWithRetry(taskId) {
  const db = getDb();
  const maxRetries = config.processing.maxRetries;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const task = await db.get(taskId);
      if (!task || task.status !== 'Pending') return;

      await processTask(task);

      await db.update(taskId, {
        status: 'Processed',
        processedAt: new Date().toISOString(),
        retries: attempt
      });
      return;
    } catch (error) {
      const retries = attempt;
      const isLastAttempt = attempt === maxRetries;

      await db.update(taskId, {
        status: isLastAttempt ? 'Failed' : 'Pending',
        retries: retries + 1,
        errorMessage: isLastAttempt ? error.message : '-',
        lastAttemptAt: new Date().toISOString()
      });

      if (isLastAttempt) return;

      const delay = getBackoffDelay(attempt + 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

function queueTask(taskId) {
  setImmediate(() => processTaskWithRetry(taskId));
}

module.exports = {
  queueTask,
  processTaskWithRetry
};
