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
});

// Production environment stack  
new RaePortfolioStack(app, 'RaePortfolioProd', {
  env,
  envName: 'prod',
  domainName: process.env.PROD_DOMAIN || 'raeengel.dev',
  certificateArn: prodCertificateArn,
});