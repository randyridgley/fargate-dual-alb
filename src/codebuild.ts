import * as codebuild from '@aws-cdk/aws-codebuild';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';


export class CodeBuildCI extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    const project = new codebuild.Project(this, 'CodeBuildProject', {
      projectName: 'fargate-dual-alb-ci',
      source: codebuild.Source.gitHub({
        owner: 'pahud',
        repo: 'fargate-dual-alb',
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            // 'runtime-versions': {
            //   docker: 18,
            // },
            commands: [
              'yarn install --frozen-lockfile',
            ],
          },
          build: {
            commands: [
              'yarn build',
            ],
          },
          post_build: {
            commands: [
              'npx cdk synth',
            ],
          },
        },
      }),
    });

    // allow the build role to assume the cdk lookup-role
    project.addToRolePolicy(new iam.PolicyStatement({
      actions: ['sts:AssumeRole'],
      resources: ['arn:aws:iam::*:role/cdk-hnb659fds-lookup-role-*'],
    }));
  }
}
