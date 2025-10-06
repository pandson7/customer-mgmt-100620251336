# Customer Information Management System

A full-stack customer management application with CRUD operations, built using AWS serverless architecture and React frontend.

## Architecture

- **Frontend**: React TypeScript application with responsive design
- **Backend**: AWS Lambda functions for business logic
- **Database**: Amazon DynamoDB with provisioned capacity
- **API**: Amazon API Gateway with REST endpoints
- **Infrastructure**: AWS CDK for Infrastructure as Code

## Features

- ✅ Create new customer records
- ✅ View all customers in a table format
- ✅ Search customers by email
- ✅ Update existing customer information
- ✅ Delete customer records with confirmation
- ✅ Responsive web interface
- ✅ Form validation and error handling
- ✅ Real-time data persistence

## API Endpoints

- `GET /customers` - List all customers
- `GET /customers?search={email}` - Search customers by email
- `GET /customers/{id}` - Get specific customer
- `POST /customers` - Create new customer
- `PUT /customers/{id}` - Update existing customer
- `DELETE /customers/{id}` - Delete customer

## Customer Data Model

```json
{
  "customerId": "uuid",
  "name": "string (required)",
  "email": "string (required, unique)",
  "phone": "string (optional)",
  "address": "string (optional)",
  "registrationDate": "ISO 8601 timestamp",
  "lastModified": "ISO 8601 timestamp"
}
```

## Deployment

### Backend (CDK)

```bash
cd cdk-app
npm install
npm run build
npx cdk deploy
```

### Frontend (React)

```bash
cd frontend
npm install
npm start
```

## API Base URL

```
https://tg9xgueenl.execute-api.us-east-1.amazonaws.com/prod/
```

## Testing

The system has been tested with sample data and all CRUD operations are working correctly:

1. **Create**: Successfully creates customers with validation
2. **Read**: Lists all customers and supports email search
3. **Update**: Updates customer information with proper validation
4. **Delete**: Removes customers from the database

## Sample Test Data

The system includes test customers:
- John Doe (john.doe@example.com)
- Jane Smith (jane.smith@example.com)
- Bob Johnson (bob.johnson@example.com)

## Security Features

- Input validation on both client and server side
- CORS configuration for secure cross-origin requests
- IAM roles with least privilege access
- NoSQL database prevents SQL injection attacks

## Performance

- Serverless architecture scales automatically
- DynamoDB provisioned capacity for consistent performance
- Global Secondary Index for efficient email searches
- Sub-second response times for all operations

## Project Structure

```
customer-mgmt-100620251336/
├── specs/
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── cdk-app/
│   ├── lib/
│   │   └── customer-mgmt-100620251336-stack.ts
│   ├── bin/
│   │   └── cdk-app.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## Technologies Used

- **Frontend**: React, TypeScript, Axios, CSS3
- **Backend**: AWS Lambda, Node.js 18.x
- **Database**: Amazon DynamoDB
- **API**: Amazon API Gateway
- **Infrastructure**: AWS CDK
- **Development**: npm, Create React App
