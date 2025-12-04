# Deployment Guide

This guide covers deploying the Startup Simulation Discord Bot to various platforms.

## Quick Links

- **[Railway Deployment](RAILWAY.md)** - Step-by-step Railway deployment guide (Recommended for MVP)
- **[General Deployment](#general-deployment)** - Manual deployment instructions

## Railway Deployment (Recommended)

Railway is the easiest way to deploy this bot. See **[RAILWAY.md](RAILWAY.md)** for complete instructions.

**Quick Start:**
1. Push code to GitHub
2. Connect Railway to your GitHub repo
3. Add environment variables
4. Deploy!

Railway automatically handles:
- Building the application
- Running migrations
- Keeping the bot online
- Auto-deploying on git push

## General Deployment

This guide covers deploying the Startup Simulation Discord Bot.

## Prerequisites

- Node.js 18+
- Discord Bot Token
- Supabase Account
- Discord Application (with bot)

## Setup Steps

### 1. Environment Configuration

Create a `.env` file:

```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_GUILD_ID=your_guild_id
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
NODE_ENV=production
```

### 2. Database Setup

#### Initial Schema
Run the base schema from `src/db/schema.sql` in your Supabase SQL Editor.

#### Migrations
Run migrations in order:

1. **001_add_company_fields.sql**
   ```sql
   -- Adds in_break_until, loan_lifeline_used, mode columns
   ```

2. **002_create_loan_exam_sessions.sql**
   ```sql
   -- Creates loan_exam_sessions table
   ```

3. **003_add_loan_offer_fields.sql**
   ```sql
   -- Adds loan offer metadata fields
   ```

**Using Supabase CLI:**
```bash
supabase link --project-ref your-project-ref
supabase db push
```

**Using Supabase Dashboard:**
1. Go to SQL Editor
2. Copy/paste each migration file
3. Run in order (001, 002, 003)

**Using psql:**
```bash
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
\i scripts/migrations/001_add_company_fields.sql
\i scripts/migrations/002_create_loan_exam_sessions.sql
\i scripts/migrations/003_add_loan_offer_fields.sql
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Build Project

```bash
npm run build
```

### 5. Register Commands

The bot automatically registers commands on startup. Ensure:
- Bot has `applications.commands` scope
- Bot is in your guild
- `DISCORD_GUILD_ID` is set correctly

### 6. Start Bot

**Production:**
```bash
npm start
```

**Development:**
```bash
npm run dev
```

## Verification

1. Check bot logs for successful login
2. Verify commands appear in Discord (may take a few minutes)
3. Test `/help` command
4. Create a test company with `/create-startup`

## Production Considerations

### Process Management
Use PM2 or similar:
```bash
npm install -g pm2
pm2 start dist/index.js --name startup-bot
pm2 save
pm2 startup
```

### Environment Variables
- Never commit `.env` file
- Use secure secret management in production
- Rotate tokens regularly

### Database
- Use connection pooling for Supabase
- Monitor query performance
- Set up backups

### Monitoring
- Log errors to external service
- Monitor bot uptime
- Track command usage

## Troubleshooting

### Commands Not Appearing
- Check `DISCORD_GUILD_ID` is correct
- Verify bot has `applications.commands` scope
- Wait 5-10 minutes for Discord to sync
- Check bot logs for registration errors

### Database Errors
- Verify Supabase credentials
- Check migrations ran successfully
- Ensure tables exist: `users`, `companies`, `loans`, `loan_exam_sessions`

### Build Errors
- Ensure TypeScript version matches
- Run `npm install` to update dependencies
- Check `tsconfig.json` settings

## Rollback

If issues occur:

1. **Stop bot:** `pm2 stop startup-bot` or `Ctrl+C`
2. **Check logs:** Review error messages
3. **Revert code:** `git checkout [previous-commit]`
4. **Rebuild:** `npm run build`
5. **Restart:** `npm start`

## Updates

To update:

1. Pull latest code
2. Run new migrations (if any)
3. `npm install` (if dependencies changed)
4. `npm run build`
5. Restart bot

## Support

For issues:
1. Check logs
2. Review `BALANCE.md` and `NEW_FEATURES.md`
3. Test with simulation tool: `npm run simulate`
4. Check database migrations completed

