const { AwsCdkTypeScriptApp, DependenciesUpgradeMechanism } = require('projen');
const { Mergify } = require('projen/lib/github');

const AUTOMATION_TOKEN = 'PROJEN_GITHUB_TOKEN';

const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.95.2',
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
  githubOptions: {
    mergify: false,
  },
  buildWorkflow: false,
  depsUpgrade: DependenciesUpgradeMechanism.githubWorkflow({
    ignoreProjen: false,
    workflowOptions: {
      labels: ['auto-approve', 'auto-merge'],
      secret: AUTOMATION_TOKEN,
    },
  }),
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['pahud'],
  },
});


const mergifyRules = [
  {
    name: 'Automatic merge on approval and successful build',
    actions: {
      merge: {
        method: 'squash',
        commit_message: 'title+body',
        strict: 'smart',
        strict_method: 'merge',
      },
      delete_head_branch: {},
    },
    conditions: [
      '#approved-reviews-by>=1',
      'status-success~=AWS CodeBuild ap-northeast-1',
      '-title~=(WIP|wip)',
      '-label~=(blocked|do-not-merge)',
    ],
  },
  {
    name: 'Automatic merge PRs with auto-merge label upon successful build',
    actions: {
      merge: {
        method: 'squash',
        commit_message: 'title+body',
        strict: 'smart',
        strict_method: 'merge',
      },
      delete_head_branch: {},
    },
    conditions: [
      'label=auto-merge',
      'status-success~=AWS CodeBuild ap-northeast-1',
      '-title~=(WIP|wip)',
      '-label~=(blocked|do-not-merge)',
    ],
  },
];

new Mergify(project.github, {
  rules: mergifyRules,
});


const common_exclude = ['cdk.out', 'cdk.context.json', 'yarn-error.log', 'dependabot.yml'];
project.npmignore.exclude(...common_exclude, 'images');
project.gitignore.exclude(...common_exclude);

project.synth();


