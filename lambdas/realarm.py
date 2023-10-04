import boto3
import logging

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

cloudwatch = boto3.client('cloudwatch')

def get_all_alarms():
    logger.info("Fetching alarms related to 'synthetics'...")
    alarms = []
    paginator = cloudwatch.get_paginator('describe_alarms')

    for page in paginator.paginate():
        for alarm in page['MetricAlarms']:
            if 'syntheticcanariesstack' in alarm['AlarmName'].lower():
                alarms.append(alarm)
                logger.info(f"Found alarm: {alarm['AlarmName']} with state: {alarm['StateValue']}")

    logger.info(f"Total alarms related to 'syntheticcanariesstack' found: {len(alarms)}")
    return alarms

def reset_alarm_state(alarm_name):
    try:
        logger.info(f"Resetting alarm: {alarm_name}")
        cloudwatch.set_alarm_state(
            AlarmName=alarm_name,
            StateValue='OK',
            StateReason='Resetting state from Lambda function'
        )
        logger.info(f"Successfully reset alarm: {alarm_name}")
    except Exception as e:
        logger.error(f"Failed to reset alarm: {alarm_name}. Error: {e}")
        raise e

def check_and_reset_alarms():
    alarms = get_all_alarms()

    for alarm in alarms:
        if alarm['StateValue'] == 'ALARM':
            reset_alarm_state(alarm['AlarmName'])

def lambda_handler(event, context):
    check_and_reset_alarms()
