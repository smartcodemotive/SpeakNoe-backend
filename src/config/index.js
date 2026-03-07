module.exports = {
  port: process.env.PORT || 3000,
  dynamodb: {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.DYNAMODB_ENDPOINT || undefined, // Use undefined for real AWS, or 'http://localhost:8000' for DynamoDB Local
    tableName: process.env.DYNAMODB_TABLE || 'fault-tolerant-tasks'
  },
  processing: {
    maxRetries: 2,
    failureRate: 0.3,
    baseDelayMs: 500,
  }
};
