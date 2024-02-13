import boto3
import json
import time

# Create CloudWatch client
cloudwatch = boto3.client('cloudwatch')

# Define log levels
TRACE = 10
DEBUG = 20
INFO = 30
WARN = 40
ERROR = 50
FATAL = 60
PANIC = 70

# Default log level
DEFAULT_LOG_LEVEL = WARN


# Custom logger function
def log(level, msg, svc="CloudWatchService", name="CustomLogger"):
    if level < DEFAULT_LOG_LEVEL:
        return  # Skip logging if below default log level
    log_entry = {
        "level": level,
        "msg": msg,
        "svc": svc,
        "name": name,
        "time": int(time.time() * 1000)  # Current time in milliseconds since epoch
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
        log(INFO, f"Alarm: {alarm['AlarmName']} has the following actions: {actions}")
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
            log(INFO, f"Skipped resetting alarm: {alarm['AlarmName']} due to Auto Scaling action.\n"
                      f"Alarm: {alarm['AlarmName']} has the following actions: {actions}")

def handler(event, context):
    log(INFO, "Received event: " + json.dumps(event))
    check_and_reset_alarms()
