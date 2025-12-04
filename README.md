# Startup Simulation Discord Bot

A full-featured TypeScript Discord bot that simulates running a startup company. Survive 90 days, make strategic decisions, manage resources, and grow your business!

## Features

- **Startup Creation**: Create your startup with custom name, type, goals, and difficulty
- **Daily Actions**: Choose from 5-8 actions per day based on difficulty
- **Event System**: Each action triggers 1-3 events with branching outcomes
- **Skill Tree**: Level up skills in Product, Marketing, Finance, and Technology
- **Loan System**: Apply for loans with credibility-based offers
- **Anomalies**: Random events that can help or hurt your startup
- **Boss Fight**: Face a competitor on Day 45
- **Daily Tick**: Automatic processing of revenue, burn rate, retention, and more

## Setup

### Quick Start

**For detailed step-by-step instructions, see [DISCORD_SETUP.md](DISCORD_SETUP.md)**

### Prerequisites

- Node.js 18+ 
- Discord Bot Token ([Get one here](https://discord.com/developers/applications))
- Supabase Account ([Sign up here](https://supabase.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd startup-simulation-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Discord Bot**
   - Create application at https://discord.com/developers/applications
   - Create bot and copy token
   - Enable "Message Content Intent"
   - Copy Client ID from OAuth2 tab
   - See [DISCORD_SETUP.md](DISCORD_SETUP.md) for detailed steps

4. **Set up Supabase**
   - Create project at https://supabase.com
   - Copy Project URL and anon key
   - Run migrations (see below)

5. **Create `.env` file**
   ```env
   DISCORD_TOKEN=your_bot_token_here
   DISCORD_CLIENT_ID=your_client_id_here
   DISCORD_GUILD_ID=your_server_id_here  # Optional - omit for global commands
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_KEY=your_supabase_anon_key_here
   NODE_ENV=development
   ```

6. **Set up database**
   - Go to Supabase SQL Editor
   - Run `src/db/schema.sql` first
   - Run migrations from `scripts/migrations/` in order:
     - `001_add_company_fields.sql`
     - `002_create_loan_exam_sessions.sql`
     - `003_add_loan_offer_fields.sql`

7. **Build and run**
   ```bash
   npm run build
   npm start
   ```

**For development with auto-reload:**
```bash
npm run dev
```

**Note:** `DISCORD_GUILD_ID` is optional. If omitted, commands will be registered globally (may take up to 1 hour to appear but works in all servers).

### Running Simulations

Test game balance with the simulation tool:
```bash
npm run simulate easy 100 90
npm run simulate normal 100 90
npm run simulate hard 100 90
```

### Running Tests

```bash
npm test
```

## Commands

### Core Gameplay
- `/create-startup` - Create a new startup company
- `/start-day` - Start a new day and get daily actions
- `/action <actionId>` - Select an action to take
- `/choose <choiceId>` - Choose an outcome for a pending event
- `/end-day` - End the current day and process daily tick
- `/stats` - View your company statistics
- `/skill-tree [skillId]` - View and upgrade your skill tree
- `/reset` - Reset your current company
- `/help` - Show help information

### Loan System (New!)
- `/loan-start` - Begin loan verification exam (30 minutes, 4 questions)
- `/loan-answer question:<id> answer:<value>` - Submit exam answer
- `/loan-status` - Check exam progress and view loan offers
- `/loan-accept offer:<number>` - Accept a loan offer
- `/loan-decline` - Decline all loan offers
- `/pay-loan [loanId] [amount]` - Make a payment on your loan

## Game Mechanics

### Difficulty Levels

- **Easy**: 5 actions per day
- **Normal**: 4 actions per day
- **Hard**: 3 actions per day
- **Another Story**: 3 actions per day (unlocked after completing Hard)

### Action Categories

- Product
- Marketing
- Tech
- Business Development
- Operations
- Finance
- Research
- High Risk

### Win/Lose Conditions

- **Win**: Survive until Day 90
- **Lose**: Cash < 0 AND loan lifeline already used

### Daily Tick System

Each day end processes:
- Revenue calculation
- Burn rate
- User retention & churn
- Hype decay
- Virality chance
- Loan penalties
- Goal progression
- Bankruptcy check

## Project Structure

```
src/
  commands/        # Discord command handlers
  config/          # Bot and game configuration
  db/              # Database models and queries
  game/
    actions/       # Action system
    data/          # Game data (actions, events, skills, anomalies)
    engine/        # Game engine core
    events/        # Event engine
    state/         # Company state management
    systems/       # Game systems (daily tick, loans, skills, etc.)
  utils/           # Utility functions
  types/           # TypeScript type definitions
  index.ts         # Main bot entry point
```

## Development

The project uses:
- **Discord.js v14** for Discord API
- **Supabase** for database
- **TypeScript** for type safety
- **Modular architecture** for extensibility

All game logic is separated from Discord command handlers, making it easy to extend and maintain.

## Documentation

- **[DISCORD_SETUP.md](DISCORD_SETUP.md)** - Complete Discord bot setup guide (start here!)
- **[BALANCE.md](BALANCE.md)** - Complete balance guide with formulas and tuning guidelines
- **[NEW_FEATURES.md](NEW_FEATURES.md)** - Documentation for new features (loan exam, multi-action, etc.)
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and changes
- **[DEPLOY.md](DEPLOY.md)** - Deployment guide and migration instructions
- **[TESTING.md](TESTING.md)** - Testing and troubleshooting guide

## Deployment

### Railway (Recommended for MVP)

Railway is the easiest way to deploy this bot. See **[RAILWAY.md](RAILWAY.md)** for complete step-by-step instructions.

**Quick Steps:**
1. Push your code to GitHub
2. Connect Railway to your GitHub repository
3. Add environment variables (Discord token, Supabase credentials)
4. Railway automatically builds and deploys
5. Your bot is live!

### Other Platforms

See **[DEPLOY.md](DEPLOY.md)** for deployment instructions for other platforms (VPS, Heroku, etc.).

### Environment Variables

Create a `.env` file (or set in your deployment platform):

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_server_id_here  # Optional - omit for global commands
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
NODE_ENV=production
```

**Note:** See `.env.example` for a template (create this file if it doesn't exist).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

