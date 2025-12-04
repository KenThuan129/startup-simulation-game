# Deployment Checklist

Use this checklist before deploying to Railway or any production environment.

## Pre-Deployment

### Code Preparation
- [ ] All code is committed to Git
- [ ] Code is pushed to GitHub repository
- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] `.env` file is NOT committed (check `.gitignore`)

### Database Setup
- [ ] Supabase project created
- [ ] Base schema applied (`src/db/schema.sql`)
- [ ] All migrations applied in order:
  - [ ] `001_add_company_fields.sql`
  - [ ] `002_create_loan_exam_sessions.sql`
  - [ ] `003_add_loan_offer_fields.sql`
  - [ ] `004_create_boss_battles.sql`
  - [ ] `005_create_anomalies_log.sql`
  - [ ] `006_add_company_boss_fields.sql`
  - [ ] `007_add_loan_sacrifice_fields.sql`
  - [ ] `008_add_level_field.sql`
  - [ ] `009_add_role_and_broadcast_fields.sql`
- [ ] Database tables verified in Supabase dashboard

### Discord Bot Setup
- [ ] Discord application created
- [ ] Bot created and token obtained
- [ ] Client ID copied from OAuth2 tab
- [ ] Bot invited to server (if using guild commands)
- [ ] Server ID copied (if using guild commands)
- [ ] "Message Content Intent" enabled
- [ ] Bot has `applications.commands` scope

### Environment Variables
- [ ] `DISCORD_TOKEN` - Bot token from Discord Developer Portal
- [ ] `DISCORD_CLIENT_ID` - Client ID from Discord Developer Portal
- [ ] `DISCORD_GUILD_ID` - Server ID (optional, omit for global commands)
- [ ] `SUPABASE_URL` - Project URL from Supabase dashboard
- [ ] `SUPABASE_KEY` - Anon/public key from Supabase dashboard
- [ ] `NODE_ENV` - Set to `production`

## Railway Deployment

### Initial Setup
- [ ] Railway account created
- [ ] GitHub account connected to Railway
- [ ] Repository selected in Railway
- [ ] All environment variables added in Railway dashboard
- [ ] `nixpacks.toml` file exists in repository

### Deployment
- [ ] Railway detects the project correctly
- [ ] Build completes successfully
- [ ] Bot starts without errors
- [ ] Logs show successful Discord login
- [ ] Logs show command registration success

### Verification
- [ ] Bot appears online in Discord
- [ ] Commands appear in Discord (wait 5-10 min for global commands)
- [ ] `/help` command works
- [ ] `/create-startup` command works
- [ ] Can create a test startup
- [ ] Database operations work correctly

## Post-Deployment

### Monitoring
- [ ] Railway logs are accessible
- [ ] No error messages in logs
- [ ] CPU/Memory usage is reasonable
- [ ] Bot stays online

### Testing
- [ ] Test all major commands:
  - [ ] `/create-startup`
  - [ ] `/start-day`
  - [ ] `/action`
  - [ ] `/choose`
  - [ ] `/end-day`
  - [ ] `/stats`
  - [ ] `/skill-tree`
  - [ ] `/level-stats`
- [ ] Test role selection flow
- [ ] Test skill tree upgrades
- [ ] Test loan system (if implemented)
- [ ] Test daily tick system

### Documentation
- [ ] README.md updated with deployment info
- [ ] RAILWAY.md created with deployment guide
- [ ] DEPLOY.md updated
- [ ] Environment variables documented

## Troubleshooting

If deployment fails:

1. **Check Railway Logs**
   - Go to Railway dashboard → Deployments → View Logs
   - Look for error messages
   - Check build logs

2. **Verify Environment Variables**
   - All required variables are set
   - No typos in variable names
   - Values are correct (especially tokens)

3. **Check Database**
   - Supabase project is active
   - Migrations ran successfully
   - Tables exist in database

4. **Verify Discord Setup**
   - Bot token is valid
   - Client ID is correct
   - Bot has proper permissions

5. **Check Build**
   - TypeScript compiles without errors
   - All dependencies installed
   - `npm run build` succeeds locally

## Rollback Plan

If issues occur after deployment:

1. **Stop Deployment**
   - Railway: Go to project → Settings → Delete deployment
   - Or revert to previous commit

2. **Fix Issues**
   - Fix code locally
   - Test locally
   - Commit fixes

3. **Redeploy**
   - Push fixes to GitHub
   - Railway auto-redeploys
   - Monitor logs

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] No secrets committed to Git
- [ ] Environment variables encrypted in Railway
- [ ] Discord token is secure
- [ ] Supabase key is anon/public key (not service role key)
- [ ] Database has proper access controls

## Performance Checklist

- [ ] Bot responds to commands quickly (< 3 seconds)
- [ ] Database queries are optimized
- [ ] No memory leaks
- [ ] CPU usage is reasonable
- [ ] Railway free tier is sufficient (or plan for upgrade)

## Support Resources

- Railway Documentation: https://docs.railway.app
- Discord.js Documentation: https://discord.js.org
- Supabase Documentation: https://supabase.com/docs
- Project README: README.md
- Railway Deployment Guide: RAILWAY.md

