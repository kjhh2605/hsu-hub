import {
  Arn,
  ArnFormat,
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  Validations,
  type StackProps,
} from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as elbv2Targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import type { Construct } from 'constructs';
import type { HsuHubConfig } from './config';

export interface PlatformStackProps extends StackProps {
  readonly config: HsuHubConfig;
  readonly hostedZone: route53.IPublicHostedZone;
  readonly viewerCertificate: acm.ICertificate;
}

interface FrontendDistributionProps {
  readonly id: string;
  readonly hostname: string;
  readonly bucket: s3.IBucket;
  readonly certificate: acm.ICertificate;
  readonly apiOrigin: cloudfront.IOrigin;
  readonly apiOriginRequestPolicy: cloudfront.IOriginRequestPolicy;
  readonly responseHeadersPolicy: cloudfront.IResponseHeadersPolicy;
  readonly rewriteFunction: cloudfront.IFunction;
}

export class PlatformStack extends Stack {
  public constructor(scope: Construct, id: string, props: PlatformStackProps) {
    super(scope, id, props);

    const config = props.config;
    const dataKey = new kms.Key(this, 'DataKey', {
      alias: 'alias/hsu-hub-data',
      description: 'Encrypts HSU Hub secrets and ECR images',
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    dataKey.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'AllowCloudWatchLogsEncryption',
      principals: [new iam.ServicePrincipal(`logs.${config.region}.amazonaws.com`)],
      actions: [
        'kms:Encrypt',
        'kms:Decrypt',
        'kms:ReEncrypt*',
        'kms:GenerateDataKey*',
        'kms:Describe*',
      ],
      resources: ['*'],
      conditions: {
        ArnLike: {
          'kms:EncryptionContext:aws:logs:arn':
            `arn:aws:logs:${config.region}:${config.account}:log-group:*`,
        },
      },
    }));
    const alarmKey = new kms.Key(this, 'AlarmKey', {
      alias: 'alias/hsu-hub-alarms',
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      displayName: 'HSU Hub production alarms',
      masterKey: alarmKey,
    });
    alarmTopic.addSubscription(new subscriptions.EmailSubscription(config.alertEmail));

    const flowLogGroup = new logs.LogGroup(this, 'VpcFlowLogs', {
      encryptionKey: dataKey,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    const applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogs', {
      logGroupName: '/hsu-hub/production/application',
      encryptionKey: dataKey,
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    const systemLogGroup = new logs.LogGroup(this, 'SystemLogs', {
      logGroupName: '/hsu-hub/production/system',
      encryptionKey: dataKey,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const vpc = new ec2.Vpc(this, 'Vpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.42.0.0/16'),
      availabilityZones: [`${config.region}a`, `${config.region}c`],
      natGateways: 1,
      restrictDefaultSecurityGroup: true,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        { name: 'application', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
      ],
    });
    for (const publicSubnet of vpc.publicSubnets) {
      (publicSubnet.node.defaultChild as ec2.CfnSubnet).mapPublicIpOnLaunch = false;
    }
    vpc.addFlowLog('FlowLog', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup),
      trafficType: ec2.FlowLogTrafficType.REJECT,
    });

