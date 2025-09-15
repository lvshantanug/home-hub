# Home Hub - Secure Home Management System

A comprehensive web application for managing your home network, security, expenses, and family calendar. Built with security in mind and deployed on AWS EKS with enterprise-grade infrastructure.

## Features

### ✅ Currently Implemented
- **Network Device Monitoring**: Real-time scanning and monitoring of devices on your network
- **IP-based Security**: Access restricted to your home IP address
- **User Authentication**: Secure login system with JWT tokens
- **Real-time Updates**: WebSocket connections for live device status updates
- **Device Management**: Name, categorize, and add notes to your devices
- **AWS Cloud Deployment**: Production-ready EKS deployment with PostgreSQL
- **CI/CD Pipeline**: Automated deployment with GitHub Actions

### 🚧 Coming Soon
- **Security Monitoring**: Suspicious connection detection and intrusion alerts
- **Expense Tracking**: Household budget management with receipt scanning
- **Family Calendar**: Shared calendar with notifications and task assignments
- **Home Automation**: Smart device control integration

## Architecture

### Tech Stack
- **Backend**: Node.js, Express, PostgreSQL, WebSocket
- **Frontend**: React, Material-UI, Axios
- **Infrastructure**: AWS EKS, RDS PostgreSQL, ECR, ALB
- **Security**: JWT authentication, IP whitelisting, rate limiting, VPC isolation
- **CI/CD**: GitHub Actions, Docker, Kubernetes
- **IaC**: Terraform for infrastructure management

### AWS Services Used
- **EKS**: Kubernetes cluster for container orchestration
- **RDS**: Managed PostgreSQL database
- **ECR**: Container registry for Docker images
- **VPC**: Network isolation and security
- **ALB**: Application Load Balancer with SSL termination
- **IAM**: Role-based access control

## Deployment Options

### Option 1: Local Development
1. **Install dependencies**:
   ```bash
   npm run install-all
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start the application**:
   ```bash
   npm run dev
   ```

4. **Access the app**:
   - Open http://localhost:3000
   - Login with: `admin` / `admin123`
   - **Change the default password immediately!**

### Option 2: AWS EKS Production Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for complete AWS deployment instructions.

**Quick AWS Setup:**
1. Configure AWS credentials and Terraform variables
2. Deploy infrastructure: `./scripts/deploy-infrastructure.sh`
3. Set up Kubernetes secrets: `./scripts/setup-secrets.sh`
4. Configure GitHub Actions for CI/CD
5. Push to main branch to trigger deployment

## Configuration

### IP Whitelisting
Edit the `ALLOWED_IPS` in your `.env` file:
```
# Single IP
ALLOWED_IPS=192.168.1.100

# Multiple IPs
ALLOWED_IPS=192.168.1.100,192.168.1.101,10.0.0.50

# CIDR notation (entire subnet)
ALLOWED_IPS=192.168.1.0/24,10.0.0.0/24
```

### Security Settings
- Change the default JWT secret in `.env`
- Update the default admin password after first login
- Consider running behind a reverse proxy (nginx) for additional security

## Network Scanning

The app automatically scans your local network every 2 minutes to detect:
- New devices joining the network
- Devices going online/offline
- Device hostnames and MAC addresses

## Development

### Project Structure
```
├── server/                 # Backend API
│   ├── routes/            # API endpoints
│   ├── middleware/        # Security middleware
│   ├── services/          # Network scanning, etc.
│   └── database/          # Database initialization
├── client/                # React frontend
│   ├── src/components/    # UI components
│   └── src/context/       # React context (auth, etc.)
└── package.json           # Root package.json
```

### Available Scripts
- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend (requires backend running)
- `npm run build` - Build the frontend for production

## Security Considerations

- **IP Restriction**: Only accessible from whitelisted IP addresses
- **Authentication**: JWT-based authentication with configurable expiration
- **Rate Limiting**: Prevents brute force attacks
- **HTTPS**: Use a reverse proxy with SSL certificates for production
- **Firewall**: Consider additional firewall rules for your home network

## Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Build the frontend: `npm run build`
3. Use a process manager like PM2
4. Set up nginx as a reverse proxy with SSL
5. Configure your router/firewall appropriately

## Contributing

This is a personal home management system. Feel free to fork and customize for your own needs!

## License

MIT License - See LICENSE file for details