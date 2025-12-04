# Discord Bot Setup Guide

Complete step-by-step guide to set up your Discord bot for the Startup Simulation Game.

## Step 1: Create a Discord Application

1. Go to https://discord.com/developers/applications
2. Click **"New Application"** (top right)
3. Enter a name (e.g., "Startup Simulator Bot")
4. Click **"Create"**

## Step 2: Create a Bot

1. In your application, go to the **"Bot"** tab (left sidebar)
2. Click **"Add Bot"** → **"Yes, do it!"**
3. Under **"Token"**, click **"Reset Token"** → **"Yes, do it!"**
4. **Copy the token** - you'll need this for your `.env` file
   - ⚠️ **Keep this secret!** Never share it publicly
   - If leaked, reset it immediately

## Step 3: Configure Bot Settings

Still in the **"Bot"** tab:

1. **Username**: Set your bot's display name
2. **Icon**: Upload a bot icon (optional)
3. **Public Bot**: Toggle OFF (unless you want others to add it)
4. **Message Content Intent**: Toggle **ON** ✅
   - Required for the bot to read message content
5. **Privileged Gateway Intents**:
   - ✅ **Message Content Intent** (already enabled above)

## Step 4: Get OAuth2 Credentials

1. Go to **"OAuth2"** → **"General"** tab
2. Copy the **"Client ID"** - you'll need this for your `.env` file

## Step 5: Set Up OAuth2 URL (Optional - for inviting bot)

1. Still in **"OAuth2"** → **"URL Generator"** tab
2. Under **"Scopes"**, select:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Under **"Bot Permissions"**, select:
   - ✅ `Send Messages`
   - ✅ `Embed Links`
   - ✅ `Read Message History`
   - ✅ `Use Slash Commands`
4. Copy the generated URL at the bottom
5. Open the URL in a browser to invite the bot to your server

## Step 6: Get Your Server (Guild) ID

**Option A: Using Developer Mode**
1. Open Discord
2. Go to **User Settings** → **Advanced**
3. Enable **"Developer Mode"**
4. Right-click on your server name → **"Copy Server ID"**

**Option B: Without Developer Mode**
- You can omit `DISCORD_GUILD_ID` from `.env` - the bot will use global commands
- Global commands work in all servers but take up to 1 hour to appear

## Step 7: Configure Environment Variables

1. In your project root, create/edit `.env` file:

```env
# Discord Bot Configuration (REQUIRED)
DISCORD_TOKEN=your_bot_token_from_step_2
DISCORD_CLIENT_ID=your_client_id_from_step_4

# Discord Guild ID (OPTIONAL - omit for global commands)
DISCORD_GUILD_ID=your_server_id_from_step_6

# Supabase Configuration (REQUIRED)
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# Environment
NODE_ENV=development
```

**Example `.env` file:**
```env
DISCORD_TOKEN=MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MA.AbCdEf.GhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWx
DISCORD_CLIENT_ID=123456789012345678
DISCORD_GUILD_ID=987654321098765432
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abcdefghijklmnopqrstuvwxyz1234567890
NODE_ENV=development
```

## Step 8: Set Up Database (Supabase)

### Create Supabase Project

1. Go to https://supabase.com
2. Sign up/Login
3. Click **"New Project"**
4. Fill in:
   - **Name**: Your project name
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
5. Click **"Create new project"**
6. Wait 2-3 minutes for setup

### Get Supabase Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy:
   - **Project URL** → `SUPABASE_URL` in `.env`
   - **anon public** key → `SUPABASE_KEY` in `.env`

### Run Database Migrations

1. Go to **SQL Editor** in Supabase dashboard
2. Run `src/db/schema.sql` first (creates base tables)
3. Run migrations in order:
   - `scripts/migrations/001_add_company_fields.sql`
   - `scripts/migrations/002_create_loan_exam_sessions.sql`
   - `scripts/migrations/003_add_loan_offer_fields.sql`

**Or use Supabase CLI:**
```bash
npm install -g supabase
supabase link --project-ref your-project-ref
supabase db push
```

## Step 9: Install Dependencies & Build

```bash
npm install
npm run build
```

## Step 10: Start the Bot

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## Step 11: Verify It's Working

1. **Check console output:**
   - Should see: `Logged in as YourBot#1234!`
   - Should see: `Successfully reloaded X application (/) commands`

2. **Test in Discord:**
   - Type `/help` in any channel
   - You should see the help command
   - If using global commands, wait up to 1 hour for them to appear

3. **Create a test company:**
   ```
   /create-startup name:TestCo type:saas difficulty:easy goal1:Grow users
   ```

## Troubleshooting

### Bot Won't Login
- ✅ Check `DISCORD_TOKEN` is correct (no extra spaces)
- ✅ Verify token hasn't expired (reset if needed)
- ✅ Check bot has "Message Content Intent" enabled

### Commands Don't Appear
- **Global commands**: Wait up to 1 hour
- **Guild commands**: Wait 5-10 minutes
- ✅ Verify bot is in your server
- ✅ Check `DISCORD_CLIENT_ID` is correct
- ✅ Try restarting Discord client
- ✅ Check console for registration errors

### Database Errors
- ✅ Verify Supabase credentials in `.env`
- ✅ Check migrations ran successfully
- ✅ Verify tables exist in Supabase dashboard

### Build Errors
- ✅ Run `npm install` to ensure dependencies installed
- ✅ Check Node.js version (need 18+)
- ✅ Clear `dist/` folder: `rm -rf dist && npm run build`

## Quick Reference

### Required Environment Variables
- `DISCORD_TOKEN` - Bot token from Discord Developer Portal
- `DISCORD_CLIENT_ID` - Client ID from OAuth2 tab
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon key

### Optional Environment Variables
- `DISCORD_GUILD_ID` - Server ID (omit for global commands)
- `NODE_ENV` - Set to `development` or `production`

### Important URLs
- **Discord Developer Portal**: https://discord.com/developers/applications
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Invite Bot**: Use OAuth2 URL Generator in Discord Developer Portal

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Never share your bot token** - Reset if leaked
3. **Use environment variables** - Don't hardcode secrets
4. **Rotate tokens regularly** - Especially if shared with others
5. **Limit bot permissions** - Only grant what's needed

## Next Steps

Once the bot is running:
1. Test all commands (`/help` to see list)
2. Create a test company (`/create-startup`)
3. Try the loan exam system (`/loan-start`)
4. Run simulations (`npm run simulate easy 10 30`)

For more details, see:
- `README.md` - General project info
- `TESTING.md` - Testing guide
- `DEPLOY.md` - Deployment guide
- `BALANCE.md` - Game balance info

