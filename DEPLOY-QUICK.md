# 🚀 Quick Deploy to Fly.io

## ✅ Changes Made

1. **Removed Redis** - Now using PostgreSQL for sessions
2. **Added Fly.io configuration** - `fly.toml`, `Dockerfile`, `.dockerignore`
3. **Updated dependencies** - Removed `ioredis` and `connect-redis`, added `connect-pg-simple`

## 📋 Deploy Steps

### 1. Install Fly CLI
```bash
brew install flyctl   # macOS
# OR
curl -L https://fly.io/install.sh | sh   # Linux
```

### 2. Login
```bash
flyctl auth login
```

### 3. Create PostgreSQL Database
```bash
flyctl postgres create --name nest-auth-db --region waw
```
**Important:** Save the connection string that appears!

### 4. Launch App
```bash
flyctl launch --no-deploy
```
Choose:
- Name: `nest-auth-backend` (or your choice)
- Region: `Warsaw (waw)` - closest to Ukraine/Europe
- Database: **No** (we created it in step 3)

### 5. Set Secrets
```bash
# Database (use connection string from step 3)
flyctl secrets set DATABASE_URL="postgres://..."

# Required secrets
flyctl secrets set \
  SESSION_SECRET="$(openssl rand -base64 32)" \
  COOKIES_SECRET="$(openssl rand -base64 32)" \
  JWT_SECRET="$(openssl rand -base64 32)" \
  JWT_REFRESH_SECRET="$(openssl rand -base64 32)" \
  SESSION_DOMAIN="nest-auth-backend.fly.dev" \
  SESSION_SECURE="true" \
  ALLOWED_ORIGIN="https://your-frontend-url.com"
```

### 6. Deploy!
```bash
flyctl deploy
```

### 7. Run Migrations
```bash
flyctl ssh console
npx prisma migrate deploy
exit
```

### 8. Test
```bash
flyctl open /health
```

## 🎉 Done!

Your API is now live at: `https://nest-auth-backend.fly.dev`

Swagger docs: `https://nest-auth-backend.fly.dev/api/docs`

## 💰 Free Tier

Fly.io free tier includes:
- 3 shared VMs with 256MB RAM each
- 3GB storage
- Your app will **sleep** after 15min of inactivity (restarts in ~30s)

## 📊 Useful Commands

```bash
flyctl logs                  # View logs
flyctl status                # Check status
flyctl dashboard             # Open dashboard
flyctl ssh console           # SSH into app
flyctl scale count 1         # Number of instances
```

## 🔥 Problems?

Check full deployment guide: `/docs/DEPLOYMENT.md`

Or check logs:
```bash
flyctl logs --tail
```
