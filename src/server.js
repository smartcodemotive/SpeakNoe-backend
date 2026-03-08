const express = require('express');
const cors = require('cors');
const config = require('./config');
const tasksRouter = require('./routes/tasks');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/tasks', tasksRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  const useDynamoDB = process.env.USE_DYNAMODB === 'true' || !!config.dynamodb.endpoint;
  if (useDynamoDB) {
    try {
      const db = require('./db/dynamodb');
      await db.createTableIfNotExists();
      console.log('DynamoDB table ready');
    } catch (err) {
      console.error('DynamoDB setup failed, falling back to in-memory store:', err.message);
      process.env.USE_DYNAMODB = 'false';
    }
  } else {
    console.log('Using in-memory store for development');
  }

  app.listen(config.port, () => {
    console.log(`Backend running on http://localhost:${config.port}`);
  });
}

start().catch(console.error);
