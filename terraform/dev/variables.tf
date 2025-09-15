variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"  # Cheapest region
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "home-hub"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnets" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]  # Only 2 subnets
}

variable "public_subnets" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]  # Only 2 subnets
}

variable "database_subnets" {
  description = "Database subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.201.0/24", "10.0.202.0/24"]  # Only 2 subnets
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "homehub_dev"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "homehub_dev_user"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "home_ip" {
  description = "Your home IP address for security group access"
  type        = string
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default = {
    Project     = "home-hub"
    Environment = "development"
    ManagedBy   = "terraform"
    CostCenter  = "development"
  }
}