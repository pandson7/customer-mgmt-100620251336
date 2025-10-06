# Customer Management System Architecture

## System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   API Gateway   │    │  Lambda Functions│
│   (Frontend)    │───▶│   (REST API)    │───▶│   (Business Logic)│
│                 │    │                 │    │                 │
│ - Customer List │    │ GET /customers  │    │ - createCustomer│
│ - Customer Form │    │ POST /customers │    │ - getCustomers  │
│ - Delete Modal  │    │ PUT /customers  │    │ - getCustomer   │
│ - Search        │    │ DELETE /customers│   │ - updateCustomer│
└─────────────────┘    └─────────────────┘    │ - deleteCustomer│
                                              └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   DynamoDB      │
                                              │   (Database)    │
                                              │                 │
                                              │ - customers     │
                                              │ - email-index   │
                                              │ - provisioned   │
                                              └─────────────────┘
```

## Data Flow

1. **User Interaction**: User interacts with React frontend
2. **API Request**: Frontend makes HTTP requests to API Gateway
3. **Lambda Execution**: API Gateway triggers appropriate Lambda function
4. **Database Operation**: Lambda function performs CRUD operations on DynamoDB
5. **Response**: Data flows back through the same path to the user

## AWS Services Used

- **Amazon API Gateway**: RESTful API endpoints with CORS support
- **AWS Lambda**: Serverless compute for business logic (5 functions)
- **Amazon DynamoDB**: NoSQL database with provisioned capacity
- **AWS IAM**: Identity and access management for secure permissions
- **AWS CloudWatch**: Logging and monitoring (automatic)

## Security Architecture

- **IAM Roles**: Lambda execution role with minimal DynamoDB permissions
- **CORS**: Configured for secure cross-origin requests
- **Input Validation**: Both client-side and server-side validation
- **No Hardcoded Credentials**: All access through IAM roles

## Scalability Design

- **Serverless**: Automatic scaling based on demand
- **DynamoDB**: Provisioned capacity with auto-scaling potential
- **API Gateway**: Built-in throttling and rate limiting
- **Stateless**: No server state, fully scalable architecture
