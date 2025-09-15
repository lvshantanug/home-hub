# Home Hub - AWS EKS Deployment Guide

This guide will help you deploy your Home Hub application to AWS using EKS, PostgreSQL RDS, and GitHub Actions CI/CD.

## Prerequisites

### Required Tools
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate permissions
- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
- [Docker](https://docs.docker.com/get-docker/)
- GitHub account

### AWS Permissions Required
Your AWS user/role needs permissions for:
- EKS (create/manage clusters)
- EC2 (VPC, subnets, security groups, instances)
- RDS (create/manage databases)
- ECR (create/manage repositories)
- IAM (create roles for EKS)

## Step 1: Infrastructure Setup

### 1.1 Configure Terraform Variables
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:
```hcl
aws_region = "us-west-2"
db_password = "your-secure-password-here"
home_ip = "YOUR_HOME_IP/32"  # Get from whatismyip.com
```

### 1.2 Deploy Infrastructure
```bash
./scripts/deploy-infrastructure.sh
```

This will create:
- VPC with public/private subnets
- EKS cluster with managed node groups
- RDS PostgreSQL database
- ECR repository
- Security groups and IAM roles

### 1.3 Configure kubectl
```bash
aws eks update-kubeconfig --region us-west-2 --name home-hub-cluster
```

### 1.4 Install AWS Load Balancer Controller
```bash
./scripts/install-alb-controller.sh
```

## Step 2: Application Configuration

### 2.1 Set up Kubernetes Secrets
```bash
./scripts/setup-secrets.sh
```

This will prompt for:
- JWT secret (or generate one)
- Database connection string
- Your home IP address

### 2.2 Update Kubernetes Manifests

Edit `k8s/ingress.yaml`:
- Replace `your-domain.com` with your actual domain
- Update the SSL certificate ARN
- Verify the home IP CIDR

Edit `k8s/deployment.yaml`:
- Update the ECR repository URL

## Step 3: GitHub Actions CI/CD Setup

### 3.1 Create GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/home-hub.git
git push -u origin main
```

### 3.2 Configure GitHub Secrets
In your GitHub repository, go to Settings > Secrets and variables > Actions, and add:

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

### 3.3 Update Workflow Configuration
Edit `.github/workflows/deploy.yml`:
- Update `AWS_REGION` if different
- Update `EKS_CLUSTER_NAME` if you changed it
- Update `ECR_REPOSITORY` name if different

## Step 4: Initial Deployment

### 4.1 Manual First Deployment
For the first deployment, do it manually to ensure everything works:

```bash
# Build and push Docker image
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin YOUR_ECR_URL

docker build -t home-hub .
docker tag home-hub:latest YOUR_ECR_URL/home-hub:latest
docker push YOUR_ECR_URL/home-hub:latest

# Deploy to Kubernetes
kubectl apply -f k8s/
```

### 4.2 Verify Deployment
```bash
# Check pods
kubectl get pods -n home-hub

# Check services
kubectl get svc -n home-hub

# Check ingress
kubectl get ingress -n home-hub

# View logs
kubectl logs -f deployment/home-hub-app -n home-hub
```

## Step 5: DNS and SSL Setup

### 5.1 Get Load Balancer URL
```bash
kubectl get ingress home-hub-ingress -n home-hub -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

### 5.2 Configure DNS
Point your domain to the ALB hostname using a CNAME record.

### 5.3 SSL Certificate
Create an SSL certificate in AWS Certificate Manager and update the ingress annotation with the certificate ARN.

## Step 6: Security Configuration

### 6.1 Network Security
- The application is configured to only accept connections from your home IP
- Update `ALLOWED_IPS` in the ConfigMap if your IP changes
- Consider setting up a VPN for remote access

### 6.2 Database Security
- RDS is in private subnets, only accessible from EKS
- Enable encryption at rest (already configured)
- Regular backups are enabled

### 6.3 Application Security
- Change default admin password immediately after first login
- Use strong JWT secrets
- Enable audit logging if needed

## Step 7: Monitoring and Maintenance

### 7.1 View Application Logs
```bash
kubectl logs -f deployment/home-hub-app -n home-hub
```

### 7.2 Scale Application
```bash
kubectl scale deployment home-hub-app --replicas=3 -n home-hub
```

### 7.3 Update Application
Push changes to the main branch, and GitHub Actions will automatically:
1. Run tests
2. Build new Docker image
3. Deploy to EKS
4. Verify deployment

## Troubleshooting

### Common Issues

**Pods not starting:**
```bash
kubectl describe pod POD_NAME -n home-hub
kubectl logs POD_NAME -n home-hub
```

**Database connection issues:**
- Verify the DATABASE_URL secret is correct
- Check security group rules
- Ensure RDS is in the correct subnets

**Load balancer not working:**
- Verify AWS Load Balancer Controller is installed
- Check ingress annotations
- Verify certificate ARN

**IP access denied:**
- Update ALLOWED_IPS in ConfigMap
- Check your current IP: `curl ifconfig.me`
- Update ingress CIDR annotations

### Useful Commands

```bash
# Get cluster info
kubectl cluster-info

# View all resources in namespace
kubectl get all -n home-hub

# Port forward for local testing
kubectl port-forward svc/home-hub-service 8080:80 -n home-hub

# Update deployment image
kubectl set image deployment/home-hub-app home-hub=NEW_IMAGE_URL -n home-hub

# Restart deployment
kubectl rollout restart deployment/home-hub-app -n home-hub
```

## Cost Optimization

- Use t3.micro RDS instance for development
- Consider using Fargate for EKS nodes to reduce costs
- Set up auto-scaling for EKS nodes
- Use ECR lifecycle policies to clean up old images

## Cleanup

To destroy all resources:
```bash
cd terraform
terraform destroy
```

**Warning:** This will delete all data including the database!

## Support

For issues:
1. Check the troubleshooting section above
2. Review AWS CloudWatch logs
3. Check Kubernetes events: `kubectl get events -n home-hub`