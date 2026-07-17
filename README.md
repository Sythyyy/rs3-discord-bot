# RS3-inspired Discord Bot

A standalone, persistent Discord RPG inspired by the progression loops of RuneScape-style games. It is **not affiliated with, connected to, or endorsed by Jagex or RuneScape**. It does not use RuneScape accounts, APIs, game data, scraping, or credentials.

Phase 1 provides a production-oriented TypeScript foundation and one complete gameplay loop: create a character, start a timed gathering activity, claim XP/resources, view a bank, and sell resources for coins.

## Technology

- Node.js 22+ and TypeScript
- [discord.js](https://discord.js.org/) slash commands
- PostgreSQL for persistent game state
- `pg` with versioned SQL migrations
- `pino` structured logging
- `vitest`, ESLint, and Prettier

Docker is deliberately omitted for Phase 1. A single bot process plus PostgreSQL is simpler to operate on an Ubuntu/Debian VPS with `systemd`.

## Phase 1 commands

| Command | Description |
| --- | --- |
| `/start` | Create a character with starter coins. |
| `/profile [user]` | View a character's coins and skill levels. |
| `/bank [user]` | View resources held in a character's bank. |
| `/minion start <activity>` | Start one timed gathering activity. |
| `/minion status` | Check the active activity. |
| `/minion claim` | Claim a completed activity's XP and resources. |
| `/sell <item> <quantity>` | Sell resources to the NPC shop. |
| `/help` | Show the available Phase 1 commands. |

Activities are persisted in PostgreSQL. A bot restart does not discard an activity, and claims use row locks/transactions to prevent duplicate rewards.

## Local setup

### 1. Prerequisites

- Node.js 22 or newer
- PostgreSQL 16 or newer (PostgreSQL 14+ should also work)
- A Discord application with a bot user

Create a Discord application in the [Discord Developer Portal](https://discord.com/developers/applications), create a bot user, and invite it with the `bot` and `applications.commands` scopes. This bot only needs the **Guilds** gateway intent for slash commands.

### 2. Install dependencies

```bash
npm install
```

Once a committed `package-lock.json` is available, use `npm ci` for reproducible installs instead.

### 3. Create the database

```bash
sudo -u postgres createuser --pwprompt rs3_bot
sudo -u postgres createdb --owner=rs3_bot rs3_bot
```

### 4. Configure environment variables

```bash
cp .env.example .env
chmod 600 .env
```

Edit `.env` with the following values:

| Variable | Required | Description |
| --- | --- | --- |
| `DISCORD_TOKEN` | Yes | Bot token from the Discord Developer Portal. Keep secret. |
| `DISCORD_CLIENT_ID` | Yes | Discord application ID. |
| `DATABASE_URL` | Yes | PostgreSQL URL, e.g. `postgres://rs3_bot:password@localhost:5432/rs3_bot`. |
| `DISCORD_GUILD_ID` | No | Development server ID. Commands register instantly there. Omit for global registration. |
| `LOG_LEVEL` | No | `debug`, `info`, `warn`, or `error`; defaults to `info`. |

Never commit `.env`. The repository ignores it and includes only `.env.example`.

### 5. Migrate, register commands, and run

```bash
npm run migrate
npm run seed:agility
npm run register-commands
npm run dev
```

Use `DISCORD_GUILD_ID` while developing. Discord global command updates can take up to an hour to appear.

## Quality checks

```bash
npm run format:check
npm run lint
npm run test
npm run build
```

## Ubuntu/Debian VPS deployment with systemd

### 1. Install runtime packages

Install a current Node.js LTS release and PostgreSQL, either locally or via a managed PostgreSQL provider. Give the bot a dedicated non-root Linux user:

```bash
sudo adduser --system --group --home /opt/rs3-discord-bot rs3bot
sudo mkdir -p /opt/rs3-discord-bot
sudo chown rs3bot:rs3bot /opt/rs3-discord-bot
```

Deploy the repository into `/opt/rs3-discord-bot`, then run as that user:

```bash
cd /opt/rs3-discord-bot
npm install
cp .env.example .env
chmod 600 .env
# Edit .env with production values.
npm run migrate
npm run register-commands
npm run build
npm prune --omit=dev
```

### 2. Install the service

Copy [`deploy/rs3-discord-bot.service`](deploy/rs3-discord-bot.service) to `/etc/systemd/system/rs3-discord-bot.service`, then run:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now rs3-discord-bot
sudo systemctl status rs3-discord-bot
sudo journalctl -u rs3-discord-bot -f
```

### 3. Update safely

```bash
cd /opt/rs3-discord-bot
git pull --ff-only
npm install
npm run migrate
npm run build
npm prune --omit=dev
sudo systemctl restart rs3-discord-bot
```

Back up PostgreSQL regularly (for example with `pg_dump`) and test restoration before relying on the bot for long-running game progress.

## Project structure

```text
src/application/       Use cases and transaction orchestration
src/content/           Original declarative items, skills, and activities
src/domain/             Pure game rules, including XP/level calculations
src/discord/            Slash-command definitions and interaction adapters
src/infrastructure/     PostgreSQL and migration infrastructure
db/migrations/          Ordered, versioned database schema migrations
```

## Agility data sources and refresh process

Agility course data is stored in a versioned local PostgreSQL catalogue. Normal Discord commands never request, scrape, or depend on the RuneScape Wiki. The initial local catalogue identifies the [RS3 Agility training page](https://runescape.wiki/w/Agility_training) as its source and keeps bot-balanced XP separate from source values.

Wiki XP/hour figures are estimates, not guaranteed rewards; boosts, route efficiency, failures, gear, quests, and events can change them. Records marked `needsVerification` are excluded from training recommendations. Course rewards and chances are only shown when their source data has been reviewed; unknown values are not invented.

The administrator Agility refresh command is deliberately preview-only until the deployment can retrieve and manually verify source data. A future approved refresh must use the MediaWiki API with a descriptive User-Agent, conservative rate limiting, `Retry-After` handling, cached revisions, a saved diff, and explicit confirmation before it can publish a new catalogue version.

## Phase 1 boundaries

This release intentionally does not implement combat, bosses, quests, player trading, clans, a player-run market, pets, or a web dashboard. Future features should add content/rules through the domain and application layers rather than placing game logic in Discord command handlers.
