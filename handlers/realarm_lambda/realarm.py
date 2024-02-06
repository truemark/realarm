import boto3
import json

# Create CloudWatch client
cloudwatch = boto3.client('cloudwatch')


def get_all_alarms():
    print("Fetching all alarms....")
    alarms = []
    paginator = cloudwatch.get_paginator('describe_alarms')

    for page in paginator.paginate(PaginationConfig={'PageSize': 100}):
        for alarm in page['MetricAlarms']:
            alarms.append(alarm)
            print(f"Found alarm: {alarm['AlarmName']} with state: {alarm['StateValue']}")

    print(f"Total alarms found: {len(alarms)}")
    return alarms


def reset_alarm_state(alarm_name):
    try:
        print(f"Resetting alarm: {alarm_name}")
        cloudwatch.set_alarm_state(
            AlarmName=alarm_name,
            StateValue='OK',
            StateReason='Resetting state from script'
        )
        print(f"Successfully reset alarm: {alarm_name}")
    except Exception as e:
        print(f"Failed to reset alarm: {alarm_name}. Error: {e}")
        raise e


def check_and_reset_alarms():
    alarms = get_all_alarms()

    for alarm in alarms:
        actions = alarm.get('AlarmActions', [])
        print(f"Alarm: {alarm['AlarmName']} has the following actions: {actions}")
        has_autoscaling_action = False

        # Check if any action is related to Auto Scaling
        for action in actions:
            if 'autoscaling' in action:
                has_autoscaling_action = True
                break  # No need to check further actions

        # Reset the alarm only if it has no Auto Scaling actions
        if not has_autoscaling_action and alarm['StateValue'] == 'ALARM':
            reset_alarm_state(alarm['AlarmName'])
        elif has_autoscaling_action and alarm['StateValue'] == 'ALARM':
            print(f"Skipped resetting alarm: {alarm['AlarmName']} due to Auto Scaling action.\n"
                  f"Alarm: {alarm['AlarmName']} has the following actions: {actions}")


def handler(event, context):
    print("Received event:", json.dumps(event))
    check_and_reset_alarms()