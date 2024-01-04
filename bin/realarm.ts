#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RealarmStack } from '../lib/realarm-stack';

const app = new cdk.App();
new RealarmStack(app, 'RealarmStack', {});