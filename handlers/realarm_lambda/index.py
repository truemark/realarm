import boto3
import json
import time

# Create CloudWatch client
cloudwatch = boto3.client('cloudwatch')

# Define log levels
INFO = 30
WARN = 40
FATAL = 60


# Custom logger function
def log(level, msg, svc="AWS LambdaAdd", name="log"):

    log_entry = {
        "level": level,
        "time": int(time.time() * 1000),
        "msg": msg,
        "svc": svc,
        "name": name,
    }
    print(json.dumps(log_entry))


def get_all_alarms():
    log(INFO, "Fetching all alarms...")
    alarms = []
    paginator = cloudwatch.get_paginator('describe_alarms')

    for page in paginator.paginate(PaginationConfig={'PageSize': 100}):
        for alarm in page['MetricAlarms']:
            alarms.append(alarm)
            log(INFO, f"Found alarm: {alarm['AlarmName']} with state: {alarm['StateValue']}")

    log(INFO, f"Total alarms found: {len(alarms)}")
    return alarms


def reset_alarm_state(alarm_name):
    try:
        log(INFO, f"Resetting alarm: {alarm_name}")
        cloudwatch.set_alarm_state(
            AlarmName=alarm_name,
            StateValue='OK',
            StateReason='Resetting state from script'
        )
        log(INFO, f"Successfully reset alarm: {alarm_name}")
    except Exception as e:
        log(FATAL, f"Failed to reset alarm: {alarm_name}. Error: {e}")
        raise e


def check_and_reset_alarms():
    alarms = get_all_alarms()

    for alarm in alarms:
        actions = alarm.get('AlarmActions', [])
        log(INFO, f"Alarm: {alarm['AlarmName']} is in a {alarm['StateValue']} state and has the following actions: "
                  f"{actions}")
        has_autoscaling_action = False

        # Check if any action is related to Auto Scaling
        for action in actions:
            if 'autoscaling' in action:
                has_autoscaling_action = True
                break  # No need to check further actions

        # Reset the alarm only if it has no Auto Scaling actions
        if not has_autoscaling_action and alarm['StateValue'] == 'ALARM':
            log(INFO, f"{alarm['AlarmName']} is in ALARM state. Resetting...'")
            try:
                reset_alarm_state(alarm['AlarmName'])
                log(INFO, f"Successfully reset alarm: {alarm['AlarmName']}")
            except Exception as e:
                log(FATAL, f"Failed to reset alarm: {alarm['AlarmName']}. Error: {e}")
                raise e
        elif has_autoscaling_action and alarm['StateValue'] == 'ALARM':
            log(INFO, f"Skipped resetting alarm: {alarm['AlarmName']} due to Auto Scaling action.\n"
                      f"Alarm: {alarm['AlarmName']} has the following AutoScaling actions: {actions}")


def handler(event, context):
    log(INFO, "Received event: " + json.dumps(event))
    check_and_reset_alarms()
