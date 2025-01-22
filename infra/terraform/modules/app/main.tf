resource "aws_iam_user" "amplify" {
  name = "amplify-${var.environment}"
}

resource "aws_iam_access_key" "amplify" {
  user = aws_iam_user.amplify.name
}

resource "aws_secretsmanager_secret" "amplify" {
  name_prefix = "iam-user/${aws_iam_user.amplify.name}-"
}

resource "aws_secretsmanager_secret_version" "amplify" {
  secret_id = aws_secretsmanager_secret.amplify.id
  secret_string = jsonencode({
    AccessKey       = aws_iam_access_key.amplify.id,
    SecretAccessKey = aws_iam_access_key.amplify.secret
  })
}

resource "aws_iam_user_policy_attachment" "amplify" {
  user       = aws_iam_user.amplify.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess-Amplify"
}

resource "aws_ses_configuration_set" "this" {
  name = "default"
}

resource "aws_ses_email_identity" "this" {
  count = var.email_identity != null ? 1 : 0

  email = var.email_identity
}

locals {
  zone_id             = var.domain_identity != null ? data.aws_route53_zone.selected[0].zone_id : null
  has_domain_identity = var.domain_identity != null ? 1 : 0
}

data "aws_route53_zone" "selected" {
  count = local.has_domain_identity

  name         = var.domain_identity
  private_zone = var.private_zone
}

resource "aws_ses_domain_identity" "this" {
  count = local.has_domain_identity

  domain = var.domain_identity
}

resource "aws_route53_record" "verify" {
  count = local.has_domain_identity

  zone_id = local.zone_id
  name    = "_amazonses.${aws_ses_domain_identity.this[0].domain}"
  type    = "TXT"
  ttl     = "600"
  records = [aws_ses_domain_identity.this[0].verification_token]
}

resource "aws_ses_domain_dkim" "this" {
  count = local.has_domain_identity

  domain = var.domain_identity
}

resource "aws_route53_record" "dkim" {
  count = local.has_domain_identity == 1 ? 3 : 0

  zone_id = local.zone_id
  name    = "${aws_ses_domain_dkim.this[0].dkim_tokens[count.index]}._domainkey"
  type    = "CNAME"
  ttl     = "600"
  records = ["${aws_ses_domain_dkim.this[0].dkim_tokens[count.index]}.dkim.amazonses.com"]
}

resource "aws_route53_record" "dmarc" {
  count = local.has_domain_identity

  zone_id = local.zone_id
  name    = "_dmarc.${aws_ses_domain_identity.this[0].domain}"
  type    = "TXT"
  ttl     = "60"
  records = ["v=DMARC1; p=none;"]
}

resource "aws_ses_domain_mail_from" "this" {
  count = local.has_domain_identity

  domain           = aws_ses_domain_identity.this[0].domain
  mail_from_domain = "bounce.${aws_ses_domain_identity.this[0].domain}"
}

resource "aws_route53_record" "mx" {
  count = local.has_domain_identity

  zone_id = local.zone_id
  name    = aws_ses_domain_mail_from.this[0].mail_from_domain
  type    = "MX"
  ttl     = "600"
  records = ["10 feedback-smtp.ap-northeast-1.amazonses.com"]
}

resource "aws_route53_record" "spf" {
  count = local.has_domain_identity

  zone_id = local.zone_id
  name    = aws_ses_domain_identity.this[0].domain
  type    = "TXT"
  ttl     = "600"
  records = ["v=spf1 include:amazonses.com ~all"]
}

resource "aws_route53_record" "spf_mail_from" {
  count = local.has_domain_identity

  zone_id = local.zone_id
  name    = aws_ses_domain_mail_from.this[0].mail_from_domain
  type    = "TXT"
  ttl     = "600"
  records = ["v=spf1 include:amazonses.com ~all"]
}
