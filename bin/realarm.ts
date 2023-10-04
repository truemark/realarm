import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { LambdaEventStack } from '../lib/LambdaEventStack';

const app = new cdk.App();
new LambdaEventStack(app, 'LambdaEventStack');
