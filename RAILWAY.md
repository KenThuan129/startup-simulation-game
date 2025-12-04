# Railway Deployment Guide

This guide covers deploying the Startup Simulation Discord Bot to Railway.

## Prerequisites

- GitHub account
- Railway account ([Sign up here](https://railway.app))
- Discord Bot Token
- Supabase Account

## Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure your code is pushed to GitHub:
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your repository
6. Railway will automatically detect the project

### 3. Configure Environment Variables

In Railway dashboard, go to your project → **Variables** tab and add:

```env
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_GUILD_ID=your_guild_id_here
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_KEY=your_supabase_anon_key_here
NODE_ENV=production
```

**Important Notes:**
- `DISCORD_GUILD_ID` is optional. If omitted, commands will be registered globally (takes up to 1 hour to sync)
- Never commit these values to your repository
- Railway automatically encrypts these variables

### 4. Database Setup

Before deployment, set up your Supabase database:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or use existing one
3. Go to **SQL Editor**
4. Run migrations in order:
   - `src/db/schema.sql` (base schema)
   - `scripts/migrations/001_add_company_fields.sql`
   - `scripts/migrations/002_create_loan_exam_sessions.sql`
   - `scripts/migrations/003_add_loan_offer_fields.sql`
   - `scripts/migrations/004_create_boss_battles.sql`
   - `scripts/migrations/005_create_anomalies_log.sql`
   - `scripts/migrations/006_add_company_boss_fields.sql`
   - `scripts/migrations/007_add_loan_sacrifice_fields.sql`
   - `scripts/migrations/008_add_level_field.sql`
   - `scripts/migrations/009_add_role_and_broadcast_fields.sql`

### 5. Railway Build Configuration

Railway will automatically detect the `nixpacks.toml` file and use it for building. The configuration:
- Uses Node.js 18
- Installs dependencies with `npm ci`
- Builds the project with `npm run build`
- Starts with `npm start`

### 6. Deploy

Railway will automatically:
1. Detect your repository
2. Install dependencies
3. Build the project
4. Start the bot

Monitor the deployment in the **Deployments** tab. You'll see build logs and runtime logs.

### 7. Verify Deployment

1. Check Railway logs for successful bot login:
   ```
   ✅ Bot logged in as YourBotName#1234
   ✅ Registered 18 application commands
   ```

2. In Discord, test the bot:
   - Use `/help` command
   - Create a test startup with `/create-startup`

3. Check Railway metrics:
   - CPU usage
   - Memory usage
   - Network traffic

## Updating the Bot

Railway automatically redeploys when you push to your main branch:

1. Make your changes
2. Commit and push:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
3. Railway will automatically rebuild and redeploy
4. Monitor the deployment in Railway dashboard

## Railway-Specific Features

### Health Checks

Railway automatically monitors your service. The bot stays alive as long as:
- The process is running
- Discord connection is maintained
- No fatal errors occur

### Logs

View real-time logs in Railway dashboard:
- **Deployments** → Select deployment → **View Logs**
- Filter by level (info, error, warn)

### Metrics

Monitor your bot's performance:
- **Metrics** tab shows CPU, Memory, Network
- Set up alerts for high resource usage

### Custom Domain (Optional)

Railway provides a default domain. For custom domain:
1. Go to **Settings** → **Networking**
2. Add custom domain
3. Configure DNS records

## Troubleshooting

### Bot Not Starting

1. Check Railway logs for errors
2. Verify all environment variables are set correctly
3. Ensure Supabase database is accessible
4. Check Discord token is valid

### Commands Not Appearing

1. Wait 5-10 minutes for Discord to sync (if global commands)
2. Verify `DISCORD_CLIENT_ID` is correct
3. Check bot has `applications.commands` scope
4. Review Railway logs for registration errors

### Database Connection Issues

1. Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
2. Check Supabase project is active
3. Ensure migrations ran successfully
4. Test connection from Railway logs

### Build Failures

1. Check build logs in Railway
2. Verify `nixpacks.toml` is correct
3. Ensure all dependencies are in `package.json`
4. Check TypeScript compilation errors

## Cost Optimization

Railway offers a free tier with:
- $5 credit per month
- 500 hours of usage
- Sufficient for small to medium Discord bots

For production:
- Monitor usage in Railway dashboard
- Set up usage alerts
- Consider upgrading if needed

## Security Best Practices

1. **Never commit secrets**: Use Railway environment variables
2. **Rotate tokens regularly**: Update Discord and Supabase keys periodically
3. **Monitor logs**: Check for suspicious activity
4. **Use Railway's built-in security**: Variables are encrypted at rest

## Support

For Railway-specific issues:
- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)

For bot-specific issues:
- Check `README.md` and `DEPLOY.md`
- Review error logs in Railway dashboard

