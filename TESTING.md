# Local Testing Guide

## Quick Start

### 1. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_GUILD_ID=your_discord_guild_id_here  # Optional - omit for global commands
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
NODE_ENV=development
```

**Note:** `DISCORD_GUILD_ID` is optional. If omitted, the bot will use global commands (may take up to 1 hour to appear but works in all servers).

**Getting Discord Credentials:**
1. Go to https://discord.com/developers/applications
2. Create/select your application
3. Go to "Bot" → Copy token
4. Go to "OAuth2" → Copy Client ID
5. Enable "applications.commands" scope
6. Get Guild ID: Right-click your server → "Copy Server ID"

**Getting Supabase Credentials:**
1. Go to https://supabase.com
2. Create/select your project
3. Go to Settings → API
4. Copy "Project URL" and "anon public" key

### 2. Set Up Database

#### Option A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project → SQL Editor
2. Run `src/db/schema.sql` first (creates base tables)
3. Run migrations in order:
   - `scripts/migrations/001_add_company_fields.sql`
   - `scripts/migrations/002_create_loan_exam_sessions.sql`
   - `scripts/migrations/003_add_loan_offer_fields.sql`

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 3. Build the Project

```bash
npm run build
```

### 4. Start the Bot

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### 5. Verify It's Working

1. Check console for: `Logged in as YourBot#1234!`
2. Check console for: `Successfully reloaded X application (/) commands`
3. In Discord, type `/help` - you should see the help command
4. Try `/create-startup` to create a test company

## Testing Commands

### Basic Gameplay Flow

1. **Create Startup:**
   ```
   /create-startup name:TestCo type:saas goal1:Grow users difficulty:easy
   ```

2. **Start Day:**
   ```
   /start-day
   ```

3. **Take Action:**
   ```
   /action actionid:product_action_1
   ```

4. **Choose Outcome:**
   ```
   /choose choiceid:product_event_1_s
   ```

5. **End Day:**
   ```
   /end-day
   ```

### Loan Exam Flow

1. **Start Exam:**
   ```
   /loan-start
   ```

2. **Answer Questions:**
   ```
   /loan-answer question:q1 answer:4
   /loan-answer question:q2 answer:3
   /loan-answer question:q3 answer:"SaaS subscription model"
   /loan-answer question:q4 answer:1
   ```

3. **Check Status:**
   ```
   /loan-status
   ```

4. **Accept Offer:**
   ```
   /loan-accept offer:1
   ```

## Troubleshooting

### Bot Doesn't Login
- Check `.env` file exists and has correct `DISCORD_TOKEN`
- Verify token is valid (regenerate if needed)
- Check bot has "Message Content Intent" enabled in Discord Developer Portal

### Commands Don't Appear
- **If using global commands (no GUILD_ID):** Wait up to 1 hour for Discord to sync globally
- **If using guild commands:** Wait 5-10 minutes, check `DISCORD_GUILD_ID` is correct
- Verify bot is in your server
- Check console for registration errors
- Try restarting Discord client

### Database Errors
- Verify Supabase credentials in `.env`
- Check migrations ran successfully
- Verify tables exist: `users`, `companies`, `loans`, `loan_exam_sessions`

### Build Errors
- Run `npm install` to ensure dependencies are installed
- Check TypeScript version: `npx tsc --version`
- Clear `dist/` folder and rebuild: `rm -rf dist && npm run build`

## Testing Simulation Tool

Test game balance without Discord:

```bash
npm run simulate easy 10 30
```

This runs 10 companies on Easy difficulty for 30 days.

## Next Steps

Once basic testing works:
1. Test all commands
2. Test loan exam workflow end-to-end
3. Test break timer enforcement
4. Test multi-action per day limits
5. Run simulations to check balance

## Need Help?

- Check `README.md` for general info
- Check `BALANCE.md` for game mechanics
- Check `NEW_FEATURES.md` for new features
- Check `DEPLOY.md` for deployment details

