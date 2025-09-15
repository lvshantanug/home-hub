#!/bin/bash

set -e

echo "🔧 Installing AWS Load Balancer Controller"
echo "=========================================="

# Variables
CLUSTER_NAME="home-hub-cluster"
REGION="us-west-2"

# Update kubeconfig
echo "📋 Updating kubeconfig..."
aws eks update-kubeconfig --region $REGION --name $CLUSTER_NAME

# Install cert-manager
echo "📦 Installing cert-manager..."
kubectl apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/v1.5.4/cert-manager.yaml

# Wait for cert-manager to be ready
echo "⏳ Waiting for cert-manager to be ready..."
kubectl wait --for=condition=ready pod -l app=cert-manager -n cert-manager --timeout=300s

# Download ALB controller YAML
echo "📥 Downloading AWS Load Balancer Controller..."
curl -Lo v2_4_7_full.yaml https://github.com/kubernetes-sigs/aws-load-balancer-controller/releases/download/v2.4.7/v2_4_7_full.yaml

# Update cluster name in the YAML
sed -i.bak -e "s|your-cluster-name|$CLUSTER_NAME|" v2_4_7_full.yaml

# Apply the controller
echo "🚀 Installing AWS Load Balancer Controller..."
kubectl apply -f v2_4_7_full.yaml

# Clean up
rm v2_4_7_full.yaml v2_4_7_full.yaml.bak

# Wait for controller to be ready
echo "⏳ Waiting for AWS Load Balancer Controller to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=aws-load-balancer-controller -n kube-system --timeout=300s

echo "✅ AWS Load Balancer Controller installed successfully!"