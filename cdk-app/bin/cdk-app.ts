#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CustomerMgmt100620251336Stack } from '../lib/customer-mgmt-100620251336-stack';

const app = new cdk.App();
new CustomerMgmt100620251336Stack(app, 'CustomerMgmt100620251336Stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});