import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class CustomerMgmt100620251336Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB table for customer data
    const customerTable = new dynamodb.Table(this, 'CustomerTable100620251336', {
      tableName: 'customers-100620251336',
      partitionKey: { name: 'customerId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Global Secondary Index for email queries
    customerTable.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      readCapacity: 5,
      writeCapacity: 5,
    });

    // Lambda execution role
    const lambdaRole = new iam.Role(this, 'LambdaRole100620251336', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB permissions to Lambda role
    customerTable.grantReadWriteData(lambdaRole);

    // Create Customer Lambda
    const createCustomerLambda = new lambda.Function(this, 'CreateCustomer100620251336', {
      functionName: 'createCustomer-100620251336',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
        const { randomUUID } = require('crypto');

        const client = new DynamoDBClient({});
        const docClient = DynamoDBDocumentClient.from(client);

        exports.handler = async (event) => {
          const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          };

          if (event.httpMethod === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
          }

          try {
            const body = JSON.parse(event.body);
            
            // Validation
            if (!body.name || !body.email) {
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Name and email are required' })
              };
            }

            const customer = {
              customerId: randomUUID(),
              name: body.name,
              email: body.email,
              phone: body.phone || '',
              address: body.address || '',
              registrationDate: new Date().toISOString(),
              lastModified: new Date().toISOString()
            };

            await docClient.send(new PutCommand({
              TableName: 'customers-100620251336',
              Item: customer,
              ConditionExpression: 'attribute_not_exists(email)'
            }));

            return {
              statusCode: 201,
              headers,
              body: JSON.stringify(customer)
            };
          } catch (error) {
            if (error.name === 'ConditionalCheckFailedException') {
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Email already exists' })
              };
            }
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Internal server error' })
            };
          }
        };
      `),
      environment: {
        TABLE_NAME: customerTable.tableName,
      },
    });

    // Get Customers Lambda
    const getCustomersLambda = new lambda.Function(this, 'GetCustomers100620251336', {
      functionName: 'getCustomers-100620251336',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

        const client = new DynamoDBClient({});
        const docClient = DynamoDBDocumentClient.from(client);

        exports.handler = async (event) => {
          const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          };

          if (event.httpMethod === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
          }

          try {
            const searchTerm = event.queryStringParameters?.search;
            
            if (searchTerm) {
              // Search by email using GSI
              const result = await docClient.send(new QueryCommand({
                TableName: 'customers-100620251336',
                IndexName: 'email-index',
                KeyConditionExpression: 'email = :email',
                ExpressionAttributeValues: {
                  ':email': searchTerm
                }
              }));
              return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result.Items || [])
              };
            } else {
              // Get all customers
              const result = await docClient.send(new ScanCommand({
                TableName: 'customers-100620251336'
              }));
              return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result.Items || [])
              };
            }
          } catch (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Internal server error' })
            };
          }
        };
      `),
      environment: {
        TABLE_NAME: customerTable.tableName,
      },
    });

    // Get Customer Lambda
    const getCustomerLambda = new lambda.Function(this, 'GetCustomer100620251336', {
      functionName: 'getCustomer-100620251336',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

        const client = new DynamoDBClient({});
        const docClient = DynamoDBDocumentClient.from(client);

        exports.handler = async (event) => {
          const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          };

          if (event.httpMethod === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
          }

          try {
            const customerId = event.pathParameters.id;
            
            const result = await docClient.send(new GetCommand({
              TableName: 'customers-100620251336',
              Key: { customerId }
            }));

            if (!result.Item) {
              return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Customer not found' })
              };
            }

            return {
              statusCode: 200,
              headers,
              body: JSON.stringify(result.Item)
            };
          } catch (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Internal server error' })
            };
          }
        };
      `),
      environment: {
        TABLE_NAME: customerTable.tableName,
      },
    });

    // Update Customer Lambda
    const updateCustomerLambda = new lambda.Function(this, 'UpdateCustomer100620251336', {
      functionName: 'updateCustomer-100620251336',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

        const client = new DynamoDBClient({});
        const docClient = DynamoDBDocumentClient.from(client);

        exports.handler = async (event) => {
          const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          };

          if (event.httpMethod === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
          }

          try {
            const customerId = event.pathParameters.id;
            const body = JSON.parse(event.body);
            
            // Validation
            if (!body.name || !body.email) {
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Name and email are required' })
              };
            }

            const result = await docClient.send(new UpdateCommand({
              TableName: 'customers-100620251336',
              Key: { customerId },
              UpdateExpression: 'SET #name = :name, email = :email, phone = :phone, address = :address, lastModified = :lastModified',
              ExpressionAttributeNames: {
                '#name': 'name'
              },
              ExpressionAttributeValues: {
                ':name': body.name,
                ':email': body.email,
                ':phone': body.phone || '',
                ':address': body.address || '',
                ':lastModified': new Date().toISOString()
              },
              ReturnValues: 'ALL_NEW'
            }));

            return {
              statusCode: 200,
              headers,
              body: JSON.stringify(result.Attributes)
            };
          } catch (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Internal server error' })
            };
          }
        };
      `),
      environment: {
        TABLE_NAME: customerTable.tableName,
      },
    });

    // Delete Customer Lambda
    const deleteCustomerLambda = new lambda.Function(this, 'DeleteCustomer100620251336', {
      functionName: 'deleteCustomer-100620251336',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

        const client = new DynamoDBClient({});
        const docClient = DynamoDBDocumentClient.from(client);

        exports.handler = async (event) => {
          const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          };

          if (event.httpMethod === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
          }

          try {
            const customerId = event.pathParameters.id;
            
            await docClient.send(new DeleteCommand({
              TableName: 'customers-100620251336',
              Key: { customerId }
            }));

            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ message: 'Customer deleted successfully' })
            };
          } catch (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Internal server error' })
            };
          }
        };
      `),
      environment: {
        TABLE_NAME: customerTable.tableName,
      },
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'CustomerApi100620251336', {
      restApiName: 'customer-api-100620251336',
      description: 'Customer Management API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // API Gateway resources and methods
    const customers = api.root.addResource('customers');
    customers.addMethod('GET', new apigateway.LambdaIntegration(getCustomersLambda));
    customers.addMethod('POST', new apigateway.LambdaIntegration(createCustomerLambda));

    const customer = customers.addResource('{id}');
    customer.addMethod('GET', new apigateway.LambdaIntegration(getCustomerLambda));
    customer.addMethod('PUT', new apigateway.LambdaIntegration(updateCustomerLambda));
    customer.addMethod('DELETE', new apigateway.LambdaIntegration(deleteCustomerLambda));

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Customer Management API URL',
    });
  }
}
