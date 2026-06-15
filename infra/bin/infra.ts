#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { InfraStack } from '../lib/infra-stack';

const app = new cdk.App();
new InfraStack(app, 'FractionsTutorialStack', {
  // Use the account/region implied by the current AWS CLI configuration.
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: "Babushka's Fractions tutorial — static site hosting (S3 + CloudFront)",
});
