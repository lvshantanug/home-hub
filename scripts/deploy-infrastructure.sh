#!/bin/bash

set -e

echo "🚀 Deploying Home Hub Infrastructure to AWS"
echo "============================================"

# Check if required tools are installed
command -v terraform >/dev/null 2>&1 || { echo "❌ Terraform is required but not installed. Aborting." >&2; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI is required but not installed. Aborting." >&2; exit 1; }

# Check AWS credentials
aws sts get-caller-identity >/dev/null 2>&1 || { echo "❌ AWS credentials not configured. Run 'aws configure' first." >&2; exit 1; }

cd terraform

# Check if terraform.tfvars exists
if [ ! -f terraform.tfvars ]; then
    echo "❌ terraform.tfvars not found. Please copy terraform.tfvars.example and update with your values."
    exit 1
fi

echo "📋 Initializing Terraform..."
terraform init

echo "📋 Planning infrastructure..."
terraform plan

echo "🏗️  Applying infrastructure..."
read -p "Do you want to proceed with the deployment? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    terraform apply -auto-approve
    
    echo "✅ Infrastructure deployed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update your kubeconfig: aws eks update-kubeconfig --region us-west-2 --name home-hub-cluster"
    echo "2. Install AWS Load Balancer Controller: ./scripts/install-alb-controller.sh"
    echo "3. Update k8s/secret.yaml with your actual secrets"
    echo "4. Update k8s/configmap.yaml with your home IP"
    echo "5. Set up GitHub Actions secrets for CI/CD"
else
    echo "❌ Deployment cancelled."
    exit 1
fi