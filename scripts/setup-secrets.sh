#!/bin/bash

set -e

echo "🔐 Setting up Kubernetes Secrets"
echo "==============================="

# Check if kubectl is configured
kubectl cluster-info >/dev/null 2>&1 || { echo "❌ kubectl not configured. Run 'aws eks update-kubeconfig' first." >&2; exit 1; }

# Prompt for secrets
echo "Please provide the following secrets:"

read -p "JWT Secret (press enter for random): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT Secret: $JWT_SECRET"
fi

read -p "Database URL (postgresql://user:pass@host:5432/db): " DATABASE_URL

read -p "Your home IP address: " HOME_IP

# Base64 encode secrets
JWT_SECRET_B64=$(echo -n "$JWT_SECRET" | base64)
DATABASE_URL_B64=$(echo -n "$DATABASE_URL" | base64)

# Update secret.yaml
cat > k8s/secret.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: home-hub-secrets
  namespace: home-hub
type: Opaque
data:
  JWT_SECRET: $JWT_SECRET_B64
  DATABASE_URL: $DATABASE_URL_B64
EOF

# Update configmap.yaml with home IP
sed -i.bak "s/YOUR_HOME_IP_HERE/$HOME_IP/g" k8s/configmap.yaml
rm k8s/configmap.yaml.bak

echo "✅ Secrets configured successfully!"
echo "📝 Files updated:"
echo "   - k8s/secret.yaml"
echo "   - k8s/configmap.yaml"
echo ""
echo "🚀 Apply with: kubectl apply -f k8s/"