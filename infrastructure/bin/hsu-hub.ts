#!/usr/bin/env node
import 'source-map-support/register';
import { App, Tags, Validations } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { loadConfig } from '../lib/config';
import { DnsCertificateStack } from '../lib/dns-certificate-stack';
import { PlatformStack } from '../lib/platform-stack';

const app = new App();
const config = loadConfig(app);
app.node.setContext(
  `availability-zones:account=${config.account}:region=${config.region}`,
  [`${config.region}a`, `${config.region}c`],
);

const dns = new DnsCertificateStack(app, 'HsuHubDnsCertificate', {
  env: { account: config.account, region: config.edgeRegion },
  config,
  crossRegionReferences: true,
  terminationProtection: true,
  description: 'HSU Hub Route 53 hosted zone and us-east-1 CloudFront certificate',
});
const platform = new PlatformStack(app, 'HsuHubPlatform', {
  env: { account: config.account, region: config.region },
  config,
  hostedZone: dns.hostedZone,
  viewerCertificate: dns.viewerCertificate,
  crossRegionReferences: true,
  terminationProtection: true,
  description: 'HSU Hub production pilot infrastructure',
});

for (const stack of [dns, platform]) {
  Tags.of(stack).add('Application', 'hsu-hub');
  Tags.of(stack).add('Environment', 'production');
  Tags.of(stack).add('ManagedBy', 'aws-cdk');
}

Validations.of(app).addPlugins(new AwsSolutionsChecks(app, {
  verbose: true,
  writeSuppressionsToCloudFormation: true,
}));
