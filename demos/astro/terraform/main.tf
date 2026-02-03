terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

provider "cloudflare" {
  # Set CLOUDFLARE_API_TOKEN env var
}

variable "account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "zone_id" {
  description = "Cloudflare zone ID for levinkeller.de"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository (owner/repo)"
  type        = string
  default     = "levino/pocketbase-auth"
}

variable "production_branch" {
  description = "Git branch to deploy from"
  type        = string
  default     = "main"
}

variable "pocketbase_url" {
  description = "PocketBase instance URL"
  type        = string
  default     = "https://api.levinkeller.de"
}

resource "cloudflare_pages_project" "auth_demo" {
  account_id = var.account_id
  name       = "astro-auth-demo"

  production_branch = var.production_branch

  source = {
    type = "github"
    config = {
      owner                         = split("/", var.github_repo)[0]
      repo_name                     = split("/", var.github_repo)[1]
      production_branch             = var.production_branch
      deployments_enabled           = true
      production_deployment_enabled = true
    }
  }

  build_config = {
    build_command   = "npm install && npm run build"
    destination_dir = "dist"
    root_dir        = "demos/astro"
  }

  deployment_configs = {
    production = {
      environment_variables = {
        POCKETBASE_URL   = var.pocketbase_url
        NODE_VERSION     = "22"
      }
    }
    preview = {
      environment_variables = {
        POCKETBASE_URL   = var.pocketbase_url
        NODE_VERSION     = "22"
      }
    }
  }
}

resource "cloudflare_pages_domain" "auth_demo" {
  account_id   = var.account_id
  project_name = cloudflare_pages_project.auth_demo.name
  domain       = "astro-auth-demo.levinkeller.de"
}

resource "cloudflare_dns_record" "auth_demo" {
  zone_id = var.zone_id
  name    = "astro-auth-demo"
  type    = "CNAME"
  content = "${cloudflare_pages_project.auth_demo.name}.pages.dev"
  proxied = true
}

output "pages_url" {
  value = "https://${cloudflare_pages_project.auth_demo.name}.pages.dev"
}

output "custom_domain" {
  value = "https://astro-auth-demo.levinkeller.de"
}
