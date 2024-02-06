#!/usr/bin/env node
import 'source-map-support/register';
import { DataClassification, ExtendedApp } from 'truemark-cdk-lib/aws-cdk';
import { RealarmStack } from '../lib/realarm-stack';

const app = new ExtendedApp({
  standardTags: {
    automationTags: {
      id: 'realarm',
      url: 'https://github.com/truemark/realarm'
    },
    costCenterTags: {
      businessUnitName: 'EOC',
      projectName: 'realarm',
    },
    securityTags: {
      dataClassification: DataClassification.Public
    },
    teamTags: {
      name: 'EOC'
    }
  }
});

new RealarmStack(app, 'RealarmStack', {});