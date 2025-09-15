#!/bin/bash

set -e

echo "🏠 Home Hub - Development Deployment"
echo "===================================="

# Check if required tools are installed
command -v terraform >/dev/null 2>&1 || { echo "❌ Terraform is required but not installed. Aborting." >&2; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI is required but not installed. Aborting." >&2; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "❌ kubectl is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }

# Check AWS credentials
aws sts get-caller-identity >/dev/null 2>&1 || { echo "❌ AWS credentials not configured. Run 'aws configure' first." >&2; exit 1; }

echo "💰 Estimated Monthly Cost: $50-80 (with free tier)"
echo "   - EKS Control Plane: $73"
echo "   - RDS t3.micro: $0 (free tier) or $13"
echo "   - NAT Gateway: $32"
echo "   - Fargate: $5-15 (minimal usage)"
echo ""

read -p "Do you want to proceed with the development deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

cd terraform/dev

# Check if terraform.tfvars exists
if [ ! -f terraform.tfvars ]; then
    echo "❌ terraform.tfvars not found. Please copy terraform.tfvars.example and update with your values."
    exit 1
fi

echo "📋 Initializing Terraform..."
terraform init

echo "📋 Planning infrastructure..."
terraform plan

echo "🏗️  Deploying infrastructure..."
terraform apply -auto-approve

# Get outputs
ECR_URL=$(terraform output -raw ecr_repository_url)
CLUSTER_NAME=$(terraform output -raw cluster_name)
DB_URL=$(terraform output -raw database_url)

echo "✅ Infrastructure deployed successfully!"
echo ""
echo "📝 Configuring kubectl..."
aws eks update-kubeconfig --region us-east-1 --name $CLUSTER_NAME

echo "🔐 Setting up secrets..."
# Generate JWT secret if not provided
JWT_SECRET=$(openssl rand -base64 32)

# Create secret
kubectl create namespace home-hub --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic home-hub-secrets \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=DATABASE_URL="$DB_URL" \
  --namespace=home-hub \
  --dry-run=client -o yaml | kubectl apply -f -

echo "🐳 Building and pushing Docker image..."
cd ../../

# Build image
docker build -t home-hub-dev .

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URL

# Tag and push
docker tag home-hub-dev:latest $ECR_URL:latest
docker push $ECR_URL:latest

echo "☸️  Deploying to Kubernetes..."
# Update image in deployment
sed "s|YOUR_ECR_REPO/home-hub-dev:latest|$ECR_URL:latest|g" k8s/dev/deployment.yaml > k8s/dev/deployment-updated.yaml

# Get home IP
HOME_IP=$(curl -s ifconfig.me)
echo "🏠 Detected home IP: $HOME_IP"

# Update ConfigMap and Service with home IP
sed "s/YOUR_HOME_IP_HERE/$HOME_IP/g" k8s/dev/configmap.yaml > k8s/dev/configmap-updated.yaml
sed "s/YOUR_HOME_IP_HERE/$HOME_IP/g" k8s/dev/service.yaml > k8s/dev/service-updated.yaml

# Apply Kubernetes manifests
kubectl apply -f k8s/dev/namespace.yaml
kubectl apply -f k8s/dev/configmap-updated.yaml
kubectl apply -f k8s/dev/deployment-updated.yaml
kubectl apply -f k8s/dev/service.yaml

# Wait for deployment
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/home-hub-app -n home-hub --timeout=300s

# Get service URL
echo "🎉 Deployment complete!"
echo ""
echo "📋 Service Information:"
kubectl get svc home-hub-service -n home-hub

echo ""
echo "🌐 Getting Load Balancer URL..."
LB_URL=$(kubectl get svc home-hub-service -n home-hub -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

if [ -n "$LB_URL" ]; then
    echo "✅ Your Home Hub is available at: http://$LB_URL"
    echo "🔑 Login with: admin / admin123"
    echo "⚠️  Change the default password immediately!"
else
    echo "⏳ Load balancer is still provisioning. Check again in a few minutes:"
    echo "   kubectl get svc home-hub-service -n home-hub"
fi

echo ""
echo "📊 Useful commands:"
echo "   View pods: kubectl get pods -n home-hub"
echo "   View logs: kubectl logs -f deployment/home-hub-app -n home-hub"
echo "   Port forward: kubectl port-forward svc/home-hub-service 8080:80 -n home-hub"

# Cleanup temp files
rm -f k8s/dev/deployment-updated.yaml k8s/dev/configmap-updated.yaml k8s/dev/service-updated.yaml