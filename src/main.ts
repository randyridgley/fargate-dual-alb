import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { CodePipeline, ShellStep, CodePipelineSource } from '@aws-cdk/pipelines';
import { CodeBuildCI } from './codebuild';
import { TinyDemoStack } from './service';

const app = new cdk.App();

const envJP = {
  region: 'ap-northeast-1',
  account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
};

const envUS = {
  region: 'us-east-1',
  account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
};


// the application stage which deploy the demo stack to multiple environments in parallel
export class MyAppStage extends cdk.Stage {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new TinyDemoStack(this, 'TinyDemoStackJP', { env: envJP });
    new TinyDemoStack(this, 'TinyDemoStackUS', { env: envUS });
  }
}

export class MyPipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const connectionArn = this.node.tryGetContext('GITHUB_CONNECTION_ARN') || 'MOCK';

    const pl = new CodePipeline(this, 'Pipeline', {
      codeBuildDefaults: {
        rolePolicy: [
          new iam.PolicyStatement({
            actions: ['sts:AssumeRole'],
            resources: ['arn:aws:iam::*:role/cdk-hnb659fds-lookup-role-*'],
          }),
        ],
      },
      synth: new ShellStep('Synth', {
        // Use a connection created using the AWS console to authenticate to GitHub
        // Other sources are available.
        input: CodePipelineSource.connection('pahud/fargate-dual-alb', 'main', {
          connectionArn, // Created using the AWS console * });',
        }),
        commands: [
          'yarn install',
          'yarn build',
          'npx cdk synth',
        ],
      }),
    });


    // create the deployment stage
    pl.addStage(new MyAppStage(this, 'MultiRegionDeployment'));
  }
}

export class CodeBuildCIStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new CodeBuildCI(this, 'CodeBuildCI');
  }
}

new MyPipelineStack(app, 'PipelinedStack', { env: envJP });

// experiment only
new CodeBuildCIStack(app, 'CodeBuildStack', { env: envJP });


