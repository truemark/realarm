import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';

export class Realarm extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        //Define the lambda Role with the necessary permissions
        const alertRole = new iam.Role(this, 'AlertRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
        });

        alertRole.addToPolicy(new iam.PolicyStatement({
            resources: ['*'],  // This grants permission on all CloudWatch alarms. Adjust if needed.
            actions: [
                'cloudwatch:DescribeAlarms',
                'cloudwatch:SetAlarmState'
            ],
        }));


        alertRole.addToPolicy(new iam.PolicyStatement({
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

        alertRole.addToPolicy(new iam.PolicyStatement({
            resources: [
                `arn:aws:logs:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:log-group:/aws/lambda/RealarmStack-reAlarmLambda*`
            ],
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
            ],
        }));

        alertRole.addToPolicy(new iam.PolicyStatement({
            resources: ['*'],  // This grants permission on all log groups. Adjust if needed.
            actions: ['logs:DescribeLogGroups'],
        }));

        // Create the Lambda function
        const reAlarmLambda = new lambda.Function(this, 'ReAlarmLambda', {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'alert.lambda_handler',
            code: lambda.Code.fromAsset('../handlers/realarm_lambda/realarm.py'),
            timeout: cdk.Duration.seconds(30),
            role: alertRole
        });

// Define the EventBridge Rule
    const everyTwoHours = new events.Rule(this, 'EveryTwoHoursRule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '*/2' }),
    });

    // Add the Lambda function as the target for the EventBridge rule
    everyTwoHours.addTarget(new events_targets.LambdaFunction(reAlarmLambda));

    }
}