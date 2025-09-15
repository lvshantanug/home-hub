# Home Hub - Testing & Development Guide

This guide provides multiple options for testing your Home Hub application, from completely free local testing to minimal cost AWS deployment.

## Testing Options (Ordered by Cost)

### Option 1: Free Local Testing 💰 $0/month

**Best for**: Initial development, feature testing, learning the application

**Requirements**: Docker, Node.js

```bash
# Quick start
./scripts/start-local.sh

# Manual setup
cd client && npm install && npm run build && cd ..
docker-compose up -d
```

**What you get**:
- Full application with PostgreSQL database
- Real network scanning (scans your local network)
- All features working locally
- No AWS costs

**Access**: http://localhost:5000

---

### Option 2: AWS Development Environment 💰 $50-80/month

**Best for**: Testing AWS integration, CI/CD pipeline, realistic cloud environment

**What's included**:
- EKS cluster with Fargate (serverless containers)
- RDS PostgreSQL t3.micro (free tier eligible)
- Single NAT Gateway
- ECR repository
- Load Balancer

**Estimated costs**:
- EKS Control Plane: $73/month
- RDS t3.micro: $0 (free tier) or $13/month
- NAT Gateway: $32/month
- Fargate: $5-15/month (minimal usage)
- **Total**: ~$50-80/month (less with AWS free tier)

```bash
# Setup
cd terraform/dev
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Deploy
./scripts/deploy-dev.sh

# Cleanup when done
./scripts/cleanup-dev.sh
```

---

### Option 3: Production Environment 💰 $150-200/month

**Best for**: Production deployment, high availability

See [DEPLOYMENT.md](DEPLOYMENT.md) for full production setup.

## Quick Start Guide

### 1. Local Testing (Recommended First Step)

```bash
# Prerequisites
# - Docker installed and running
# - Node.js 18+ installed

# Clone and start
git clone <your-repo>
cd home-hub
./scripts/start-local.sh
```

**What to test locally**:
- ✅ Login functionality (admin/admin123)
- ✅ Network device scanning
- ✅ Real-time updates via WebSocket
- ✅ Device management (naming, categorization)
- ✅ Security features (IP whitelisting)

### 2. AWS Development Testing

Only proceed to AWS after local testing works perfectly.

```bash
# Prerequisites
# - AWS CLI configured
# - Terraform installed
# - kubectl installed

# Setup AWS credentials
aws configure

# Deploy to AWS
cd terraform/dev
cp terraform.tfvars.example terraform.tfvars
# Edit with your values (especially home IP and DB password)

./scripts/deploy-dev.sh
```

**What to test on AWS**:
- ✅ Cloud deployment process
- ✅ Database connectivity (PostgreSQL)
- ✅ Load balancer and SSL
- ✅ IP-based access restrictions
- ✅ Container scaling
- ✅ CI/CD pipeline (if configured)

## Testing Checklist

### Core Functionality
- [ ] Application starts without errors
- [ ] Login with default credentials works
- [ ] Password change functionality
- [ ] Network scanning detects devices
- [ ] Real-time updates work (WebSocket)
- [ ] Device naming and categorization
- [ ] IP restriction works (test from different IP)

### Security Testing
- [ ] JWT token expiration
- [ ] Rate limiting (try rapid requests)
- [ ] IP whitelist enforcement
- [ ] SQL injection protection
- [ ] XSS protection

### Performance Testing
- [ ] Network scan performance with many devices
- [ ] WebSocket connection stability
- [ ] Database query performance
- [ ] Memory usage under load

### AWS-Specific Testing
- [ ] EKS pod startup and health checks
- [ ] RDS connectivity and failover
- [ ] Load balancer health checks
- [ ] Auto-scaling behavior
- [ ] Backup and restore procedures

## Development Workflow

### 1. Local Development
```bash
# Start local environment
./scripts/start-local.sh

# Make changes to code
# Test locally

# When ready, commit changes
git add .
git commit -m "Add new feature"
```

### 2. AWS Testing
```bash
# Deploy to AWS dev environment
./scripts/deploy-dev.sh

# Test in cloud environment
# Verify everything works

# If issues, check logs
kubectl logs -f deployment/home-hub-app -n home-hub
```

### 3. Production Deployment
```bash
# Only after thorough testing in dev
git push origin main  # Triggers CI/CD pipeline
```

## Troubleshooting

### Local Issues

**Docker containers won't start**:
```bash
docker-compose logs
docker-compose down && docker-compose up -d
```

**Database connection issues**:
```bash
docker-compose exec postgres psql -U homehub_user -d homehub_dev
```

**Network scanning not working**:
- Check if running in Docker network
- Verify ping and nmap tools are available
- Check network permissions

### AWS Issues

**EKS pods not starting**:
```bash
kubectl describe pod <pod-name> -n home-hub
kubectl logs <pod-name> -n home-hub
```

**Database connection issues**:
```bash
# Check security groups
# Verify DATABASE_URL secret
kubectl get secret home-hub-secrets -n home-hub -o yaml
```

**Load balancer not accessible**:
```bash
kubectl get svc -n home-hub
# Check security group rules
# Verify home IP in allowed ranges
```

## Cost Management

### Minimize AWS Costs

1. **Use AWS Free Tier**:
   - RDS t3.micro (12 months free)
   - 750 hours EC2 equivalent

2. **Development Best Practices**:
   - Stop/start EKS cluster when not needed
   - Use Fargate instead of EC2 nodes
   - Clean up unused ECR images
   - Monitor costs with AWS Cost Explorer

3. **Cleanup Resources**:
   ```bash
   # Always cleanup when done testing
   ./scripts/cleanup-dev.sh
   ```

### Cost Monitoring
```bash
# Check current costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

## Next Steps

1. **Start with local testing** - it's free and fast
2. **Move to AWS dev** only when local works perfectly
3. **Set up CI/CD** for automated deployments
4. **Add monitoring** and alerting
5. **Implement backup** strategies
6. **Scale to production** when ready

## Support

### Getting Help
- Check logs first: `docker-compose logs` or `kubectl logs`
- Review this guide and [DEPLOYMENT.md](DEPLOYMENT.md)
- Check AWS CloudWatch for detailed error logs
- Use `kubectl describe` for Kubernetes issues

### Useful Resources
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)