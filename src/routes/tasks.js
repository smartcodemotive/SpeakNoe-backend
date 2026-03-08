const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queueTask } = require('../services/taskProcessor');

function getDb() {
  const config = require('../config');
  const useDynamoDB = process.env.USE_DYNAMODB === 'true' || !!config.dynamodb.endpoint;
  return useDynamoDB ? require('../db/dynamodb') : require('../db/store');
}

const router = express.Router();

/**
 * POST /api/tasks
 * Submit a new task answer.
 */
router.post('/', async (req, res) => {
  try {
    const { taskId, answer } = req.body;

    if (!taskId || typeof answer !== 'string') {
      return res.status(400).json({
        error: 'Missing required fields: taskId and answer'
      });
    }

    const db = getDb();

    const task = {
      taskId,
      answer: answer.substring(0, 200),
      status: 'Pending',
      retries: 0,
      errorMessage: '-',
      createdAt: new Date().toISOString()
    };

    await db.put(task);
    queueTask(taskId);

    res.status(201).json(task);
  } catch (error) {
    console.error('Error submitting task:', error);
    res.status(500).json({ error: 'Failed to submit task' });
  }
});

/**
 * GET /api/tasks
 * Fetch status of all tasks.
 */
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const tasks = await db.scan();
    const sorted = tasks.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.json(sorted);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

module.exports = router;
