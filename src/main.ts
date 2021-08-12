import * as sns from '@aws-cdk/aws-sns';
import * as cdk from '@aws-cdk/core';
import { CodePipeline, ShellStep, CodePipelineSource } from '@aws-cdk/pipelines';
// import { TinyDemoStack } from './service';

const app = new cdk.App();

const envJP = {
  region: 'ap-northeast-1',
  account: process.env.CDK_DEFAULT_ACCOUNT,
};

const envUS = {
  region: 'us-east-1',
  account: process.env.CDK_DEFAULT_ACCOUNT,
};

export class TinyDemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    new sns.Topic(this, 'Topic');

  }
}

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

    const pl = new CodePipeline(this, 'Pipeline', {
      synth: new ShellStep('Synth', {
        // Use a connection created using the AWS console to authenticate to GitHub
        // Other sources are available.
        input: CodePipelineSource.connection('pahud/fargate-dual-alb', 'main', {
          connectionArn: 'arn:aws:codestar-connections:ap-northeast-1:903779448426:connection/5cb485a5-1bbe-4d7d-be7c-5dab16081bfa', // Created using the AWS console * });',
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

new MyPipelineStack(app, 'PipelinedStack', { env: envJP });
