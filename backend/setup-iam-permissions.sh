#!/bin/bash
# Script to set up IAM permissions for Serverless deployment

POLICY_NAME="ServerlessDeploymentPolicy"
USER_NAME="root"  # Change this if using a different IAM user

echo "Creating IAM policy for Serverless deployment..."

# Create the policy
POLICY_ARN=$(aws iam create-policy \
  --policy-name $POLICY_NAME \
  --policy-document file://aws-deployment-policy.json \
  --query 'Policy.Arn' \
  --output text 2>/dev/null)

# If policy already exists, get its ARN
if [ $? -ne 0 ]; then
  echo "Policy may already exist, retrieving ARN..."
  POLICY_ARN=$(aws iam list-policies --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" --output text)
fi

echo "Policy ARN: $POLICY_ARN"

# Attach policy to user
echo "Attaching policy to user: $USER_NAME"
aws iam attach-user-policy \
  --user-name $USER_NAME \
  --policy-arn $POLICY_ARN

if [ $? -eq 0 ]; then
  echo "✓ Policy attached successfully!"
else
  echo "✗ Failed to attach policy. You may need to do this manually in the AWS Console."
  echo "  Go to: IAM → Users → $USER_NAME → Add permissions → Attach policies"
  echo "  Policy ARN: $POLICY_ARN"
fi

