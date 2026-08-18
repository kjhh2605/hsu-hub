import { App } from 'aws-cdk-lib';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../lib/config';

function configuredApp(overrides: Record<string, string> = {}): App {
  return new App({
    context: {
      account: '123456789012',
      region: 'ap-northeast-2',
      domainName: 'hsu-hub.site',
      githubRepository: 'hsu-club/hsu-hub',
      githubEnvironment: 'production',
      operationsPrincipalArn: 'arn:aws:iam::123456789012:role/HsuHubOperators',
      alertEmail: 'alerts@example.com',
      kakaoSecretArn:
        'arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:/hsu-hub/production/kakao-AbCdEf',
      ...overrides,
    },
  });
}

describe('loadConfig', () => {
  it('derives the two production hostnames from the apex domain', () => {
    const config = loadConfig(configuredApp());

    expect(config.applicantHostname).toBe('hsu-hub.site');
    expect(config.adminHostname).toBe('admin.hsu-hub.site');
    expect(config.edgeRegion).toBe('us-east-1');
  });

  it('rejects a malformed account ID before synthesis', () => {
    expect(() => loadConfig(configuredApp({ account: 'local' }))).toThrow(
      /account must be a 12-digit AWS account ID/,
    );
  });

  it('rejects a repository that cannot form a GitHub OIDC subject', () => {
    expect(() => loadConfig(configuredApp({ githubRepository: 'hsu-hub' }))).toThrow(
      /githubRepository must use owner\/repository/,
    );
  });

  it('rejects an operations role from another account', () => {
    expect(() =>
      loadConfig(
        configuredApp({
          operationsPrincipalArn: 'arn:aws:iam::999999999999:role/HsuHubOperators',
        }),
      ),
    ).toThrow(/operationsPrincipalArn must be an IAM role in account/);
  });

  it('rejects regions outside the approved Seoul deployment', () => {
    expect(() => loadConfig(configuredApp({ region: 'us-west-2' }))).toThrow(
      /region must be ap-northeast-2/,
    );
  });

  it('requires a monitored alarm destination', () => {
    const app = new App({
      context: {
        account: '123456789012',
        region: 'ap-northeast-2',
        domainName: 'hsu-hub.site',
        githubRepository: 'hsu-club/hsu-hub',
        githubEnvironment: 'production',
        operationsPrincipalArn: 'arn:aws:iam::123456789012:role/HsuHubOperators',
      },
    });
    expect(() => loadConfig(app)).toThrow(/Missing required CDK context: alertEmail/);
  });

  it('requires the pre-created Kakao credential secret ARN', () => {
    const app = new App({
      context: {
        account: '123456789012',
        region: 'ap-northeast-2',
        domainName: 'hsu-hub.site',
        githubRepository: 'hsu-club/hsu-hub',
        githubEnvironment: 'production',
        operationsPrincipalArn: 'arn:aws:iam::123456789012:role/HsuHubOperators',
        alertEmail: 'alerts@example.com',
      },
    });
    expect(() => loadConfig(app)).toThrow(/Missing required CDK context: kakaoSecretArn/);
  });

  it('rejects a Kakao secret from another AWS account', () => {
    expect(() => loadConfig(configuredApp({
      kakaoSecretArn:
        'arn:aws:secretsmanager:ap-northeast-2:999999999999:secret:/hsu-hub/production/kakao-AbCdEf',
    }))).toThrow(/kakaoSecretArn must be a Secrets Manager secret in account 123456789012 and region ap-northeast-2/);
  });

  it('rejects a Kakao secret from another AWS region', () => {
    expect(() => loadConfig(configuredApp({
      kakaoSecretArn:
        'arn:aws:secretsmanager:us-east-1:123456789012:secret:/hsu-hub/production/kakao-AbCdEf',
    }))).toThrow(/kakaoSecretArn must be a Secrets Manager secret in account 123456789012 and region ap-northeast-2/);
  });
});
