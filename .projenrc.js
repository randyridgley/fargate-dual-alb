const { AwsCdkTypeScriptApp, DevEnvironmentDockerImage, Gitpod } = require('projen');
const { Mergify } = require('projen/lib/github');

const AUTOMATION_TOKEN = 'PROJEN_GITHUB_TOKEN';

const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.95.2',
  minNodeVersion: '12.20.0',
  defaultReleaseBranch: 'main',
  name: 'fargate-dual-alb',
  description: 'Demo application with cdk-fargate-patterns',
  cdkDependencies: [
    '@aws-cdk/aws-codebuild',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-ecs',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-logs',
    '@aws-cdk/aws-certificatemanager',
    '@aws-cdk/pipelines',
  ],
  deps: [
    'cdk-fargate-patterns',
  ],
  context: {
    '@aws-cdk/core:newStyleStackSynthesis': 'true',
  },
  buildWorkflow: false,
  depsUpgradeOptions: {
    ignoreProjen: false,
    workflowOptions: {
      labels: ['auto-approve', 'auto-merge'],
      secret: AUTOMATION_TOKEN,
    },
  },
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['pahud'],
  },
});


const gitpodPrebuild = project.addTask('gitpod:prebuild', {
  description: 'Prebuild setup for Gitpod',
});
// install and compile only, do not test or package.
gitpodPrebuild.exec('yarn install --frozen-lockfile --check-files');
gitpodPrebuild.exec('npx projen compile');

let gitpod = new Gitpod(project, {
  dockerImage: DevEnvironmentDockerImage.fromImage('public.ecr.aws/pahudnet/gitpod-workspace:latest'),
  prebuilds: {
    addCheck: true,
    addBadge: true,
    addLabel: true,
    branches: true,
    pullRequests: true,
    pullRequestsFromForks: true,
  },
});

gitpod.addCustomTask({
  init: 'yarn gitpod:prebuild',
  // always upgrade after init
  command: 'npx projen upgrade',
});

gitpod.addVscodeExtensions(
  'dbaeumer.vscode-eslint',
  'ms-azuretools.vscode-docker',
  'AmazonWebServices.aws-toolkit-vscode',
);

const common_exclude = ['cdk.out', 'cdk.context.json', 'yarn-error.log', 'dependabot.yml'];
project.npmignore.exclude(...common_exclude, 'images');
project.gitignore.exclude(...common_exclude);

project.synth();


