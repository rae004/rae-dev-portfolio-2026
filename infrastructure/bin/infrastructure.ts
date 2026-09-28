#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { RaePortfolioStack } from '../lib/rae-portfolio-stack';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = new cdk.App();

// Get environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Environment-specific configuration
const devCertificateArn = process.env.DEV_CERTIFICATE_ARN;
const prodCertificateArn = process.env.PROD_CERTIFICATE_ARN;

console.log('Environment configuration:');
console.log('- AWS Account:', env.account || 'Not set');
console.log('- AWS Region:', env.region);
console.log('- Dev Certificate ARN:', devCertificateArn || 'Not set');
console.log('- Prod Certificate ARN:', prodCertificateArn || 'Not set');

// Development environment stack
new RaePortfolioStack(app, 'RaePortfolioDev', {
  env,
  envName: 'dev',
  domainName: process.env.DEV_DOMAIN || 'rae-dev.com',
  certificateArn: devCertificateArn,
  // Dev still runs the deprecated Bitnami blueprint. Do NOT drop this line
  // casually — changing the blueprint replaces the instance and its
  // database. Migrate deliberately (snapshot, reseed, re-upload media) before
  // 2026-11-19; see documentation/production_deployment_plan.md.
  wordpressBlueprintId: 'wordpress',
});

// Production environment stack.
//
// PROD_MANAGE_APEX_DNS=false lets the stack deploy while the apex and www
// records are still owned by the previous host (Vercel) — everything else
// (api., media., the distributions) comes up, and the apex/www ALIAS records
// are added on a later deploy once those manual records have been removed.
// See documentation/production_deployment_plan.md, Phase 1 and Phase 4.
new RaePortfolioStack(app, 'RaePortfolioProd', {
  env,
  envName: 'prod',
  domainName: process.env.PROD_DOMAIN || 'rae-dev.com',
  certificateArn: prodCertificateArn,
  manageApexDns: process.env.PROD_MANAGE_APEX_DNS !== 'false',
});