import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { ExtendedStack, ExtendedStackProps,  } from 'truemark-cdk-lib/aws-cdk';
import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';


export interface RealarmStackProps extends ExtendedStackProps {}

export class Realarm extends ExtendedStack {
    constructor(scope: Construct, id: string, props?: RealarmStackProps) {
        super(scope, id, props);

        // Define the lambda Role with the necessary permissions
        const AlertRole = new iam.Role(this, 'AlertRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
        });

        AlertRole.addToPolicy(new iam.PolicyStatement({
            resources: ['*'],  // This grants permission on all CloudWatch alarms. Adjust if needed.
            actions: [
                'cloudwatch:DescribeAlarms',
                'cloudwatch:SetAlarmState'
            ],
        }));

        AlertRole.addToPolicy(new iam.PolicyStatement({
            resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/cwsyn*`,
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/cwsyn*:log-stream:*`,
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/canary/*`
            ],
            actions: [
                'logs:FilterLogEvents',
                'logs:DescribeLogStreams',
                'logs:DescribeLogGroups'
            ],
        }));

        AlertRole.addToPolicy(new iam.PolicyStatement({
            resources: [
                `arn:aws:logs:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:log-group:/aws/lambda/RealarmStackRealarm*`
            ],
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
            ],
        }));

        AlertRole.addToPolicy(new iam.PolicyStatement({
            resources: ['*'],  // This grants permission on all log groups. Adjust if needed.
            actions: ['logs:DescribeLogGroups'],
        }));

        // Create the Lambda function
        const RealarmLambda = new PythonFunction(this, 'ReAlarmLambda', {
            runtime: lambda.Runtime.PYTHON_3_9,
            memorySize: 512,
            entry: './handlers/realarm_lambda',
            handler: 'index.handler',
            timeout: Duration.seconds(30),
            role: AlertRole
        });

        // Define the EventBridge Rule
        const EveryTwoHours = new events.Rule(this, 'EveryTwoHoursRule', {
            schedule: events.Schedule.cron({ minute: '0', hour: '*/2' }),
        });

        // Add the Lambda function as the target for the EventBridge rule
        EveryTwoHours.addTarget(new events_targets.LambdaFunction(RealarmLambda));
    }
}
