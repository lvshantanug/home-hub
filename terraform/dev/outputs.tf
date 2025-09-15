output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_name" {
  description = "Kubernetes Cluster Name"
  value       = module.eks.cluster_name
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.home_hub_dev.repository_url
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.home_hub_dev.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.home_hub_dev.port
}

output "database_url" {
  description = "Complete database connection URL"
  value       = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.home_hub_dev.endpoint}:${aws_db_instance.home_hub_dev.port}/${var.db_name}"
  sensitive   = true
}

output "vpc_id" {
  description = "ID of the VPC where resources are created"
  value       = module.vpc.vpc_id
}

output "estimated_monthly_cost" {
  description = "Estimated monthly cost breakdown"
  value = {
    eks_control_plane = "$73.00"
    rds_t3_micro     = "$13.00 (free tier eligible)"
    nat_gateway      = "$32.00"
    fargate_pods     = "$5-15 (depends on usage)"
    ecr_storage      = "$1-5 (depends on images)"
    total_estimated  = "$124-138/month (less with free tier)"
  }
}