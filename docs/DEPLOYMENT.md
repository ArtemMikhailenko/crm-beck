# Deployment Guide - Fly.io

## Prerequisites

1. Install flyctl:
```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

2. Login to Fly.io:
```bash
flyctl auth login
```

## Step 1: Create PostgreSQL Database

```bash
# Create a Postgres cluster
flyctl postgres create --name nest-auth-db --region waw

# Note the connection string that appears
# It will look like: postgres://...
```

## Step 2: Launch the Application

```bash
# Launch the app (this will create fly.toml if needed)
flyctl launch --no-deploy

# Choose:
# - App name: nest-auth-backend (or your preferred name)
# - Region: Warsaw (waw) - closest to Ukraine
# - Add a database: No (we already created one)
```

## Step 3: Set Environment Variables

```bash
# Set DATABASE_URL (use connection string from Step 1)
flyctl secrets set DATABASE_URL="postgres://..."

# Set other required secrets
flyctl secrets set \
  SESSION_SECRET="$(openssl rand -base64 32)" \
  COOKIES_SECRET="$(openssl rand -base64 32)" \
  JWT_SECRET="$(openssl rand -base64 32)" \
  JWT_REFRESH_SECRET="$(openssl rand -base64 32)" \
  SESSION_NAME="nest.sid" \
  SESSION_DOMAIN="your-app.fly.dev" \
  SESSION_MAX_AGE="7d" \
  SESSION_HTTP_ONLY="true" \
  SESSION_SECURE="true" \
  ALLOWED_ORIGIN="https://your-frontend.vercel.app"

# Email configuration (if using)
flyctl secrets set \
  MAIL_HOST="smtp.gmail.com" \
  MAIL_PORT="587" \
  MAIL_USER="your-email@gmail.com" \
  MAIL_PASSWORD="your-app-password" \
  MAIL_FROM="noreply@yourdomain.com"

# Google OAuth (if using)
flyctl secrets set \
  GOOGLE_CLIENT_ID="your-google-client-id" \
  GOOGLE_CLIENT_SECRET="your-google-client-secret" \
  GOOGLE_CALLBACK_URL="https://your-app.fly.dev/auth/oauth/callback/google"
```

## Step 4: Deploy

```bash
# Deploy the application
flyctl deploy

# Wait for deployment to complete
# The app will be available at https://nest-auth-backend.fly.dev
```

## Step 5: Run Database Migrations

```bash
# Connect to your app
flyctl ssh console

# Run migrations
node_modules/.bin/prisma migrate deploy

# Exit
exit
```

## Useful Commands

```bash
# View logs
flyctl logs

# Check status
flyctl status

# Open app in browser
flyctl open

# Connect to database
flyctl postgres connect -a nest-auth-db

# Scale app
flyctl scale count 1 # Number of instances
flyctl scale vm shared-cpu-1x # VM size
flyctl scale memory 512 # Memory in MB

# Restart app
flyctl apps restart

# View secrets
flyctl secrets list

# Remove secret
flyctl secrets unset SECRET_NAME
```

## Monitoring

```bash
# View metrics
flyctl dashboard

# View health checks
flyctl checks list
```

## Troubleshooting

### App won't start
```bash
# Check logs
flyctl logs

# Common issues:
# 1. Missing environment variables
# 2. Database connection issues
# 3. Port configuration (should be 8080)
```

### Database connection issues
```bash
# Verify DATABASE_URL
flyctl secrets list

# Test connection
flyctl ssh console
node -e "const { PrismaClient } = require('@prisma/client'); new PrismaClient().\$connect().then(() => console.log('OK'))"
```

### Health check failing
```bash
# Verify /health endpoint works
curl https://your-app.fly.dev/health

# Check internal port matches fly.toml
flyctl config show
```

## Cost Optimization

Free tier includes:
- 3 shared-cpu VMs (256MB RAM each)
- 3GB persistent volume storage
- 160GB outbound data transfer

To stay within free tier:
- Use `shared-cpu-1x` with 256MB RAM
- Set `min_machines_running = 0` (app sleeps when idle)
- Use single instance

## Updating

```bash
# Pull latest changes
git pull

# Deploy updates
flyctl deploy

# Zero-downtime deployment is automatic
```

## Rollback

```bash
# List releases
flyctl releases

# Rollback to previous
flyctl releases rollback
```

## Environment-Specific Configuration

### Production .env
Create a production environment file with:
- Strong secrets
- HTTPS enabled
- Production database
- Production frontend URL

### Staging
```bash
# Create staging app
flyctl launch --name nest-auth-backend-staging

# Use separate database
flyctl postgres create --name nest-auth-db-staging
```
