"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerMgmt100620251336Stack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
class CustomerMgmt100620251336Stack extends cdk.Stack {
    constructor(scope, id, props) {
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
exports.CustomerMgmt100620251336Stack = CustomerMgmt100620251336Stack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tZXItbWdtdC0xMDA2MjAyNTEzMzYtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjdXN0b21lci1tZ210LTEwMDYyMDI1MTMzNi1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyxtRUFBcUQ7QUFDckQsK0RBQWlEO0FBQ2pELHVFQUF5RDtBQUN6RCx5REFBMkM7QUFHM0MsTUFBYSw2QkFBOEIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUMxRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLG1DQUFtQztRQUNuQyxNQUFNLGFBQWEsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLDJCQUEyQixFQUFFO1lBQzFFLFNBQVMsRUFBRSx3QkFBd0I7WUFDbkMsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDekUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVztZQUM3QyxZQUFZLEVBQUUsQ0FBQztZQUNmLGFBQWEsRUFBRSxDQUFDO1lBQ2hCLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDekMsQ0FBQyxDQUFDO1FBRUgsMkNBQTJDO1FBQzNDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQztZQUNwQyxTQUFTLEVBQUUsYUFBYTtZQUN4QixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNwRSxZQUFZLEVBQUUsQ0FBQztZQUNmLGFBQWEsRUFBRSxDQUFDO1NBQ2pCLENBQUMsQ0FBQztRQUVILHdCQUF3QjtR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USxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1FBQy9FLFFBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQztRQUNsRixRQUFRLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7UUFFckYscUJBQXFCO1FBQ3JCLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFO1lBQ2hDLEtBQUssRUFBRSxHQUFHLENBQUMsR0FBRztZQUNkLFdBQVcsRUFBRSw2QkFBNkI7U0FDM0MsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBMVlELHNFQTBZQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGNsYXNzIEN1c3RvbWVyTWdtdDEwMDYyMDI1MTMzNlN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gRHluYW1vREIgdGFibGUgZm9yIGN1c3RvbWVyIGRhdGFcbiAgICBjb25zdCBjdXN0b21lclRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdDdXN0b21lclRhYmxlMTAwNjIwMjUxMzM2Jywge1xuICAgICAgdGFibGVOYW1lOiAnY3VzdG9tZXJzLTEwMDYyMDI1MTMzNicsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2N1c3RvbWVySWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBST1ZJU0lPTkVELFxuICAgICAgcmVhZENhcGFjaXR5OiA1LFxuICAgICAgd3JpdGVDYXBhY2l0eTogNSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG5cbiAgICAvLyBHbG9iYWwgU2Vjb25kYXJ5IEluZGV4IGZvciBlbWFpbCBxdWVyaWVzXG4gICAgY3VzdG9tZXJUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdlbWFpbC1pbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2VtYWlsJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHJlYWRDYXBhY2l0eTogNSxcbiAgICAgIHdyaXRlQ2FwYWNpdHk6IDUsXG4gICAgfSk7XG5cbiAgICAvLyBMYW1iZGEgZXhlY3V0aW9uIHJvbGVcbiAgICBjb25zdCBsYW1iZGFSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdMYW1iZGFSb2xlMTAwNjIwMjUxMzM2Jywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXG4gICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdzZXJ2aWNlLXJvbGUvQVdTTGFtYmRhQmFzaWNFeGVjdXRpb25Sb2xlJyksXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgRHluYW1vREIgcGVybWlzc2lvbnMgdG8gTGFtYmRhIHJvbGVcbiAgICBjdXN0b21lclRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShsYW1iZGFSb2xlKTtcblxuICAgIC8vIENyZWF0ZSBDdXN0b21lciBMYW1iZGFcbiAgICBjb25zdCBjcmVhdGVDdXN0b21lckxhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0NyZWF0ZUN1c3RvbWVyMTAwNjIwMjUxMzM2Jywge1xuICAgICAgZnVuY3Rpb25OYW1lOiAnY3JlYXRlQ3VzdG9tZXItMTAwNjIwMjUxMzM2JyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgcm9sZTogbGFtYmRhUm9sZSxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21JbmxpbmUoYFxuICAgICAgICBjb25zdCB7IER5bmFtb0RCQ2xpZW50IH0gPSByZXF1aXJlKCdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInKTtcbiAgICAgICAgY29uc3QgeyBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LCBQdXRDb21tYW5kIH0gPSByZXF1aXJlKCdAYXdzLXNkay9saWItZHluYW1vZGInKTtcbiAgICAgICAgY29uc3QgeyByYW5kb21VVUlEIH0gPSByZXF1aXJlKCdjcnlwdG8nKTtcblxuICAgICAgICBjb25zdCBjbGllbnQgPSBuZXcgRHluYW1vREJDbGllbnQoe30pO1xuICAgICAgICBjb25zdCBkb2NDbGllbnQgPSBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LmZyb20oY2xpZW50KTtcblxuICAgICAgICBleHBvcnRzLmhhbmRsZXIgPSBhc3luYyAoZXZlbnQpID0+IHtcbiAgICAgICAgICBjb25zdCBoZWFkZXJzID0ge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXG4gICAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6ICdHRVQsIFBPU1QsIFBVVCwgREVMRVRFLCBPUFRJT05TJyxcbiAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ0NvbnRlbnQtVHlwZSwgQXV0aG9yaXphdGlvbicsXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGlmIChldmVudC5odHRwTWV0aG9kID09PSAnT1BUSU9OUycpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN0YXR1c0NvZGU6IDIwMCwgaGVhZGVycywgYm9keTogJycgfTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IEpTT04ucGFyc2UoZXZlbnQuYm9keSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFZhbGlkYXRpb25cbiAgICAgICAgICAgIGlmICghYm9keS5uYW1lIHx8ICFib2R5LmVtYWlsKSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNDAwLFxuICAgICAgICAgICAgICAgIGhlYWRlcnMsXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ05hbWUgYW5kIGVtYWlsIGFyZSByZXF1aXJlZCcgfSlcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY3VzdG9tZXIgPSB7XG4gICAgICAgICAgICAgIGN1c3RvbWVySWQ6IHJhbmRvbVVVSUQoKSxcbiAgICAgICAgICAgICAgbmFtZTogYm9keS5uYW1lLFxuICAgICAgICAgICAgICBlbWFpbDogYm9keS5lbWFpbCxcbiAgICAgICAgICAgICAgcGhvbmU6IGJvZHkucGhvbmUgfHwgJycsXG4gICAgICAgICAgICAgIGFkZHJlc3M6IGJvZHkuYWRkcmVzcyB8fCAnJyxcbiAgICAgICAgICAgICAgcmVnaXN0cmF0aW9uRGF0ZTogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgICBsYXN0TW9kaWZpZWQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgYXdhaXQgZG9jQ2xpZW50LnNlbmQobmV3IFB1dENvbW1hbmQoe1xuICAgICAgICAgICAgICBUYWJsZU5hbWU6ICdjdXN0b21lcnMtMTAwNjIwMjUxMzM2JyxcbiAgICAgICAgICAgICAgSXRlbTogY3VzdG9tZXIsXG4gICAgICAgICAgICAgIENvbmRpdGlvbkV4cHJlc3Npb246ICdhdHRyaWJ1dGVfbm90X2V4aXN0cyhlbWFpbCknXG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDIwMSxcbiAgICAgICAgICAgICAgaGVhZGVycyxcbiAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoY3VzdG9tZXIpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBpZiAoZXJyb3IubmFtZSA9PT0gJ0NvbmRpdGlvbmFsQ2hlY2tGYWlsZWRFeGNlcHRpb24nKSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNDAwLFxuICAgICAgICAgICAgICAgIGhlYWRlcnMsXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0VtYWlsIGFscmVhZHkgZXhpc3RzJyB9KVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNTAwLFxuICAgICAgICAgICAgICBoZWFkZXJzLFxuICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyB9KVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICBgKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IGN1c3RvbWVyVGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEdldCBDdXN0b21lcnMgTGFtYmRhXG4gICAgY29uc3QgZ2V0Q3VzdG9tZXJzTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnR2V0Q3VzdG9tZXJzMTAwNjIwMjUxMzM2Jywge1xuICAgICAgZnVuY3Rpb25OYW1lOiAnZ2V0Q3VzdG9tZXJzLTEwMDYyMDI1MTMzNicsXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgIHJvbGU6IGxhbWJkYVJvbGUsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tSW5saW5lKGBcbiAgICAgICAgY29uc3QgeyBEeW5hbW9EQkNsaWVudCB9ID0gcmVxdWlyZSgnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJyk7XG4gICAgICAgIGNvbnN0IHsgRHluYW1vREJEb2N1bWVudENsaWVudCwgU2NhbkNvbW1hbmQsIFF1ZXJ5Q29tbWFuZCB9ID0gcmVxdWlyZSgnQGF3cy1zZGsvbGliLWR5bmFtb2RiJyk7XG5cbiAgICAgICAgY29uc3QgY2xpZW50ID0gbmV3IER5bmFtb0RCQ2xpZW50KHt9KTtcbiAgICAgICAgY29uc3QgZG9jQ2xpZW50ID0gRHluYW1vREJEb2N1bWVudENsaWVudC5mcm9tKGNsaWVudCk7XG5cbiAgICAgICAgZXhwb3J0cy5oYW5kbGVyID0gYXN5bmMgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgY29uc3QgaGVhZGVycyA9IHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnOiAnR0VULCBQT1NULCBQVVQsIERFTEVURSwgT1BUSU9OUycsXG4gICAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycyc6ICdDb250ZW50LVR5cGUsIEF1dGhvcml6YXRpb24nLFxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBpZiAoZXZlbnQuaHR0cE1ldGhvZCA9PT0gJ09QVElPTlMnKSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdGF0dXNDb2RlOiAyMDAsIGhlYWRlcnMsIGJvZHk6ICcnIH07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNlYXJjaFRlcm0gPSBldmVudC5xdWVyeVN0cmluZ1BhcmFtZXRlcnM/LnNlYXJjaDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHNlYXJjaFRlcm0pIHtcbiAgICAgICAgICAgICAgLy8gU2VhcmNoIGJ5IGVtYWlsIHVzaW5nIEdTSVxuICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBkb2NDbGllbnQuc2VuZChuZXcgUXVlcnlDb21tYW5kKHtcbiAgICAgICAgICAgICAgICBUYWJsZU5hbWU6ICdjdXN0b21lcnMtMTAwNjIwMjUxMzM2JyxcbiAgICAgICAgICAgICAgICBJbmRleE5hbWU6ICdlbWFpbC1pbmRleCcsXG4gICAgICAgICAgICAgICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogJ2VtYWlsID0gOmVtYWlsJyxcbiAgICAgICAgICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgICAgICAgICAnOmVtYWlsJzogc2VhcmNoVGVybVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzLFxuICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3VsdC5JdGVtcyB8fCBbXSlcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIEdldCBhbGwgY3VzdG9tZXJzXG4gICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGRvY0NsaWVudC5zZW5kKG5ldyBTY2FuQ29tbWFuZCh7XG4gICAgICAgICAgICAgICAgVGFibGVOYW1lOiAnY3VzdG9tZXJzLTEwMDYyMDI1MTMzNidcbiAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzLFxuICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3VsdC5JdGVtcyB8fCBbXSlcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNTAwLFxuICAgICAgICAgICAgICBoZWFkZXJzLFxuICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyB9KVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICBgKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IGN1c3RvbWVyVGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEdldCBDdXN0b21lciBMYW1iZGFcbiAgICBjb25zdCBnZXRDdXN0b21lckxhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0dldEN1c3RvbWVyMTAwNjIwMjUxMzM2Jywge1xuICAgICAgZnVuY3Rpb25OYW1lOiAnZ2V0Q3VzdG9tZXItMTAwNjIwMjUxMzM2JyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgcm9sZTogbGFtYmRhUm9sZSxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21JbmxpbmUoYFxuICAgICAgICBjb25zdCB7IER5bmFtb0RCQ2xpZW50IH0gPSByZXF1aXJlKCdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInKTtcbiAgICAgICAgY29uc3QgeyBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LCBHZXRDb21tYW5kIH0gPSByZXF1aXJlKCdAYXdzLXNkay9saWItZHluYW1vZGInKTtcblxuICAgICAgICBjb25zdCBjbGllbnQgPSBuZXcgRHluYW1vREJDbGllbnQoe30pO1xuICAgICAgICBjb25zdCBkb2NDbGllbnQgPSBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LmZyb20oY2xpZW50KTtcblxuICAgICAgICBleHBvcnRzLmhhbmRsZXIgPSBhc3luYyAoZXZlbnQpID0+IHtcbiAgICAgICAgICBjb25zdCBoZWFkZXJzID0ge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXG4gICAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6ICdHRVQsIFBPU1QsIFBVVCwgREVMRVRFLCBPUFRJT05TJyxcbiAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ0NvbnRlbnQtVHlwZSwgQXV0aG9yaXphdGlvbicsXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGlmIChldmVudC5odHRwTWV0aG9kID09PSAnT1BUSU9OUycpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN0YXR1c0NvZGU6IDIwMCwgaGVhZGVycywgYm9keTogJycgfTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY3VzdG9tZXJJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzLmlkO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBkb2NDbGllbnQuc2VuZChuZXcgR2V0Q29tbWFuZCh7XG4gICAgICAgICAgICAgIFRhYmxlTmFtZTogJ2N1c3RvbWVycy0xMDA2MjAyNTEzMzYnLFxuICAgICAgICAgICAgICBLZXk6IHsgY3VzdG9tZXJJZCB9XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIGlmICghcmVzdWx0Lkl0ZW0pIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiA0MDQsXG4gICAgICAgICAgICAgICAgaGVhZGVycyxcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnQ3VzdG9tZXIgbm90IGZvdW5kJyB9KVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICAgICAgICAgIGhlYWRlcnMsXG4gICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3VsdC5JdGVtKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNTAwLFxuICAgICAgICAgICAgICBoZWFkZXJzLFxuICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyB9KVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICBgKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IGN1c3RvbWVyVGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFVwZGF0ZSBDdXN0b21lciBMYW1iZGFcbiAgICBjb25zdCB1cGRhdGVDdXN0b21lckxhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ1VwZGF0ZUN1c3RvbWVyMTAwNjIwMjUxMzM2Jywge1xuICAgICAgZnVuY3Rpb25OYW1lOiAndXBkYXRlQ3VzdG9tZXItMTAwNjIwMjUxMzM2JyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgcm9sZTogbGFtYmRhUm9sZSxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21JbmxpbmUoYFxuICAgICAgICBjb25zdCB7IER5bmFtb0RCQ2xpZW50IH0gPSByZXF1aXJlKCdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInKTtcbiAgICAgICAgY29uc3QgeyBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LCBVcGRhdGVDb21tYW5kIH0gPSByZXF1aXJlKCdAYXdzLXNkay9saWItZHluYW1vZGInKTtcblxuICAgICAgICBjb25zdCBjbGllbnQgPSBuZXcgRHluYW1vREJDbGllbnQoe30pO1xuICAgICAgICBjb25zdCBkb2NDbGllbnQgPSBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LmZyb20oY2xpZW50KTtcblxuICAgICAgICBleHBvcnRzLmhhbmRsZXIgPSBhc3luYyAoZXZlbnQpID0+IHtcbiAgICAgICAgICBjb25zdCBoZWFkZXJzID0ge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXG4gICAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6ICdHRVQsIFBPU1QsIFBVVCwgREVMRVRFLCBPUFRJT05TJyxcbiAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ0NvbnRlbnQtVHlwZSwgQXV0aG9yaXphdGlvbicsXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGlmIChldmVudC5odHRwTWV0aG9kID09PSAnT1BUSU9OUycpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN0YXR1c0NvZGU6IDIwMCwgaGVhZGVycywgYm9keTogJycgfTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY3VzdG9tZXJJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzLmlkO1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IEpTT04ucGFyc2UoZXZlbnQuYm9keSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFZhbGlkYXRpb25cbiAgICAgICAgICAgIGlmICghYm9keS5uYW1lIHx8ICFib2R5LmVtYWlsKSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNDAwLFxuICAgICAgICAgICAgICAgIGhlYWRlcnMsXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ05hbWUgYW5kIGVtYWlsIGFyZSByZXF1aXJlZCcgfSlcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZG9jQ2xpZW50LnNlbmQobmV3IFVwZGF0ZUNvbW1hbmQoe1xuICAgICAgICAgICAgICBUYWJsZU5hbWU6ICdjdXN0b21lcnMtMTAwNjIwMjUxMzM2JyxcbiAgICAgICAgICAgICAgS2V5OiB7IGN1c3RvbWVySWQgfSxcbiAgICAgICAgICAgICAgVXBkYXRlRXhwcmVzc2lvbjogJ1NFVCAjbmFtZSA9IDpuYW1lLCBlbWFpbCA9IDplbWFpbCwgcGhvbmUgPSA6cGhvbmUsIGFkZHJlc3MgPSA6YWRkcmVzcywgbGFzdE1vZGlmaWVkID0gOmxhc3RNb2RpZmllZCcsXG4gICAgICAgICAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lczoge1xuICAgICAgICAgICAgICAgICcjbmFtZSc6ICduYW1lJ1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgICAgICAgJzpuYW1lJzogYm9keS5uYW1lLFxuICAgICAgICAgICAgICAgICc6ZW1haWwnOiBib2R5LmVtYWlsLFxuICAgICAgICAgICAgICAgICc6cGhvbmUnOiBib2R5LnBob25lIHx8ICcnLFxuICAgICAgICAgICAgICAgICc6YWRkcmVzcyc6IGJvZHkuYWRkcmVzcyB8fCAnJyxcbiAgICAgICAgICAgICAgICAnOmxhc3RNb2RpZmllZCc6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBSZXR1cm5WYWx1ZXM6ICdBTExfTkVXJ1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICAgICAgICAgIGhlYWRlcnMsXG4gICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3VsdC5BdHRyaWJ1dGVzKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNTAwLFxuICAgICAgICAgICAgICBoZWFkZXJzLFxuICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyB9KVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICBgKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IGN1c3RvbWVyVGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIERlbGV0ZSBDdXN0b21lciBMYW1iZGFcbiAgICBjb25zdCBkZWxldGVDdXN0b21lckxhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0RlbGV0ZUN1c3RvbWVyMTAwNjIwMjUxMzM2Jywge1xuICAgICAgZnVuY3Rpb25OYW1lOiAnZGVsZXRlQ3VzdG9tZXItMTAwNjIwMjUxMzM2JyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgcm9sZTogbGFtYmRhUm9sZSxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21JbmxpbmUoYFxuICAgICAgICBjb25zdCB7IER5bmFtb0RCQ2xpZW50IH0gPSByZXF1aXJlKCdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInKTtcbiAgICAgICAgY29uc3QgeyBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LCBEZWxldGVDb21tYW5kIH0gPSByZXF1aXJlKCdAYXdzLXNkay9saWItZHluYW1vZGInKTtcblxuICAgICAgICBjb25zdCBjbGllbnQgPSBuZXcgRHluYW1vREJDbGllbnQoe30pO1xuICAgICAgICBjb25zdCBkb2NDbGllbnQgPSBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LmZyb20oY2xpZW50KTtcblxuICAgICAgICBleHBvcnRzLmhhbmRsZXIgPSBhc3luYyAoZXZlbnQpID0+IHtcbiAgICAgICAgICBjb25zdCBoZWFkZXJzID0ge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXG4gICAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6ICdHRVQsIFBPU1QsIFBVVCwgREVMRVRFLCBPUFRJT05TJyxcbiAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ0NvbnRlbnQtVHlwZSwgQXV0aG9yaXphdGlvbicsXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGlmIChldmVudC5odHRwTWV0aG9kID09PSAnT1BUSU9OUycpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN0YXR1c0NvZGU6IDIwMCwgaGVhZGVycywgYm9keTogJycgfTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY3VzdG9tZXJJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzLmlkO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBhd2FpdCBkb2NDbGllbnQuc2VuZChuZXcgRGVsZXRlQ29tbWFuZCh7XG4gICAgICAgICAgICAgIFRhYmxlTmFtZTogJ2N1c3RvbWVycy0xMDA2MjAyNTEzMzYnLFxuICAgICAgICAgICAgICBLZXk6IHsgY3VzdG9tZXJJZCB9XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICAgICAgICAgICAgaGVhZGVycyxcbiAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXNzYWdlOiAnQ3VzdG9tZXIgZGVsZXRlZCBzdWNjZXNzZnVsbHknIH0pXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBzdGF0dXNDb2RlOiA1MDAsXG4gICAgICAgICAgICAgIGhlYWRlcnMsXG4gICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIH0pXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIGApLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogY3VzdG9tZXJUYWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQVBJIEdhdGV3YXlcbiAgICBjb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdDdXN0b21lckFwaTEwMDYyMDI1MTMzNicsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiAnY3VzdG9tZXItYXBpLTEwMDYyMDI1MTMzNicsXG4gICAgICBkZXNjcmlwdGlvbjogJ0N1c3RvbWVyIE1hbmFnZW1lbnQgQVBJJyxcbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWdhdGV3YXkuQ29ycy5BTExfT1JJR0lOUyxcbiAgICAgICAgYWxsb3dNZXRob2RzOiBhcGlnYXRld2F5LkNvcnMuQUxMX01FVEhPRFMsXG4gICAgICAgIGFsbG93SGVhZGVyczogWydDb250ZW50LVR5cGUnLCAnQXV0aG9yaXphdGlvbiddLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEFQSSBHYXRld2F5IHJlc291cmNlcyBhbmQgbWV0aG9kc1xuICAgIGNvbnN0IGN1c3RvbWVycyA9IGFwaS5yb290LmFkZFJlc291cmNlKCdjdXN0b21lcnMnKTtcbiAgICBjdXN0b21lcnMuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRDdXN0b21lcnNMYW1iZGEpKTtcbiAgICBjdXN0b21lcnMuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oY3JlYXRlQ3VzdG9tZXJMYW1iZGEpKTtcblxuICAgIGNvbnN0IGN1c3RvbWVyID0gY3VzdG9tZXJzLmFkZFJlc291cmNlKCd7aWR9Jyk7XG4gICAgY3VzdG9tZXIuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRDdXN0b21lckxhbWJkYSkpO1xuICAgIGN1c3RvbWVyLmFkZE1ldGhvZCgnUFVUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odXBkYXRlQ3VzdG9tZXJMYW1iZGEpKTtcbiAgICBjdXN0b21lci5hZGRNZXRob2QoJ0RFTEVURScsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGRlbGV0ZUN1c3RvbWVyTGFtYmRhKSk7XG5cbiAgICAvLyBPdXRwdXQgdGhlIEFQSSBVUkxcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpVXJsJywge1xuICAgICAgdmFsdWU6IGFwaS51cmwsXG4gICAgICBkZXNjcmlwdGlvbjogJ0N1c3RvbWVyIE1hbmFnZW1lbnQgQVBJIFVSTCcsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==