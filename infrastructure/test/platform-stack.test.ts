import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { DnsCertificateStack } from '../lib/dns-certificate-stack';
import { PlatformStack } from '../lib/platform-stack';
import type { HsuHubConfig } from '../lib/config';

const config: HsuHubConfig = {
  account: '123456789012',
  region: 'ap-northeast-2',
  edgeRegion: 'us-east-1',
  domainName: 'hsu-hub.site',
  applicantHostname: 'hsu-hub.site',
  adminHostname: 'admin.hsu-hub.site',
  githubRepository: 'hsu-club/hsu-hub',
  githubEnvironment: 'production',
  operationsPrincipalArn: 'arn:aws:iam::123456789012:role/HsuHubOperators',
  alertEmail: 'alerts@example.com',
  kakaoSecretArn:
    'arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:/hsu-hub/production/kakao-AbCdEf',
};

function synthesize(): Template {
  const app = new App();
  const dns = new DnsCertificateStack(app, 'TestDns', {
    env: { account: config.account, region: config.edgeRegion },
    config,
    crossRegionReferences: true,
  });
  const platform = new PlatformStack(app, 'TestPlatform', {
    env: { account: config.account, region: config.region },
    config,
    hostedZone: dns.hostedZone,
    viewerCertificate: dns.viewerCertificate,
    crossRegionReferences: true,
  });
  return Template.fromStack(platform);
}

describe('PlatformStack', () => {
  it('keeps compute private and manageable through SSM', () => {
    const template = synthesize();

    template.resourceCountIs('AWS::EC2::NatGateway', 1);
    template.resourcePropertiesCountIs('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: false,
    }, 4);
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't3.small',
      NetworkInterfaces: Match.arrayWith([
        Match.objectLike({ AssociatePublicIpAddress: false }),
      ]),
      BlockDeviceMappings: Match.arrayWith([
        Match.objectLike({ Ebs: Match.objectLike({ Encrypted: true }) }),
      ]),
    });
    template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: Match.objectLike({
        MetadataOptions: {
          HttpTokens: 'required',
        },
      }),
    });
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Only the internal ALB reaches the backend port',
      SecurityGroupEgress: Match.arrayWith([
        Match.objectLike({ CidrIp: '0.0.0.0/0', IpProtocol: 'tcp', FromPort: 443, ToPort: 443 }),
      ]),
    });
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith([
              'ssm:UpdateInstanceInformation',
              'ssmmessages:OpenControlChannel',
            ]),
          }),
        ]),
      }),
    });
  });

  it('creates exactly three encrypted private buckets', () => {
    const template = synthesize();

    template.resourceCountIs('AWS::S3::Bucket', 3);
    template.allResourcesProperties('AWS::S3::Bucket', {
      BucketEncryption: Match.anyValue(),
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it('serves two OAC frontends and forwards uncached API traffic', () => {
    const template = synthesize();

    template.resourceCountIs('AWS::CloudFront::Distribution', 2);
    template.resourceCountIs('AWS::CloudFront::OriginAccessControl', 2);
    template.resourceCountIs('AWS::CloudFront::VpcOrigin', 2);
    template.allResourcesProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        CacheBehaviors: Match.arrayWith([
          Match.objectLike({
            PathPattern: '/api/*',
            ViewerProtocolPolicy: 'redirect-to-https',
          }),
        ]),
      }),
    });
  });

  it('keeps OAuth query secrets out of request logs and referers', () => {
    const template = synthesize();

    for (const resource of Object.values(template.findResources('AWS::CloudFront::Distribution'))) {
      const config = resource.Properties?.DistributionConfig;
      expect(config?.Logging).toBeUndefined();
    }
    for (const resource of Object.values(template.findResources('AWS::ElasticLoadBalancingV2::LoadBalancer'))) {
      const attributes = resource.Properties?.LoadBalancerAttributes ?? [];
      expect(attributes).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ Key: 'access_logs.s3.enabled', Value: 'true' }),
      ]));
    }
    template.hasResourceProperties('AWS::CloudFront::ResponseHeadersPolicy', {
      ResponseHeadersPolicyConfig: Match.objectLike({
        SecurityHeadersConfig: Match.objectLike({
          ReferrerPolicy: { ReferrerPolicy: 'no-referrer', Override: true },
        }),
      }),
    });
  });

  it('forwards the CloudFront-generated viewer address for trusted rate limits', () => {
    const template = synthesize();

    template.hasResourceProperties('AWS::CloudFront::OriginRequestPolicy', {
      OriginRequestPolicyConfig: Match.objectLike({
        HeadersConfig: Match.objectLike({
          Headers: Match.arrayWith(['CloudFront-Viewer-Address']),
        }),
      }),
    });
  });

  it('removes SES while granting runtime access only to the configured Kakao secret', () => {
    const template = synthesize();

    template.resourceCountIs('AWS::SES::EmailIdentity', 0);
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith(['secretsmanager:GetSecretValue']),
            Effect: 'Allow',
            Resource: config.kakaoSecretArn,
          }),
        ]),
      }),
    });
    template.hasOutput('KakaoSecretArn', { Value: config.kakaoSecretArn });
  });

  it('marks each API origin with its trusted frontend identity', () => {
    const template = synthesize();

    for (const frontend of ['applicant', 'admin']) {
      template.resourcePropertiesCountIs('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Origins: Match.arrayWith([
            Match.objectLike({
              OriginCustomHeaders: Match.arrayWith([
                { HeaderName: 'X-HSU-Frontend', HeaderValue: frontend },
              ]),
            }),
          ]),
        }),
      }, 1);
    }
  });

  it('retains backup objects for 14 days and enables ECR scanning', () => {
    const template = synthesize();

    template.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: Match.objectLike({
        Rules: Match.arrayWith([
          Match.objectLike({ Prefix: 'backups/', ExpirationInDays: 14 }),
        ]),
      }),
    });
    template.hasResourceProperties('AWS::ECR::Repository', {
      ImageScanningConfiguration: { ScanOnPush: true },
      ImageTagMutability: 'IMMUTABLE',
    });
  });

  it('enforces role and endpoint boundaries on uploads and backups', () => {
    const template = synthesize();

    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Condition: Match.objectLike({ StringNotEquals: Match.objectLike({ 'aws:SourceVpce': Match.anyValue() }) }),
            Effect: 'Deny',
          }),
          Match.objectLike({
            Condition: Match.objectLike({ ArnNotEquals: Match.objectLike({ 'aws:PrincipalArn': Match.anyValue() }) }),
            Effect: 'Deny',
          }),
        ]),
      }),
    });
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Resource: 'arn:aws:s3:::prod-ap-northeast-2-starport-layer-bucket/*',
          }),
        ]),
      }),
    });
  });

  it('trusts only the production GitHub environment through OIDC', () => {
    const template = synthesize();

    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Condition: Match.objectLike({
              StringEquals: Match.objectLike({
                'token.actions.githubusercontent.com:sub':
                  'repo:hsu-club/hsu-hub:environment:production',
              }),
            }),
          }),
        ]),
      }),
    });
  });

  it('alarms on backend 5xx percentage rather than only an absolute count', () => {
    const template = synthesize();

    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      Metrics: Match.arrayWith([
        Match.objectLike({
          Expression: 'IF(requests>0,100*errors/requests,0)',
          ReturnData: true,
        }),
      ]),
      Threshold: 5,
    });
  });
});
