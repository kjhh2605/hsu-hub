import { App } from 'aws-cdk-lib';

export interface HsuHubConfig {
  readonly account: string;
  readonly region: string;
  readonly edgeRegion: 'us-east-1';
  readonly domainName: string;
  readonly applicantHostname: string;
  readonly adminHostname: string;
  readonly githubRepository: string;
  readonly githubEnvironment: string;
  readonly operationsPrincipalArn: string;
  readonly alertEmail: string;
  readonly kakaoSecretArn: string;
}

function requiredContext(app: App, key: string): string {
  const value = app.node.tryGetContext(key);
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required CDK context: ${key}`);
  }
  return value.trim();
}

export function loadConfig(app: App): HsuHubConfig {
  const account = requiredContext(app, 'account');
  const region = requiredContext(app, 'region');
  const domainName = requiredContext(app, 'domainName').toLowerCase();
  const githubRepository = requiredContext(app, 'githubRepository');
  const githubEnvironment = requiredContext(app, 'githubEnvironment');
  const operationsPrincipalArn = requiredContext(app, 'operationsPrincipalArn');
  const alertEmail = requiredContext(app, 'alertEmail');
  const kakaoSecretArn = requiredContext(app, 'kakaoSecretArn');

  if (!/^\d{12}$/.test(account)) {
    throw new Error('account must be a 12-digit AWS account ID');
  }
  if (!/^[a-z]{2}(?:-gov)?-[a-z]+-\d$/.test(region)) {
    throw new Error('region must be a valid AWS region identifier');
  }
  if (region !== 'ap-northeast-2') {
    throw new Error('region must be ap-northeast-2 for the approved production architecture');
  }
  if (!/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domainName)) {
    throw new Error('domainName must be a valid public DNS name');
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(githubRepository)) {
    throw new Error('githubRepository must use owner/repository format');
  }
  if (!/^[A-Za-z0-9_.-]+$/.test(githubEnvironment)) {
    throw new Error('githubEnvironment contains unsupported characters');
  }
  if (!new RegExp(`^arn:aws:iam::${account}:role\/[A-Za-z0-9+=,.@_\/-]+$`).test(operationsPrincipalArn)) {
    throw new Error(`operationsPrincipalArn must be an IAM role in account ${account}`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alertEmail)) {
    throw new Error('alertEmail must be a valid email address');
  }
  const kakaoSecretArnPattern = new RegExp(
    `^arn:aws:secretsmanager:${region}:${account}:secret:[A-Za-z0-9/_+=.@-]+-[A-Za-z0-9]{6}$`,
  );
  if (!kakaoSecretArnPattern.test(kakaoSecretArn)) {
    throw new Error(
      `kakaoSecretArn must be a Secrets Manager secret in account ${account} and region ${region}`,
    );
  }

  return {
    account,
    region,
    edgeRegion: 'us-east-1',
    domainName,
    applicantHostname: domainName,
    adminHostname: `admin.${domainName}`,
    githubRepository,
    githubEnvironment,
    operationsPrincipalArn,
    alertEmail,
    kakaoSecretArn,
  };
}
