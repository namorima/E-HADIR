# Migration Guide: Google Sheets → Neon DB

## Overview

Panduan ini untuk migrate sistem E-HADIR dari Google Sheets ke Neon PostgreSQL database.

## Pre-Migration Checklist

- [ ] Backup Google Sheets data (File → Download → CSV)
- [ ] Create Neon database account
- [ ] Get DATABASE_URL connection string
- [ ] Update `.env.local` dengan DATABASE_URL
- [ ] Test local development environment

## Migration Steps

### Step 1: Setup Neon Database

1. **Create Account**
   - Visit [console.neon.tech](https://console.neon.tech)
   - Sign up atau login
   - Create new project

2. **Get Connection String**
   - Go to project dashboard
   - Click "Connection Details"
   - Copy "Connection string"
   - Format: `postgresql://user:pass@host/db?sslmode=require`

3. **Update Environment**
   ```bash
   # Edit .env.local
   DATABASE_URL=postgresql://neondb_owner:xxx@ep-xxx.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2: Initialize Database Tables

1. **Start Development Server**

   ```bash
   npm run dev
   ```

2. **Create Tables**

   ```bash
   curl http://localhost:3000/api/db/init
   ```

   Expected response:

   ```json
   {
     "success": true,
     "message": "Database initialized successfully! All tables created.",
     "tables": ["admin_settings", "staff", "invitations", "attendance"]
   }
   ```

3. **Verify Tables Created**
   - Login to Neon Console
   - Go to "Tables" tab
   - Should see 4 tables created

### Step 3: Migrate Data

1. **Run Migration Script**

   ```bash
   curl -X POST http://localhost:3000/api/db/migrate
   ```

   Expected response:

   ```json
   {
     "success": true,
     "message": "Migration completed!",
     "summary": {
       "staff": 150,
       "invitations": 75,
       "attendance": 450,
       "errors": null
     }
   }
   ```

2. **Check for Errors**
   - If `errors` is not null, review error messages
   - Common issues:
     - Invalid date formats
     - Missing required fields
     - Duplicate staff IDs

3. **Verify Data**
   ```bash
   # Get all staff
   curl http://localhost:3000/api/get-staff
   ```

### Step 4: Test Application

1. **Test Staff Lookup**
   - Open browser: `http://localhost:3000`
   - Enter existing staff ID
   - Should show staff info

2. **Test Attendance Recording**
   - Enter staff ID
   - Click "Rekod Kehadiran"
   - Should show success message

3. **Test Duplicate Prevention**
   - Enter same staff ID again
   - Should show "sudah direkod" message

4. **Test New Staff Registration**
   - Enter new ID (not in database)
   - Fill registration form
   - Submit and verify success

### Step 5: Deploy to Production

#### For Netlify:

1. **Set Environment Variables**
   - Go to Netlify dashboard
   - Site settings → Environment variables
   - Add `DATABASE_URL`
   - Add other required variables

2. **Deploy**

   ```bash
   git push origin main
   ```

3. **Initialize Production Database**

   ```bash
   curl https://your-site.netlify.app/api/db/init
   ```

4. **Migrate Production Data**
   ```bash
   curl -X POST https://your-site.netlify.app/api/db/migrate
   ```

#### For Vercel:

1. **Set Environment Variables**
   - Go to Vercel dashboard
   - Project settings → Environment Variables
   - Add `DATABASE_URL`
   - Add other required variables

2. **Deploy**

   ```bash
   vercel --prod
   ```

3. **Initialize and Migrate**
   - Same as Netlify steps above

### Step 6: Verify Production

1. **Test All Endpoints**

   ```bash
   # Meeting info
   curl https://your-site.com/api/meeting-info

   # Staff check
   curl -X POST https://your-site.com/api/check-staff \
     -H "Content-Type: application/json" \
     -d '{"idStaf": "TEST001"}'
   ```

2. **Test UI**
   - Visit production URL
   - Test complete check-in flow
   - Verify admin functions

3. **Monitor Logs**
   - Check Netlify/Vercel logs for errors
   - Check Neon database logs

## Post-Migration

### Cleanup (Optional)

1. **Remove Google Sheets Dependencies**
   - Can remove `GOOGLE_*` environment variables (if not needed for backup)
   - Keep Google Sheets as backup for 1-2 weeks

2. **Update Documentation**
   - Update README.md
   - Update team documentation
   - Inform users of changes

### Monitoring

1. **Database Usage**
   - Monitor Neon dashboard
   - Check storage usage
   - Review query performance

2. **Application Performance**
   - Compare response times
   - Monitor error rates
   - Check user feedback

## Rollback Plan

If migration fails:

1. **Revert Code**

   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Switch Back to Google Sheets**
   - Restore old API endpoints
   - Re-enable Google Sheets authentication
   - Redeploy

3. **Investigate Issues**
   - Review error logs
   - Check data integrity
   - Test locally before retry

## Troubleshooting

### Migration Script Fails

**Problem**: Migration returns errors

**Solutions**:

- Check Google Sheets credentials still valid
- Verify data format in sheets
- Run migration multiple times (skips duplicates)
- Check specific error messages in response

### Data Missing After Migration

**Problem**: Some records not migrated

**Solutions**:

- Check migration summary for counts
- Compare with Google Sheets row counts
- Review error messages
- Manually add missing records via API

### Performance Issues

**Problem**: Slow response times

**Solutions**:

- Check Neon database status (may be sleeping)
- Verify indexes created properly
- Review query patterns
- Consider upgrading Neon plan

### Connection Errors

**Problem**: "Failed to connect to database"

**Solutions**:

- Verify DATABASE_URL format
- Check Neon database is active
- Test connection from Neon console
- Verify SSL mode is set correctly

## Support

For issues during migration:

1. Check [DATABASE-SETUP.md](./DATABASE-SETUP.md) for detailed setup
2. Review [CLAUDE.md](./CLAUDE.md) for architecture details
3. Check Neon documentation: [neon.tech/docs](https://neon.tech/docs)
4. Contact admin or create GitHub issue

## Success Criteria

Migration is successful when:

- ✅ All tables created in Neon DB
- ✅ All data migrated (staff, invitations, attendance)
- ✅ Application works in production
- ✅ No errors in logs
- ✅ Users can check in successfully
- ✅ Admin functions work properly
- ✅ Performance is acceptable (< 1s response times)
