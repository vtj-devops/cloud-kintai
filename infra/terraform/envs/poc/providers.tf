terraform {
  required_version = "~> 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.75.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = "ap-northeast-1"

  default_tags {
    tags = {
      Env = local.environment
    }
  }
}
