# Render.com Environment Variables

## ⚠️ CRITICAL: Missing JWT Configuration

Add these environment variables to your Render.com service:

### JWT Configuration (REQUIRED)
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-characters-long
JWT_EXPIRES_IN=7d
```

**How to add on Render.com:**
1. Go to https://dashboard.render.com
2. Select your service `crm-beck`
3. Click on "Environment" tab
4. Click "Add Environment Variable"
5. Add:
   - Key: `JWT_SECRET`
   - Value: Generate a strong random string (minimum 32 characters)
   - **Important:** Use a different value than the one in `.env` for production!
   
6. Add:
   - Key: `JWT_EXPIRES_IN`
   - Value: `7d` (or your preferred token expiration time)

### Generate a secure JWT_SECRET

**Option 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Option 2: Using OpenSSL**
```bash
openssl rand -hex 64
```

**Option 3: Using online generator**
- Visit: https://randomkeygen.com/
- Use "CodeIgniter Encryption Keys" (256-bit)

## All Required Environment Variables for Render

Make sure you have ALL these variables set on Render:

### Application
- `NODE_ENV=production`
- `APPLICATION_PORT=10000` (Render default)
- `APPLICATION_URL=https://crm-beck.onrender.com`
- `ALLOWED_ORIGIN=https://crm-lyart-mu.vercel.app` (your frontend URL)

### Session
- `SESSION_SECRET=<generate-random-string>`
- `SESSION_NAME=nest.sid`
- `SESSION_DOMAIN=crm-beck.onrender.com`
- `SESSION_MAX_AGE=7d`
- `SESSION_HTTP_ONLY=true`
- `SESSION_SECURE=true` (MUST be true for HTTPS)

### Database
- `DATABASE_URL=<your-render-postgresql-connection-string>`

### Google OAuth
- `GOOGLE_CLIENT_ID=<your-google-client-id>`
- `GOOGLE_CLIENT_SECRET=<your-google-client-secret>`
- `GOOGLE_CALLBACK_URL=https://crm-beck.onrender.com/auth/oauth/callback/google`

### JWT (NEW - REQUIRED)
- `JWT_SECRET=<generate-random-string-min-32-chars>`
- `JWT_EXPIRES_IN=7d`

### Email (Optional for now)
- `MAIL_HOST=smtp.resend.com`
- `MAIL_PORT=587`
- `MAIL_LOGIN=resend`
- `MAIL_PASSWORD=<your-resend-api-key>`
- `MAIL_FROM=noreply@yourdomain.com`

## Next Steps

1. **Add JWT_SECRET and JWT_EXPIRES_IN to Render** (required immediately)
2. Click "Manual Deploy" → "Clear build cache & deploy"
3. Wait for deployment to complete
4. Check logs to verify no errors
5. Test authentication endpoints

## Testing after deployment

```bash
# Test login
curl -X POST https://crm-beck.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Should return:
# {
#   "accessToken": "eyJhbGc...",
#   "tokenType": "Bearer",
#   "user": { ... }
# }
```
