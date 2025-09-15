terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data sources
data "aws_availability_zones" "available" {
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

data "aws_caller_identity" "current" {}

# VPC - Minimal setup
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project_name}-dev-vpc"
  cidr = var.vpc_cidr

  azs             = slice(data.aws_availability_zones.available.names, 0, 2) # Only 2 AZs for cost
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets
  database_subnets = var.database_subnets

  enable_nat_gateway   = true
  single_nat_gateway   = true  # Single NAT for cost savings
  enable_dns_hostnames = true
  enable_dns_support   = true

  create_database_subnet_group = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }

  tags = var.tags
}

# EKS Cluster - Minimal setup
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "${var.project_name}-dev-cluster"
  cluster_version = var.kubernetes_version

  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true

  # Fargate Profile for cost optimization
  fargate_profiles = {
    default = {
      name = "default"
      selectors = [
        {
          namespace = "home-hub"
        },
        {
          namespace = "kube-system"
        }
      ]
    }
  }

  tags = var.tags
}

# RDS PostgreSQL - Minimal/Free tier eligible
resource "aws_db_subnet_group" "home_hub_dev" {
  name       = "${var.project_name}-dev-db-subnet-group"
  subnet_ids = module.vpc.database_subnets

  tags = merge(var.tags, {
    Name = "${var.project_name}-dev-db-subnet-group"
  })
}

resource "aws_security_group" "rds_dev" {
  name_prefix = "${var.project_name}-dev-rds"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = var.tags
}

resource "aws_db_instance" "home_hub_dev" {
  identifier = "${var.project_name}-dev-db"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"  # Free tier eligible

  allocated_storage     = 20  # Free tier: 20GB
  max_allocated_storage = 20  # No auto-scaling for cost control
  storage_encrypted     = false  # Encryption costs extra on free tier

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds_dev.id]
  db_subnet_group_name   = aws_db_subnet_group.home_hub_dev.name

  backup_retention_period = 1  # Minimal backup retention
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = var.tags
}

# ECR Repository
resource "aws_ecr_repository" "home_hub_dev" {
  name                 = "${var.project_name}-dev"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false  # Disable scanning for cost savings
  }

  tags = var.tags
}

# ECR Lifecycle Policy to manage costs
resource "aws_ecr_lifecycle_policy" "home_hub_dev" {
  repository = aws_ecr_repository.home_hub_dev.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 5 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 5
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Delete untagged images older than 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}