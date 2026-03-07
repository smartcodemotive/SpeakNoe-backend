const {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand
} = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand
} = require('@aws-sdk/lib-dynamodb');
const config = require('../config');

let client;
let docClient;

function getClient() {
  if (!client) {
    const clientConfig = {
      region: config.dynamodb.region
    };
    if (config.dynamodb.endpoint) {
      clientConfig.endpoint = config.dynamodb.endpoint;
    }
    client = new DynamoDBClient(clientConfig);
    docClient = DynamoDBDocumentClient.from(client);
  }
  return { client, docClient };
}

async function createTableIfNotExists() {
  const { client } = getClient();
  const tableName = config.dynamodb.tableName;

  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return;
  } catch (err) {
    if (err.name !== 'ResourceNotFoundException') throw err;
  }

  await client.send(new CreateTableCommand({
    TableName: tableName,
    KeySchema: [{ AttributeName: 'taskId', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'taskId', AttributeType: 'S' }],
    BillingMode: 'PAY_PER_REQUEST'
  }));

  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function put(task) {
  const { docClient } = getClient();
  await docClient.send(new PutCommand({
    TableName: config.dynamodb.tableName,
    Item: task
  }));
  return task;
}

async function get(taskId) {
  const { docClient } = getClient();
  const result = await docClient.send(new GetCommand({
    TableName: config.dynamodb.tableName,
    Key: { taskId }
  }));
  return result.Item || null;
}

async function scan() {
  const { docClient } = getClient();
  const result = await docClient.send(new ScanCommand({
    TableName: config.dynamodb.tableName
  }));
  return result.Items || [];
}

async function update(taskId, updates) {
  const { docClient } = getClient();
  const updateExpressions = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  Object.entries(updates).forEach(([key, value], i) => {
    const placeholder = `#f${i}`;
    const valuePlaceholder = `:v${i}`;
    updateExpressions.push(`${placeholder} = ${valuePlaceholder}`);
    expressionAttributeNames[placeholder] = key;
    expressionAttributeValues[valuePlaceholder] = value;
  });

  const result = await docClient.send(new UpdateCommand({
    TableName: config.dynamodb.tableName,
    Key: { taskId },
    UpdateExpression: 'SET ' + updateExpressions.join(', '),
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  }));

  return result.Attributes;
}

module.exports = {
  createTableIfNotExists,
  put,
  get,
  scan,
  update
};
