import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as events from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';
import * as iam from '@aws-cdk/aws-iam';

export class LambdaEventStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //Define the Lambda Role with the necessary permissions
    const alarmResetRole = new iam.Role(this, 'AlarmResetRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    alarmResetRole.addToPolicy(new iam.PolicyStatement({
      resources: ['*'], // This can be scoped down to specific resources if needed
      actions: [
        'cloudwatch:DescribeAlarms',
        'cloudwatch:SetAlarmState',
      ],
    }));

    alarmResetRole.addToPolicy(new iam.PolicyStatement({
      resources: ['arn:aws:logs:*:*:*'],
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    }));

    // Define the Lambda function
  const resetLambda = new lambda.Function(this, 'ResetLambdaFunction', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'lambda_handler',
      code: lambda.Code.fromAsset('../lambdas/realarm.py'),
      timeout: cdk.Duration.minutes(5),
      role: alarmResetRole, // Update this line to use the correct role name
});


    // Define the EventBridge Rule
    const everyTwoHours = new events.Rule(this, 'EveryTwoHoursRule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '10' }),
    });

    // Add the Lambda function as the target for the EventBridge rule
    everyTwoHours.addTarget(new targets.LambdaFunction(resetLambda));
  }
}


