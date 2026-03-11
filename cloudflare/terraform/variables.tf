variable "cloudflare_api_token" {
  type = string
  sensitive = true
}

variable "account_id" {
  type = string
}

variable "api_secret" {
  type = string
  sensitive = true
}

variable "vapid_public_key" {
  type = string
}

variable "vapid_private_key" {
  type = string
  sensitive = true
}