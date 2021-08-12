const { AwsCdkTypeScriptApp } = require('projen');
const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.95.2',
  defaultReleaseBranch: 'main',
  name: 'fargate-dual-alb',
  description: 'Demo application with cdk-fargate-patterns',
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-ecs',
    '@aws-cdk/aws-sns',
    '@aws-cdk/aws-ecs-patterns',
    '@aws-cdk/aws-certificatemanager',
    '@aws-cdk/pipelines',
  ],
  deps: [
    'cdk-fargate-patterns',
  ],
  context: {
    '@aws-cdk/core:newStyleStackSynthesis': 'true',
  },

});

const common_exclude = ['cdk.out', 'cdk.context.json', 'yarn-error.log', 'dependabot.yml'];
project.npmignore.exclude(...common_exclude, 'images');
project.gitignore.exclude(...common_exclude);

project.synth();


