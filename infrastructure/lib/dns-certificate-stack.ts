import {
  CfnOutput,
  Fn,
  RemovalPolicy,
  Stack,
  type StackProps,
} from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import type { Construct } from 'constructs';
import type { HsuHubConfig } from './config';

export interface DnsCertificateStackProps extends StackProps {
  readonly config: HsuHubConfig;
}

export class DnsCertificateStack extends Stack {
  public readonly hostedZone: route53.PublicHostedZone;
  public readonly viewerCertificate: acm.Certificate;

  public constructor(scope: Construct, id: string, props: DnsCertificateStackProps) {
    super(scope, id, props);

    this.hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
      zoneName: props.config.domainName,
      comment: 'Authoritative DNS for HSU Hub production',
    });
    this.hostedZone.applyRemovalPolicy(RemovalPolicy.RETAIN);

    this.viewerCertificate = new acm.Certificate(this, 'ViewerCertificate', {
      domainName: props.config.applicantHostname,
      subjectAlternativeNames: [props.config.adminHostname],
      validation: acm.CertificateValidation.fromDns(this.hostedZone),
    });
    this.viewerCertificate.applyRemovalPolicy(RemovalPolicy.RETAIN);

    new CfnOutput(this, 'HostedZoneId', { value: this.hostedZone.hostedZoneId });
    new CfnOutput(this, 'NameServers', {
      value: this.hostedZone.hostedZoneNameServers
        ? Fn.join(',', this.hostedZone.hostedZoneNameServers)
        : 'assigned-after-deploy',
      description: 'Set these nameservers at the domain registrar before certificate validation.',
    });
    new CfnOutput(this, 'ViewerCertificateArn', {
      value: this.viewerCertificate.certificateArn,
    });
  }
}