    const serviceDataBucket = new s3.Bucket(this, 'ServiceData', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'expire-abandoned-uploads',
          prefix: 'uploads/tmp/',
          expiration: Duration.days(1),
          abortIncompleteMultipartUploadAfter: Duration.days(1),
        },
        {
          id: 'retain-backups-fourteen-days',
          prefix: 'backups/',
          expiration: Duration.days(14),
          noncurrentVersionExpiration: Duration.days(14),
        },
        {
          id: 'expire-access-logs',
          prefix: 'access-logs/',
          expiration: Duration.days(90),
          noncurrentVersionExpiration: Duration.days(30),
        },
      ],
    });
    const applicantBucket = this.frontendBucket(
      'ApplicantArtifacts',
      serviceDataBucket,
      'access-logs/s3/applicant/',
    );
    const adminBucket = this.frontendBucket(
      'AdminArtifacts',
      serviceDataBucket,
      'access-logs/s3/admin/',
    );

    const repository = new ecr.Repository(this, 'BackendRepository', {
      repositoryName: 'hsu-hub/backend',
      encryption: ecr.RepositoryEncryption.KMS,
      encryptionKey: dataKey,
      imageScanOnPush: true,
      imageTagMutability: ecr.TagMutability.IMMUTABLE,
      lifecycleRules: [{ description: 'Retain 20 release images', maxImageCount: 20 }],
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: '/hsu-hub/production/database',
      encryptionKey: dataKey,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'hsuhub' }),
        generateStringKey: 'password',
        passwordLength: 32,
        excludePunctuation: true,
      },
    });
    databaseSecret.applyRemovalPolicy(RemovalPolicy.RETAIN);
    const sessionSecret = new secretsmanager.Secret(this, 'SessionSecret', {
      secretName: '/hsu-hub/production/session',
      encryptionKey: dataKey,
      generateSecretString: {
        passwordLength: 64,
        excludePunctuation: true,
      },
    });
    sessionSecret.applyRemovalPolicy(RemovalPolicy.RETAIN);

    const instanceRole = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Runtime role for the private HSU Hub EC2 instance',
    });
    const kakaoSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      'KakaoSecret',
      config.kakaoSecretArn,
    );
    instanceRole.addToPolicy(new iam.PolicyStatement({
      sid: 'SsmManagedNodeCore',
      actions: [
        'ec2messages:AcknowledgeMessage',
        'ec2messages:DeleteMessage',
        'ec2messages:FailMessage',
        'ec2messages:GetEndpoint',
        'ec2messages:GetMessages',
        'ec2messages:SendReply',
        'ssm:DescribeAssociation',
        'ssm:DescribeDocumentParameters',
        'ssm:GetDeployablePatchSnapshotForInstance',
        'ssm:GetDocument',
        'ssm:ListAssociations',
        'ssm:ListInstanceAssociations',
        'ssm:PutComplianceItems',
        'ssm:PutConfigurePackageResult',
        'ssm:PutInventory',
        'ssm:UpdateAssociationStatus',
        'ssm:UpdateInstanceAssociationStatus',
        'ssm:UpdateInstanceInformation',
        'ssmmessages:CreateControlChannel',
        'ssmmessages:CreateDataChannel',
        'ssmmessages:OpenControlChannel',
        'ssmmessages:OpenDataChannel',
      ],
      resources: ['*'],
    }));
    instanceRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ecr:GetAuthorizationToken'],
      resources: ['*'],
    }));
    instanceRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'ecr:BatchCheckLayerAvailability',
        'ecr:BatchGetImage',
        'ecr:GetDownloadUrlForLayer',
      ],
      resources: [repository.repositoryArn],
    }));
    databaseSecret.grantRead(instanceRole);
    sessionSecret.grantRead(instanceRole);
    kakaoSecret.grantRead(instanceRole);
    applicationLogGroup.grantWrite(instanceRole);
    systemLogGroup.grantWrite(instanceRole);
    dataKey.grantDecrypt(instanceRole);
    instanceRole.addToPolicy(new iam.PolicyStatement({
      sid: 'UploadObjectsOnly',
      actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
      resources: [serviceDataBucket.arnForObjects('uploads/*')],
    }));
    instanceRole.addToPolicy(new iam.PolicyStatement({
      sid: 'ListUploadPrefixOnly',
      actions: ['s3:ListBucket'],
      resources: [serviceDataBucket.bucketArn],
      conditions: { StringLike: { 's3:prefix': ['uploads/*'] } },
    }));

    const backupRole = new iam.Role(this, 'BackupRole', {
      assumedBy: new iam.ArnPrincipal(instanceRole.roleArn),
      description: 'Write-only role used by the scheduled MySQL backup command',
      maxSessionDuration: Duration.hours(1),
    });
    backupRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      resources: [serviceDataBucket.arnForObjects('backups/*')],
    }));
    backupRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:ListBucket'],
      resources: [serviceDataBucket.bucketArn],
      conditions: { StringLike: { 's3:prefix': ['backups/*'] } },
    }));
    instanceRole.addToPolicy(new iam.PolicyStatement({
      actions: ['sts:AssumeRole'],
      resources: [backupRole.roleArn],
    }));

    const restoreRole = new iam.Role(this, 'RestoreRole', {
      assumedBy: new iam.ArnPrincipal(config.operationsPrincipalArn),
      description: 'Read-only role for explicitly authorized restore drills',
      maxSessionDuration: Duration.hours(1),
    });
    restoreRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [serviceDataBucket.arnForObjects('backups/*')],
    }));
    restoreRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:ListBucket'],
      resources: [serviceDataBucket.bucketArn],
      conditions: { StringLike: { 's3:prefix': ['backups/*'] } },
    }));

    const s3Endpoint = vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
    });
    s3Endpoint.addToPolicy(new iam.PolicyStatement({
      principals: [new iam.ArnPrincipal(instanceRole.roleArn), new iam.ArnPrincipal(backupRole.roleArn)],
      actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
      resources: [serviceDataBucket.bucketArn, serviceDataBucket.arnForObjects('*')],
    }));
    s3Endpoint.addToPolicy(new iam.PolicyStatement({
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:GetObject'],
      resources: [`arn:aws:s3:::prod-${config.region}-starport-layer-bucket/*`],
    }));
    s3Endpoint.addToPolicy(new iam.PolicyStatement({
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:GetObject'],
      resources: [`arn:aws:s3:::al2023-repos-${config.region}-de612dc2/*`],
    }));
    serviceDataBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'UploadsMustUseVpcEndpoint',
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
      resources: [serviceDataBucket.arnForObjects('uploads/*')],
      conditions: { StringNotEquals: { 'aws:SourceVpce': s3Endpoint.vpcEndpointId } },
    }));
    serviceDataBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'UploadsRestrictedToRuntimeRole',
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
      resources: [serviceDataBucket.arnForObjects('uploads/*')],
      conditions: { ArnNotEquals: { 'aws:PrincipalArn': instanceRole.roleArn } },
    }));
    serviceDataBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'BackupWritesRestrictedToBackupRole',
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:PutObject'],
      resources: [serviceDataBucket.arnForObjects('backups/*')],
      conditions: { ArnNotEquals: { 'aws:PrincipalArn': backupRole.roleArn } },
    }));
    serviceDataBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'BackupWritesMustUseVpcEndpoint',
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:PutObject'],
      resources: [serviceDataBucket.arnForObjects('backups/*')],
      conditions: { StringNotEquals: { 'aws:SourceVpce': s3Endpoint.vpcEndpointId } },
    }));
    serviceDataBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'BackupReadsRestrictedToRestoreRole',
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:GetObject'],
      resources: [serviceDataBucket.arnForObjects('backups/*')],
      conditions: { ArnNotEquals: { 'aws:PrincipalArn': restoreRole.roleArn } },
    }));
    serviceDataBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'BackupDeletionDenied',
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:DeleteObject'],
      resources: [serviceDataBucket.arnForObjects('backups/*')],
    }));

    const instanceSecurityGroup = new ec2.SecurityGroup(this, 'InstanceSecurityGroup', {
      vpc,
      description: 'Only the internal ALB reaches the backend port',
      allowAllOutbound: false,
    });
    instanceSecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS through NAT and S3 endpoint');
    instanceSecurityGroup.addEgressRule(ec2.Peer.ipv4('10.42.0.2/32'), ec2.Port.udp(53), 'VPC DNS UDP');
    instanceSecurityGroup.addEgressRule(ec2.Peer.ipv4('10.42.0.2/32'), ec2.Port.tcp(53), 'VPC DNS TCP');
    instanceSecurityGroup.addEgressRule(ec2.Peer.ipv4('169.254.169.123/32'), ec2.Port.udp(123), 'Amazon Time Sync');
    const loadBalancerSecurityGroup = new ec2.SecurityGroup(this, 'LoadBalancerSecurityGroup', {
      vpc,
      description: 'CloudFront VPC Origin service ENIs reach the internal ALB',
      allowAllOutbound: false,
    });
    loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.prefixList('pl-22a6434b'),
      ec2.Port.tcp(80),
      'CloudFront origin-facing managed prefix list',
    );
    loadBalancerSecurityGroup.addEgressRule(instanceSecurityGroup, ec2.Port.tcp(8080), 'Backend target');
    instanceSecurityGroup.addIngressRule(loadBalancerSecurityGroup, ec2.Port.tcp(8080), 'Internal ALB only');

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'set -euxo pipefail',
      'dnf install -y docker amazon-cloudwatch-agent jq',
      'systemctl enable --now docker amazon-ssm-agent',
      'mkdir -p /opt/hsu-hub/logs /srv/hsu-hub/mysql',
      'DATA_DEVICE=""',
      'for candidate in /dev/nvme1n1 /dev/xvdb; do if [ -b "$candidate" ]; then DATA_DEVICE="$candidate"; break; fi; done',
      'test -n "$DATA_DEVICE"',
      'if ! blkid "$DATA_DEVICE"; then mkfs.xfs "$DATA_DEVICE"; fi',
      'DATA_UUID=$(blkid -s UUID -o value "$DATA_DEVICE")',
      'grep -q "$DATA_UUID" /etc/fstab || echo "UUID=$DATA_UUID /srv/hsu-hub xfs defaults,nofail 0 2" >> /etc/fstab',
      'mount -a',
      'mkdir -p /srv/hsu-hub/mysql /opt/hsu-hub/logs',
      'chown 10001:10001 /opt/hsu-hub/logs',
      'chmod 750 /srv/hsu-hub /opt/hsu-hub',
      `cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'CWCONFIG'
{
  "agent": { "metrics_collection_interval": 60, "run_as_user": "root" },
  "metrics": {
    "append_dimensions": { "InstanceId": "\${aws:InstanceId}" },
    "metrics_collected": {
      "disk": { "measurement": ["used_percent"], "resources": ["/srv/hsu-hub"], "drop_device": true },
      "mem": { "measurement": ["mem_used_percent"] }
    }
  },
  "logs": {
    "logs_collected": { "files": { "collect_list": [
      { "file_path": "/opt/hsu-hub/logs/application.log", "log_group_name": "${applicationLogGroup.logGroupName}", "log_stream_name": "{instance_id}" },
      { "file_path": "/var/log/cloud-init-output.log", "log_group_name": "${systemLogGroup.logGroupName}", "log_stream_name": "{instance_id}/cloud-init" }
    ] } }
  }
}
CWCONFIG`,
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json',
    );

    const instance = new ec2.Instance(this, 'ApplicationInstance', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      machineImage: ec2.MachineImage.latestAmazonLinux2023({
        cpuType: ec2.AmazonLinuxCpuType.X86_64,
      }),
      role: instanceRole,
      securityGroup: instanceSecurityGroup,
      associatePublicIpAddress: false,
      requireImdsv2: true,
      detailedMonitoring: true,
      userData,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            deleteOnTermination: true,
          }),
        },
        {
          deviceName: '/dev/xvdb',
          volume: ec2.BlockDeviceVolume.ebs(40, {
            encrypted: true,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            deleteOnTermination: false,
          }),
        },
      ],
    });

    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'InternalLoadBalancer', {
      vpc,
      internetFacing: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroup: loadBalancerSecurityGroup,
      dropInvalidHeaderFields: true,
      deletionProtection: true,
    });
    const listener = loadBalancer.addListener('HttpListener', { port: 80, open: false });
    const targetGroup = listener.addTargets('BackendTarget', {
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [new elbv2Targets.InstanceTarget(instance, 8080)],
      healthCheck: {
        path: '/actuator/health',
        healthyHttpCodes: '200',
        interval: Duration.seconds(30),
      },
      deregistrationDelay: Duration.seconds(60),
    });

    const applicantApiOrigin = origins.VpcOrigin.withApplicationLoadBalancer(loadBalancer, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
      httpPort: 80,
      readTimeout: Duration.seconds(60),
      keepaliveTimeout: Duration.seconds(5),
      customHeaders: { 'X-HSU-Frontend': 'applicant' },
    });
    const adminApiOrigin = origins.VpcOrigin.withApplicationLoadBalancer(loadBalancer, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
      httpPort: 80,
      readTimeout: Duration.seconds(60),
      keepaliveTimeout: Duration.seconds(5),
      customHeaders: { 'X-HSU-Frontend': 'admin' },
    });
    const apiOriginRequestPolicy = new cloudfront.OriginRequestPolicy(this, 'ApiOriginRequestPolicy', {
      comment: 'Forward session cookies, CSRF and request metadata to Spring',
      cookieBehavior: cloudfront.OriginRequestCookieBehavior.all(),
      queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
      headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList(
        'Accept',
        'Content-Type',
        'Origin',
        'Referer',
        'X-XSRF-TOKEN',
        'X-Request-Id',
        'CloudFront-Viewer-Address',
      ),
    });
    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeaders', {
      securityHeadersBehavior: {
        contentSecurityPolicy: {
          contentSecurityPolicy: "default-src 'self'; img-src 'self' data:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
          override: true,
        },
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: cloudfront.HeadersFrameOption.SAMEORIGIN, override: true },
        referrerPolicy: { referrerPolicy: cloudfront.HeadersReferrerPolicy.NO_REFERRER, override: true },
        strictTransportSecurity: { accessControlMaxAge: Duration.days(365), includeSubdomains: true, preload: true, override: true },
        xssProtection: { protection: true, modeBlock: true, override: true },
      },
      customHeadersBehavior: {
        customHeaders: [
          { header: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()', override: true },
        ],
      },
    });
    const rewriteFunction = new cloudfront.Function(this, 'SpaRewrite', {
      code: cloudfront.FunctionCode.fromInline(`function handler(event) {
  var request = event.request;
  if (!request.uri.includes('.') && !request.uri.startsWith('/api/')) {
    request.uri = '/index.html';
  }
  return request;
}`),
      runtime: cloudfront.FunctionRuntime.JS_2_0,
    });

    const applicantDistribution = this.frontendDistribution({
      id: 'ApplicantDistribution',
      hostname: config.applicantHostname,
      bucket: applicantBucket,
      certificate: props.viewerCertificate,
      apiOrigin: applicantApiOrigin,
      apiOriginRequestPolicy,
      responseHeadersPolicy,
      rewriteFunction,
    });
    const adminDistribution = this.frontendDistribution({
      id: 'AdminDistribution',
      hostname: config.adminHostname,
      bucket: adminBucket,
      certificate: props.viewerCertificate,
      apiOrigin: adminApiOrigin,
      apiOriginRequestPolicy,
      responseHeadersPolicy,
      rewriteFunction,
    });

    for (const [recordId, recordName, distribution] of [
      ['Applicant', config.applicantHostname, applicantDistribution],
      ['Admin', config.adminHostname, adminDistribution],
    ] as const) {
      new route53.ARecord(this, `${recordId}AliasA`, {
        zone: props.hostedZone,
        recordName,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      });
      new route53.AaaaRecord(this, `${recordId}AliasAaaa`, {
        zone: props.hostedZone,
        recordName,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      });
    }

    const oidcProvider = new iam.OpenIdConnectProvider(this, 'GitHubOidc', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });
    const deploymentRole = new iam.Role(this, 'GitHubDeploymentRole', {
      assumedBy: new iam.OpenIdConnectPrincipal(oidcProvider, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          'token.actions.githubusercontent.com:sub': `repo:${config.githubRepository.replace('/', '@*/')}@*:environment:${config.githubEnvironment}`,
        },
      }),
      description: 'GitHub production environment deployment role',
      maxSessionDuration: Duration.hours(1),
    });
    deploymentRole.addToPolicy(new iam.PolicyStatement({
      sid: 'AssumeCdkBootstrapRoles',
      actions: ['sts:AssumeRole'],
      resources: [config.region, config.edgeRegion].flatMap((region) => [
        `arn:aws:iam::${config.account}:role/cdk-hnb659fds-deploy-role-${config.account}-${region}`,
        `arn:aws:iam::${config.account}:role/cdk-hnb659fds-file-publishing-role-${config.account}-${region}`,
        `arn:aws:iam::${config.account}:role/cdk-hnb659fds-image-publishing-role-${config.account}-${region}`,
        `arn:aws:iam::${config.account}:role/cdk-hnb659fds-lookup-role-${config.account}-${region}`,
      ]),
    }));
    deploymentRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ecr:GetAuthorizationToken'],
      resources: ['*'],
    }));
    deploymentRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'ecr:BatchCheckLayerAvailability',
        'ecr:BatchGetImage',
        'ecr:CompleteLayerUpload',
        'ecr:DescribeImages',
        'ecr:GetDownloadUrlForLayer',
        'ecr:InitiateLayerUpload',
        'ecr:PutImage',
        'ecr:UploadLayerPart',
      ],
      resources: [repository.repositoryArn],
    }));
    deploymentRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetBucketLocation', 's3:GetBucketVersioning', 's3:ListBucket'],
      resources: [applicantBucket.bucketArn, adminBucket.bucketArn],
    }));
    deploymentRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:DeleteObject', 's3:GetObject', 's3:PutObject'],
      resources: [applicantBucket.arnForObjects('*'), adminBucket.arnForObjects('*')],
    }));
    deploymentRole.addToPolicy(new iam.PolicyStatement({
      actions: ['cloudfront:CreateInvalidation'],
      resources: [
        this.formatArn({ service: 'cloudfront', region: '', resource: 'distribution', resourceName: applicantDistribution.distributionId, arnFormat: ArnFormat.SLASH_RESOURCE_NAME }),
        this.formatArn({ service: 'cloudfront', region: '', resource: 'distribution', resourceName: adminDistribution.distributionId, arnFormat: ArnFormat.SLASH_RESOURCE_NAME }),
      ],
    }));
    deploymentRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ssm:SendCommand'],
      resources: [
        Arn.format({ service: 'ec2', resource: 'instance', resourceName: instance.instanceId, arnFormat: ArnFormat.SLASH_RESOURCE_NAME }, this),
        Arn.format({ service: 'ssm', resource: 'document', resourceName: 'AWS-RunShellScript', arnFormat: ArnFormat.SLASH_RESOURCE_NAME }, this),
      ],
    }));
    deploymentRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ssm:GetCommandInvocation', 'ssm:ListCommandInvocations'],
      resources: ['*'],
    }));
    deploymentRole.addToPolicy(new iam.PolicyStatement({
      actions: ['cloudformation:DescribeStacks'],
      resources: [
        `arn:aws:cloudformation:${config.region}:${config.account}:stack/HsuHubPlatform/*`,
        `arn:aws:cloudformation:${config.edgeRegion}:${config.account}:stack/HsuHubDnsCertificate/*`,
      ],
    }));

    const operationsRole = iam.Role.fromRoleArn(
      this,
      'OperationsPrincipal',
      config.operationsPrincipalArn,
      { mutable: false },
    );
    const ssmOperatorPolicy = new iam.ManagedPolicy(this, 'SsmOperatorPolicy', {
      description: 'Least-privilege Session Manager access to the HSU Hub instance',
      roles: [operationsRole],
      statements: [
        new iam.PolicyStatement({
          actions: ['ssm:StartSession'],
          resources: [
            Arn.format({ service: 'ec2', resource: 'instance', resourceName: instance.instanceId, arnFormat: ArnFormat.SLASH_RESOURCE_NAME }, this),
            Arn.format({ service: 'ssm', resource: 'document', resourceName: 'SSM-SessionManagerRunShell', arnFormat: ArnFormat.SLASH_RESOURCE_NAME }, this),
          ],
        }),
        new iam.PolicyStatement({
          actions: ['ssm:SendCommand'],
          resources: [
            Arn.format({ service: 'ec2', resource: 'instance', resourceName: instance.instanceId, arnFormat: ArnFormat.SLASH_RESOURCE_NAME }, this),
            Arn.format({ service: 'ssm', resource: 'document', resourceName: 'AWS-RunShellScript', arnFormat: ArnFormat.SLASH_RESOURCE_NAME }, this),
          ],
        }),
        new iam.PolicyStatement({
          actions: ['ssm:GetCommandInvocation', 'ssm:ListCommandInvocations'],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          actions: ['ssm:DescribeInstanceInformation'],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          actions: ['ssm:ResumeSession', 'ssm:TerminateSession'],
          resources: [`arn:aws:ssm:${config.region}:${config.account}:session/*`],
        }),
        new iam.PolicyStatement({
          actions: ['sts:AssumeRole'],
          resources: [restoreRole.roleArn],
        }),
        new iam.PolicyStatement({
          actions: ['cloudformation:DescribeStacks'],
          resources: [`arn:aws:cloudformation:${config.region}:${config.account}:stack/HsuHubPlatform/*`],
        }),
        new iam.PolicyStatement({
          actions: ['ecr:DescribeImages'],
          resources: [repository.repositoryArn],
        }),
        new iam.PolicyStatement({
          actions: ['s3:GetBucketLocation', 's3:GetBucketVersioning', 's3:ListBucket'],
          resources: [applicantBucket.bucketArn, adminBucket.bucketArn],
        }),
        new iam.PolicyStatement({
          actions: ['s3:DeleteObject', 's3:GetObject', 's3:PutObject'],
          resources: [applicantBucket.arnForObjects('*'), adminBucket.arnForObjects('*')],
        }),
        new iam.PolicyStatement({
          actions: ['cloudfront:CreateInvalidation'],
          resources: [
            this.formatArn({ service: 'cloudfront', region: '', resource: 'distribution', resourceName: applicantDistribution.distributionId, arnFormat: ArnFormat.SLASH_RESOURCE_NAME }),
            this.formatArn({ service: 'cloudfront', region: '', resource: 'distribution', resourceName: adminDistribution.distributionId, arnFormat: ArnFormat.SLASH_RESOURCE_NAME }),
          ],
        }),
      ],
    });

    this.addAlarms(instance, targetGroup, alarmTopic);

    const cfnInstance = instance.node.defaultChild as ec2.CfnInstance;
    cfnInstance.disableApiTermination = true;

    Validations.of(serviceDataBucket).acknowledge({
      id: 'AwsSolutions-S1',
      reason: 'The third and final private bucket is itself the centralized access-log destination; recursive server logging is unsupported.',
    });
    for (const secret of [databaseSecret, sessionSecret]) {
      Validations.of(secret).acknowledge({
        id: 'AwsSolutions-SMG4',
        reason: 'Self-hosted MySQL/session rotation requires coordinated application rollout; the runbook mandates an explicit maintenance rotation.',
      });
    }
    Validations.of(this).acknowledge(
      {
        id: 'CloudFormation-Validate::W3010',
        reason: 'The approved Seoul-region design intentionally fixes two known AZs so synthesis remains offline and deterministic.',
      },
      {
        id: 'AwsSolutions-IAM5[Resource::*]',
        reason: 'ECR authorization token, SSM command status, and DescribeInstanceInformation do not support resource-level IAM scoping.',
      },
      {
        id: 'AwsSolutions-IAM5[Resource::<ServiceData8376727A.Arn>/uploads/*]',
        reason: 'Runtime object access is limited to the uploads/ prefix in one private bucket and requires object-key wildcarding.',
      },
      {
        id: 'AwsSolutions-IAM5[Resource::<ServiceData8376727A.Arn>/backups/*]',
        reason: 'Backup and restore roles are limited to the backups/ prefix in one private bucket and require object-key wildcarding.',
      },
      {
        id: 'AwsSolutions-IAM5[Resource::<ApplicantArtifacts4E5462B1.Arn>/*]',
        reason: 'The deployment role must replace versioned applicant frontend object keys in this one bucket.',
      },
      {
        id: 'AwsSolutions-IAM5[Resource::<AdminArtifacts48321CFF.Arn>/*]',
        reason: 'The deployment role must replace versioned admin frontend object keys in this one bucket.',
      },
      {
        id: `AwsSolutions-IAM5[Resource::arn:aws:cloudformation:${config.region}:${config.account}:stack/HsuHubPlatform/*]`,
        reason: 'CloudFormation stack revision identifiers require a suffix wildcard within the named platform stack.',
      },
      {
        id: `AwsSolutions-IAM5[Resource::arn:aws:cloudformation:${config.edgeRegion}:${config.account}:stack/HsuHubDnsCertificate/*]`,
        reason: 'CloudFormation stack revision identifiers require a suffix wildcard within the named DNS stack.',
      },
      {
        id: `AwsSolutions-IAM5[Resource::arn:aws:ssm:${config.region}:${config.account}:session/*]`,
        reason: 'Session lifecycle actions require a session ID suffix; StartSession remains limited to the one instance.',
      },
    );
    Validations.of(loadBalancerSecurityGroup).acknowledge({
      id: 'AwsSolutions-EC23',
      reason: 'The ingress CIDR is the private VPC CIDR token and is required for CloudFront VPC Origin service ENIs; the ALB is internal.',
    });
    Validations.of(loadBalancer).acknowledge({
      id: 'AwsSolutions-ELB2',
      reason: 'ALB access logs preserve the OAuth callback request line including one-time code and state; query-free metrics and application logs remain enabled.',
    });
    for (const distribution of [applicantDistribution, adminDistribution]) {
      Validations.of(distribution).acknowledge(
        {
          id: 'AwsSolutions-CFR1',
          reason: 'The Korean university pilot remains reachable abroad; authorization is enforced by the application.',
        },
        {
          id: 'AwsSolutions-CFR2',
          reason: 'WAF is deferred for the 30-user MVP and tracked as a production risk; private origin, rate limits, and security headers provide baseline controls.',
        },
        {
          id: 'AwsSolutions-CFR3',
          reason: 'Legacy CloudFront logs include OAuth callback query strings; request logs remain disabled until field-selectable logging excludes code, state, and Referer.',
        },
      );
    }

    const outputs: Record<string, string> = {
      InstanceId: instance.instanceId,
      BackendRepositoryUri: repository.repositoryUri,
      ApplicantBucketName: applicantBucket.bucketName,
      AdminBucketName: adminBucket.bucketName,
      ServiceDataBucketName: serviceDataBucket.bucketName,
      ApplicantDistributionId: applicantDistribution.distributionId,
      AdminDistributionId: adminDistribution.distributionId,
      DatabaseSecretArn: databaseSecret.secretArn,
      SessionSecretArn: sessionSecret.secretArn,
      KakaoSecretArn: kakaoSecret.secretArn,
      BackupRoleArn: backupRole.roleArn,
      RestoreRoleArn: restoreRole.roleArn,
      GitHubDeploymentRoleArn: deploymentRole.roleArn,
      ApplicationUrl: `https://${config.applicantHostname}`,
      AdminUrl: `https://${config.adminHostname}`,
    };
    for (const [outputId, value] of Object.entries(outputs)) {
      new CfnOutput(this, outputId, { value });
    }
  }

  private frontendBucket(
    id: string,
    logBucket: s3.IBucket,
    logPrefix: string,
  ): s3.Bucket {
    return new s3.Bucket(this, id, {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      serverAccessLogsBucket: logBucket,
      serverAccessLogsPrefix: logPrefix,
      removalPolicy: RemovalPolicy.RETAIN,
    });
  }

  private frontendDistribution(props: FrontendDistributionProps): cloudfront.Distribution {
    return new cloudfront.Distribution(this, props.id, {
      domainNames: [props.hostname],
      certificate: props.certificate,
      defaultRootObject: 'index.html',
      enableIpv6: true,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(props.bucket),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: props.responseHeadersPolicy,
        functionAssociations: [{
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          function: props.rewriteFunction,
        }],
      },
      additionalBehaviors: {
        '/api/*': {
          origin: props.apiOrigin,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: props.apiOriginRequestPolicy,
          compress: true,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          responseHeadersPolicy: props.responseHeadersPolicy,
        },
      },
    });
  }

  private addAlarms(instance: ec2.Instance, targetGroup: elbv2.ApplicationTargetGroup, topic: sns.ITopic): void {
    const actions = [new cloudwatchActions.SnsAction(topic)];
    const backend5xxRate = new cloudwatch.MathExpression({
      expression: 'IF(requests>0,100*errors/requests,0)',
      usingMetrics: {
        errors: targetGroup.metrics.httpCodeTarget(elbv2.HttpCodeTarget.TARGET_5XX_COUNT, {
          period: Duration.minutes(5),
          statistic: 'Sum',
        }),
        requests: targetGroup.metrics.requestCount({
          period: Duration.minutes(5),
          statistic: 'Sum',
        }),
      },
      period: Duration.minutes(5),
      label: 'Backend 5xx rate (%)',
    });
    const backend5xxAlarm = new cloudwatch.Alarm(this, 'Backend5xxRate', {
      metric: backend5xxRate,
      threshold: 5,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    for (const action of actions) backend5xxAlarm.addAlarmAction(action);

    const alarmDefinitions: Array<[string, cloudwatch.IMetric, number, cloudwatch.ComparisonOperator]> = [
      ['HighCpu', new cloudwatch.Metric({ namespace: 'AWS/EC2', metricName: 'CPUUtilization', dimensionsMap: { InstanceId: instance.instanceId }, period: Duration.minutes(5), statistic: 'Average' }), 80, cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD],
      ['InstanceStatus', new cloudwatch.Metric({ namespace: 'AWS/EC2', metricName: 'StatusCheckFailed', dimensionsMap: { InstanceId: instance.instanceId }, period: Duration.minutes(1), statistic: 'Maximum' }), 0, cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD],
      ['UnhealthyTarget', targetGroup.metrics.unhealthyHostCount({ period: Duration.minutes(1), statistic: 'maximum' }), 0, cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD],
      ['HighMemory', new cloudwatch.Metric({ namespace: 'CWAgent', metricName: 'mem_used_percent', dimensionsMap: { InstanceId: instance.instanceId }, period: Duration.minutes(5), statistic: 'Average' }), 85, cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD],
      ['HighDataDisk', new cloudwatch.Metric({ namespace: 'CWAgent', metricName: 'disk_used_percent', dimensionsMap: { InstanceId: instance.instanceId, path: '/srv/hsu-hub', fstype: 'xfs' }, period: Duration.minutes(5), statistic: 'Average' }), 80, cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD],
    ];
    for (const [id, metric, threshold, comparisonOperator] of alarmDefinitions) {
      const alarm = new cloudwatch.Alarm(this, id, {
        metric,
        threshold,
        comparisonOperator,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      });
      for (const action of actions) alarm.addAlarmAction(action);
    }
  }
}
