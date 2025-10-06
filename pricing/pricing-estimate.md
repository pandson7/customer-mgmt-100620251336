# Customer Management System - Pricing Estimate

## Monthly Cost Breakdown (US East 1)

### Scenario 1: Small Business (100 customers, 1000 operations/month)

**DynamoDB**
- Provisioned Read Capacity: 5 RCU × $0.00013/hour × 730 hours = $0.47
- Provisioned Write Capacity: 5 WCU × $0.00065/hour × 730 hours = $2.37
- Storage: 0.1 GB × $0.25/GB = $0.03
- **DynamoDB Total: $2.87**

**Lambda**
- Requests: 1,000 × $0.0000002 = $0.0002
- Duration: 1,000 × 200ms × $0.0000166667 = $3.33
- **Lambda Total: $3.33**

**API Gateway**
- REST API Requests: 1,000 × $0.0000035 = $0.004
- **API Gateway Total: $0.004**

**Monthly Total: $6.20**

### Scenario 2: Medium Business (1,000 customers, 10,000 operations/month)

**DynamoDB**
- Provisioned Read Capacity: 5 RCU × $0.00013/hour × 730 hours = $0.47
- Provisioned Write Capacity: 5 WCU × $0.00065/hour × 730 hours = $2.37
- Storage: 1 GB × $0.25/GB = $0.25
- **DynamoDB Total: $3.09**

**Lambda**
- Requests: 10,000 × $0.0000002 = $0.002
- Duration: 10,000 × 200ms × $0.0000166667 = $33.33
- **Lambda Total: $33.33**

**API Gateway**
- REST API Requests: 10,000 × $0.0000035 = $0.035
- **API Gateway Total: $0.035**

**Monthly Total: $36.46**

### Scenario 3: Large Business (10,000 customers, 100,000 operations/month)

**DynamoDB**
- Provisioned Read Capacity: 10 RCU × $0.00013/hour × 730 hours = $0.95
- Provisioned Write Capacity: 10 WCU × $0.00065/hour × 730 hours = $4.75
- Storage: 10 GB × $0.25/GB = $2.50
- **DynamoDB Total: $8.20**

**Lambda**
- Requests: 100,000 × $0.0000002 = $0.02
- Duration: 100,000 × 200ms × $0.0000166667 = $333.33
- **Lambda Total: $333.35**

**API Gateway**
- REST API Requests: 100,000 × $0.0000035 = $0.35
- **API Gateway Total: $0.35**

**Monthly Total: $341.90**

## Cost Optimization Recommendations

1. **DynamoDB On-Demand**: For unpredictable workloads, consider switching to on-demand billing
2. **Lambda Optimization**: Optimize function memory and execution time to reduce costs
3. **API Caching**: Implement API Gateway caching for frequently accessed data
4. **CloudFront**: Add CloudFront CDN for static frontend assets

## Free Tier Benefits (First 12 months)

- **Lambda**: 1M free requests per month + 400,000 GB-seconds compute time
- **DynamoDB**: 25 GB storage + 25 RCU + 25 WCU
- **API Gateway**: 1M API calls per month

## Additional Considerations

- **Data Transfer**: Minimal costs for typical usage patterns
- **CloudWatch Logs**: Included in Lambda pricing
- **IAM**: No additional cost
- **CDK Deployment**: No additional cost (uses CloudFormation)

## Pricing Assumptions

- Average Lambda execution time: 200ms
- Average Lambda memory: 128MB
- Data transfer within AWS region
- No additional features like backup, global tables, etc.
- Prices as of October 2025 (subject to change)

*Note: This is an estimate. Actual costs may vary based on usage patterns, AWS pricing changes, and additional features used.*
