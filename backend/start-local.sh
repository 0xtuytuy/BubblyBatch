#!/bin/bash

# Unset AWS profile to avoid credential issues in offline mode
unset AWS_PROFILE
unset AWS_DEFAULT_PROFILE

# Set offline mode and disable AWS SDK config loading
export IS_OFFLINE=true
export AWS_SDK_LOAD_CONFIG=0

# Set local environment variables
export TABLE_NAME=kefir-table-local
export BUCKET_NAME=kefir-photos-local
export USER_POOL_ID=local-pool
export USER_POOL_CLIENT_ID=local-client
export SCHEDULER_GROUP_NAME=kefir-reminders-local
export STAGE=local
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=916767170641

# Run startup script
ts-node local/start.ts

# Start serverless offline with --ignoreJWTSignature flag
serverless offline --stage local --noAuth

