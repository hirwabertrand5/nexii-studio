# NEXii Studio - Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Create `.env.production` file based on `.env.production` template
- [ ] Generate strong `JWT_SECRET` (minimum 32 characters):
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Set unique `ADMIN_EMAIL` for your organization
- [ ] Configure all file upload credentials (Cloudinary/S3)
- [ ] Set payment gateway secrets (Paystack/Flutterwave)
- [ ] Never commit `.env.production` to Git

### 2. Database Security
- [ ] MongoDB Atlas cluster configured for production
- [ ] Strong database password (20+ characters, mixed case, numbers, symbols)
- [ ] IP whitelist configured (only allow production server IP)
- [ ] Automatic backups enabled (daily)
- [ ] Read-only replica user created for backups

### 3. SSL/TLS Certificate
- [ ] HTTPS enabled on your domain
- [ ] SSL certificate installed (Let's Encrypt recommended)
- [ ] Certificate auto-renewal configured

### 4. Admin Account Setup
Run the admin setup script:
```bash
npm run setup:admin
```
This will:
- Generate a secure temporary password
- Create the admin account in the database
- Display credentials (save securely in password manager)

**Next Steps After Setup:**
1. Admin logs in at `https://your-domain.com/login`
2. Changes temporary password to personal strong password
3. Enables 2FA (Google Authenticator or Authy)
4. Tests all admin features

### 5. Security Headers
The following are automatically set via Helmet:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security
- Content-Security-Policy

### 6. Rate Limiting
- Login attempts: 5 per 15 minutes
- General API: 100 per minute
- Strict operations: 10 per hour

## Deployment Steps

### Option A: Railway (Recommended for Startups)
1. Push code to GitHub
2. Connect Railway to your GitHub repo
3. Set environment variables in Railway dashboard
4. Configure MongoDB connection string
5. Deploy automatically

### Option B: Render
1. Create account at render.com
2. New Web Service → Connect GitHub
3. Set environment variables
4. Configure build command: `pnpm run build`
5. Configure start command: `node dist/server.js`
6. Deploy

### Option C: Vercel (Serverless)
1. Deploy to Vercel with serverless functions
2. Set environment variables in Vercel dashboard
3. Configure custom domain with HTTPS
4. Database connection via serverless connector

### Option D: AWS (Enterprise)
1. Use Elastic Beanstalk or ECS
2. Configure RDS for database
3. Set up CloudFront CDN
4. Use AWS Secrets Manager for credentials
5. Configure VPC and security groups

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-domain.com/health
# Expected: {"success":true,"data":{"ok":true}}
```

### 2. Database Connection
- Check server logs for: `[db] connected: ...`
- Test create user endpoint via API

### 3. Admin Login
- Navigate to `https://your-domain.com/login`
- Login with admin credentials
- Verify admin dashboard loads correctly

### 4. CORS Configuration
- Test API calls from frontend domain
- Should succeed with credentials: true
- Other origins should be rejected

### 5. Rate Limiting
- Test multiple rapid login attempts
- Should be rate-limited after 5 attempts in 15 minutes

### 6. File Upload
- Test image upload to Cloudinary
- Test document upload to S3
- Verify files are accessible

## Production Monitoring

### Recommended Tools
- **Error Tracking**: Sentry, DataDog, or New Relic
- **Uptime Monitoring**: UptimeRobot or Pingdom
- **Log Aggregation**: ELK Stack, Datadog, or Splunk
- **Performance**: New Relic, Datadog, or AppDynamics

### Key Metrics to Monitor
- Server response time (target: < 200ms)
- Error rate (target: < 0.1%)
- Database query performance
- API rate limit violations
- Failed login attempts
- File upload success rate

## Security Maintenance

### Weekly
- [ ] Review failed login attempts
- [ ] Check error logs for anomalies

### Monthly
- [ ] Review user activity logs
- [ ] Audit admin account actions
- [ ] Check database backups

### Quarterly
- [ ] Security audit of code
- [ ] Update dependencies
- [ ] Review and rotate credentials if needed

### Annually
- [ ] Full security assessment
- [ ] Penetration testing
- [ ] Review and update security policies

## Troubleshooting

### Database Connection Issues
```bash
# Test MongoDB connection
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✓ Connected'))
  .catch(e => console.log('✗ Error:', e.message))
"
```

### CORS Errors
- Check `CORS_ORIGIN` matches frontend URL
- Verify frontend URL includes protocol (https://)
- Check trailing slashes

### Rate Limiting Too Strict
- Adjust limits in `src/middleware/rateLimitMiddleware.ts`
- Restart server after changes
- Test from multiple IPs if needed

### Admin Can't Login
- Verify admin account exists: `db.users.findOne({role:"admin"})`
- Check password is correctly hashed
- Verify JWT_SECRET hasn't changed
- Clear browser cookies and try again

## Support & Escalation

For production issues:
1. Check server logs: `docker logs nexii-server` (if using Docker)
2. Check database logs in MongoDB Atlas
3. Monitor API response times and error rates
4. Review rate limiting status
5. Contact support: support@your-company.com

## Rollback Procedure

If deployment has critical issues:

1. Identify the problematic version
2. Revert to last stable version in hosting platform
3. Notify admin users of the issue
4. Wait for stability before re-deploying

## Client Handover

Provide client with:
- [ ] Admin credentials (via secure channel)
- [ ] Production URL
- [ ] Admin dashboard walkthrough
- [ ] Contact information for support
- [ ] Monthly security checklist
- [ ] Emergency contact procedures
