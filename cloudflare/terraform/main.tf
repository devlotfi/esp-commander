terraform {
  required_providers {
    cloudflare = {
      source = "cloudflare/cloudflare"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# -----------------------------
# D1 Database
# -----------------------------

resource "cloudflare_d1_database" "db" {
  account_id = var.account_id
  name       = "iot-commander-d1"

  read_replication = {
    mode = "disabled"
  }
}

# -----------------------------
# Worker
# -----------------------------

resource "cloudflare_worker" "worker" {
  account_id = var.account_id
  name       = "iot-commander-worker"

  observability = {
    enabled = true
    head_sampling_rate = 1
  }

  subdomain = {
    enabled = true
    previews_enabled = true
  }
}

# -----------------------------
# Worker version (upload code)
# -----------------------------

resource "cloudflare_worker_version" "version" {
  account_id         = var.account_id
  worker_id          = cloudflare_worker.worker.id
  compatibility_date = "2026-03-11"
  compatibility_flags = [ "nodejs_compat" ]

  main_module = "index.mjs"

  modules = [
    {
      name         = "index.mjs"
      content_type = "application/javascript+module"
      content_file = "../build/index.js"
    }
  ]

  bindings = [
    {
      name = "API_SECRET"
      type = "secret_text"
      text = var.api_secret
    },
    {
      name = "VAPID_PUBLIC_KEY"
      type = "secret_text"
      text = var.vapid_public_key
    },
    {
      name = "VAPID_PRIVATE_KEY"
      type = "secret_text"
      text = var.vapid_private_key
    },
    {
      name = "D1_DB"
      type = "d1"
      id = cloudflare_d1_database.db.id
    }
  ]
}

# -----------------------------
# Deployment
# -----------------------------

resource "cloudflare_workers_deployment" "deployment" {
  account_id  = var.account_id
  script_name = cloudflare_worker.worker.name
  strategy    = "percentage"

  versions = [
    {
      version_id = cloudflare_worker_version.version.id
      percentage = 100
    }
  ]
}
