variable "environment" {
  type = string
}

variable "private_zone" {
  type    = bool
  default = false
}

variable "domain_identity" {
  type    = string
  default = null
}

variable "email_identity" {
  type    = string
  default = null
}
