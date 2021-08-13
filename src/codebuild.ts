import * as codebuild from '@aws-cdk/aws-codebuild';
import * as iam from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs';
import * as cdk from '@aws-cdk/core';


export class CodeBuildCI extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    const project = new codebuild.Project(this, 'CodeBuildProject', {
      projectName: 'fargate-dual-alb-ci',
      source: codebuild.Source.gitHub({
        owner: 'pahud',
        repo: 'fargate-dual-alb',
        webhookFilters: [
          codebuild.FilterGroup
            .inEventOf(
              codebuild.EventAction.PULL_REQUEST_CREATED,
              codebuild.EventAction.PULL_REQUEST_REOPENED,
              codebuild.EventAction.PULL_REQUEST_UPDATED,
            ),
        ],
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'yarn install --frozen-lockfile',
            ],
          },
          build: {
            commands: [
              'npx projen build',
            ],
          },
        },
      }),
    });

    // create a public read-only role
    const readOnlyRole = new iam.Role(this, 'CBReadOnlyRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
    });

    // find the logGroupArn for the default logGroup for this project
    const logGroupArn = cdk.Stack.of(this).formatArn({
      service: 'logs',
      resource: 'log-group',
      sep: ':',
      resourceName: `/aws/codebuild/${project.projectName}`,
    });

    // grant the logs:GetLogEvents to the readOnlyRole so we can display the log events
    const logGroup = logs.LogGroup.fromLogGroupArn(this, 'LogGroup', logGroupArn);
    logGroup.grant(readOnlyRole, 'logs:GetLogEvents');

    // enable the PUBLIC_READ Visibility
    const cfnProject = project.node.defaultChild as codebuild.CfnProject;
    cfnProject.addPropertyOverride('Visibility', 'PUBLIC_READ');
    cfnProject.addPropertyOverride('ResourceAccessRole', readOnlyRole.roleArn);

    // allow the build role to assume the cdk lookup-role
    project.addToRolePolicy(new iam.PolicyStatement({
      actions: ['sts:AssumeRole'],
      resources: ['arn:aws:iam::*:role/cdk-hnb659fds-lookup-role-*'],
    }));
  }
}
