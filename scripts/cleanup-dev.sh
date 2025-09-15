#!/bin/bash

set -e

echo "🧹 Cleaning up Home Hub Development Environment"
echo "=============================================="

echo "⚠️  WARNING: This will delete ALL development resources and data!"
echo "   - EKS Cluster"
echo "   - RDS Database (all data will be lost)"
echo "   - VPC and networking"
echo "   - ECR Repository and images"
echo ""

read -p "Are you sure you want to delete everything? Type 'DELETE' to confirm: " CONFIRM

if [ "$CONFIRM" != "DELETE" ]; then
    echo "❌ Cleanup cancelled."
    exit 1
fi

echo "🗑️  Deleting Kubernetes resources..."
kubectl delete namespace home-hub --ignore-not-found=true

echo "🗑️  Destroying Terraform infrastructure..."
cd terraform/dev

if [ -f terraform.tfstate ]; then
    terraform destroy -auto-approve
else
    echo "ℹ️  No Terraform state found, skipping infrastructure cleanup"
fi

echo "🧹 Cleaning up local Docker images..."
docker rmi home-hub-dev:latest 2>/dev/null || true

echo "✅ Cleanup complete!"
echo ""
echo "💰 Cost Impact:"
echo "   - All AWS resources have been terminated"
echo "   - No further charges will be incurred"
echo "   - ECR images have been deleted"