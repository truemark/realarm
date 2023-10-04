import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as events from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';

export class LambdaEventStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the Lambda function
    const resetLambda = new lambda.Function(this, 'ResetLambdaFunction', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'lambda_handler',
      code: lambda.Code.fromAsset('../lambdas/realarm.py'),
      timeout: cdk.Duration.minutes(5),
      environment: {
        // any environment variables if needed
      }
    });

    // Define the EventBridge Rule
    const everyTwoHours = new events.Rule(this, 'EveryTwoHoursRule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '*/2' }),
    });

    // Add the Lambda function as the target for the EventBridge rule
    everyTwoHours.addTarget(new targets.LambdaFunction(resetLambda));
  }
}
