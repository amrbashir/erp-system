# ERP System Backend Deployment to Amazon ECS

This directory contains the configuration files needed to deploy the ERP System backend to Amazon ECS.

## Files

- `Dockerfile` - Docker image definition for the backend service
- `task-definition.json` - ECS Task Definition template with placeholders
- `service-definition.json` - ECS Service Definition template with placeholders

## Deployment Methods

### Automated Deployment with GitHub Actions

A GitHub Actions workflow has been set up to automate the deployment process. The workflow file is located at `.github/workflows/deploy-backend.yml`.

The workflow is triggered:

- On pushes to the `master` branch that modify files in `packages/backend` or `packages/utils`
- Manually via GitHub Actions UI (workflow_dispatch)

#### Required GitHub Secrets

Before the deployment workflow can run successfully, you need to set up the following secrets in your GitHub repository:

1. **AWS_ROLE_TO_ASSUME**: The ARN of the IAM role that GitHub Actions will assume
2. **AWS_REGION**: The AWS region where your ECS cluster is located
3. **AWS_ACCOUNT_ID**: Your AWS account ID
4. **AWS_ECR_REPOSITORY**: The name of your ECR repository
5. **AWS_ECS_CLUSTER**: The name of your ECS cluster
6. **AWS_ECS_SERVICE**: The name of your ECS service
7. **AWS_ECS_TASK_FAMILY**: The family name for your task definition
8. **AWS_ECS_EXECUTION_ROLE**: The ARN or name of the execution role
9. **AWS_ECS_TASK_ROLE**: The ARN or name of the task role
10. **AWS_ECS_CONTAINER_NAME**: The name of your container
11. **AWS_ECS_SUBNET_ID_1**: The ID of the first subnet for the ECS task
12. **AWS_ECS_SUBNET_ID_2**: The ID of the second subnet for the ECS task
13. **AWS_ECS_SECURITY_GROUP**: The ID of the security group for the ECS task
14. **AWS_LB_TARGET_GROUP_NAME**: The name of the load balancer target group
15. **AWS_LB_TARGET_GROUP_ID**: The ID of the load balancer target group
16. **AWS_SSM_PARAMETER_PATH**: The SSM parameter path for environment variables

## Required AWS Resources

Before deployment, make sure you have:

1. An ECR repository for the Docker image
2. An ECS cluster
3. Proper IAM roles (ecsTaskExecutionRole and ecsTaskRole)
4. A VPC with at least two subnets
5. A security group allowing inbound traffic on port 3000
6. A database URL stored in SSM Parameter Store
7. An Application Load Balancer and target group (if using load balancing)

## Environment Variables

The application uses environment variables stored in AWS Systems Manager Parameter Store (SSM).

To update the `DATABASE_URL` parameter in SSM Parameter Store:

- Navigate to AWS Systems Manager → Parameter Store
- Click "Create parameter"
- Name: Enter the path specified in `AWS_SSM_PARAMETER_PATH` secret (e.g., "/erp-system/database-url")
- Type: Select "SecureString"
- Value: Enter your database connection string
- Click "Create parameter"

## Database Migrations

Before deploying a new version, make sure to run database migrations:

```powershell
# Run this locally or in CI/CD pipeline
pnpm -F @erp-system/backend prisma migrate deploy
```
