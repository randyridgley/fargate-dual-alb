import * as acm from '@aws-cdk/aws-certificatemanager';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import { DualAlbFargateService } from 'cdk-fargate-patterns';

export class TinyDemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // order service
    const orderTask = new ecs.FargateTaskDefinition(this, 'orderTask', {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    orderTask.addContainer('nginx', {
      image: ecs.ContainerImage.fromRegistry('nginx:latest'),
      portMappings: [
        { containerPort: 80 },
      ],
    });

    const certArn = this.node.tryGetContext('ACM_CERT_ARN');
    const cert = certArn ? acm.Certificate.fromCertificateArn(this, 'Cert', certArn) : undefined;

    new DualAlbFargateService(this, 'ALBService', {
      spot: true, // FARGATE_SPOT only cluster
      enableExecuteCommand: true,
      tasks: [
        // The order service with both external/internal access
        {
          task: orderTask,
          desiredCount: 2,
          internal: { port: 80 },
          external: cert ? { port: 443, certificate: [cert] } : { port: 80 },
        },
      ],
      route53Ops: {
        enableLoadBalancerAlias: false,
      },
    });
  }
}
