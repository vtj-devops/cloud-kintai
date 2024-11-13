locals {
  paths       = split("/", regex("terraform/.*", abspath(path.root)))
  environment = local.paths[2]
}

module "app" {
  source = "../../modules/app"

  environment     = local.environment
  domain_identity = var.domain_identity
  email_identity  = var.email_identity
}
