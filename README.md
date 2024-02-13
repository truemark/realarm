# CloudWatch ReAlarm Lambda Project

## Overview
This CDK Project interfaces with AWS CloudWatch to fetch, evaluate, and intelligently reset the state of CloudWatch 
alarms. The purpose of this project is to provide a means of observability by increasing the visibility of alarms that
maintain an ALARM state over extended periods of time by resetting these alarms and thereby, retriggering any alarm 
actions. This is most helpful for tracking infrastructure health after deployment or maintenance in scenarios where 
monitoring may trigger once during maintenance or deployment but not again after maintenance when infrastructure is back
online but still unhealthy. The lambda, index.py, is triggered every two hours by an event bridge rule to provide a 
balance between observability and noise reduction. index.py utilizes the Boto3 AWS SDK to interact with CloudWatch and 
performs the following functions:

- Fetch all alarms
- Filter alarms that do not have AutoScaling actions enabled as resetting these alarms could result in catastrophic
  consequences if the alarm is reset before an AutoScaling action is completed 
- Reset the state of filtered CloudWatch alarms to 'OK'
- Log operations with a custom logging standard for ease of troubleshooting

## IAM Role and Policies
This CDK project includes all the necessary IAM roles and policies to allow the lambda to interact with CloudWatch. 
These permissions are as follows: 

### 1. CloudWatch Permissions
- `cloudwatch:DescribeAlarms`: Allows the role to list or describe CloudWatch alarms. Essential for fetching information
about the current state of alarms.
- `cloudwatch:SetAlarmState`: Enables the role to change the state of any CloudWatch alarm, useful for resetting the 
state of alarms.

### 2. CloudWatch Logs Permissions for Specific Log Groups
- `logs:FilterLogEvents`: Grants the ability to retrieve log events from the specified log groups that match a filter 
pattern, aiding in log analysis.
- `logs:DescribeLogStreams`: Allows listing the log streams within the specified log groups, useful for operations 
needing identification or work with log streams.
- `logs:DescribeLogGroups`: Permits listing the log groups within the account, used for operations requiring an overview
of log groups.

These permissions target log groups with names starting with `/aws/lambda/cwsyn*` and `/aws/canary/*`, indicating 
specific naming conventions or purposes, such as logs from certain Lambda functions or canary deployments.

### 3. CloudWatch Logs Permissions for Creating and Writing Logs
- `logs:CreateLogGroup`: Allows the creation of log groups in CloudWatch Logs, necessary for initiating logging for new 
services or functions.
- `logs:CreateLogStream`: Permits the creation of log streams within the specified log group, essential for organizing 
log entries.
- `logs:PutLogEvents`: Enables the role to upload log events to the specified log stream in CloudWatch Logs, crucial for
writing logs.

These permissions are scoped to a log group with the prefix `/aws/lambda/RealarmStackRealarm*`.

## Logging
The script supports a custom logging mechanism that adheres to specified log levels and formats logs with essential 
details such as service name, log level, message, and timestamp. The following loglevels and definitions that are used 
or available to be used are listed below: 

- INFO - 30: General information about the script's operations
- WARN - 40: Warnings about potential issues or errors that may occur that are not immediately critical
- FATAL - 60: Critical errors that result in the script failing to complete its operations


## Deployment
This observability tool is designed to be deployed with CDK and contains all necessary configurations to do so out of
the box. 

## License
Proprietary License  
  
Copyright (c) 2024 TrueMark Technologies, Inc.
  
All Rights Reserved.  
  
This license applies to all files in this repository. Unauthorized copying,  
modification, distribution, and use of any files in this repository, via any  
medium, are strictly prohibited without the explicit permission of the  
copyright holder.  
  
This software and its contents are proprietary and confidential.




