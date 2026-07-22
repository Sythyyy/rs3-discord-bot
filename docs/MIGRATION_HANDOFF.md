# RS3 Discord Bot migration handoff

Generated on 2026-07-21 for moving the bot from the current server to a home-hosted machine.

## Critical facts

- Repository: `https://github.com/Sythyyy/rs3-discord-bot.git`
- Current branch/commit: `main` at `b701470301e04abe38a750b79b48f4797092b7b8`
- Runtime: Node.js 22 or newer; current server uses Node `v22.23.1` and npm `12.0.1`.
- Database: PostgreSQL; current server uses PostgreSQL 16.14.
- Application directory on this server: `/opt/rs3-bot`.
- The working tree has extensive uncommitted and untracked work. **Do not migrate by cloning GitHub alone.** Copy the working tree or commit and push all intended work first.
- The real `.env` and database contents are ignored by Git and must be transferred separately.
- The bot only needs outbound internet access to Discord and local access to PostgreSQL. No inbound router port-forward is required.

## What must be transferred

1. The complete source working tree, including all untracked files under `assets/`, `db/migrations/`, and `src/`.
2. The real `/opt/rs3-bot/.env`, using a secure channel. Never paste it into a Codex prompt, commit it, or put it in an unencrypted archive.
3. A PostgreSQL custom-format dump of database `rs3_bot`.
4. This handoff document.

`node_modules/` and `dist/` need not be transferred; regenerate them on the new machine. The source tree excluding those directories is much smaller than the current 145 MB directory.

## Current environment contract

The application reads `.env` from its working directory. Required and optional names are documented in `.env.example`:

- `DISCORD_TOKEN` — required secret Discord bot token.
- `DISCORD_CLIENT_ID` — required Discord application ID.
- `DATABASE_URL` — required PostgreSQL URL.
- `DISCORD_GUILD_ID` — optional development/test guild ID; when set, slash commands register immediately to that guild. When omitted, commands register globally.
- `LOG_LEVEL` — optional: `debug`, `info`, `warn`, or `error`; default `info`.
- `GAME_SPEED_MULTIPLIER` — optional positive number; default `0.23`.
- `BUTTON_SIGNING_SECRET` — optional secret of at least 16 characters. If omitted, the Discord token signs persistent repeat buttons. Preserve the old value if one is later added or existing signed buttons will stop validating.

The current `.env` contains configured values for `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DATABASE_URL`, and `DISCORD_GUILD_ID`. It also contains a legacy `CLIENT_ID` variable that the current code does not read. Secret values are deliberately not recorded here.

## Current database state

- Database name/user currently used locally: `rs3_bot` / `rs3_bot`.
- Size at audit time: approximately 8,287 kB.
- Tables: `active_activities`, `character_equipment`, `character_skills`, `characters`, `economy_ledger`, `inventory_items`, `players`, `schema_migrations`, `users`, `woodcutting_repeat_uses`, and `woodcutting_trip_results`.
- At audit time there was one character/user, 29 skill rows, 34 inventory rows, 80 economy-ledger rows, 12 woodcutting-trip rows, and no active activity.
- The migration ledger contains 15 entries through `014_woodcutting_requested_quantity.sql`.
- The ledger includes historical `001_create_players.sql`, `002_starter_hatchets.sql`, and `003_woodcutting_rework.sql`, but those files are absent from the current working tree. A database dump is therefore the authoritative migration path.

Create a consistent dump on the old server:

```bash
sudo -u postgres pg_dump --format=custom --no-owner --no-acl --file=/tmp/rs3_bot.dump rs3_bot
sha256sum /tmp/rs3_bot.dump
```

Copy `/tmp/rs3_bot.dump` to the new machine securely. Do not stop the old bot until immediately before the final dump if player activity continues. For final cutover, stop the old bot first, take a new dump, transfer it, restore it, and only then start the new instance. Never run both instances with the same Discord token.

## Preserve the current working tree

Safest direct-copy option from the new machine (replace `OLD_HOST` and destination as needed):

```bash
rsync -a --delete \
  --exclude node_modules/ \
  --exclude dist/ \
  --exclude .env \
  OLD_HOST:/opt/rs3-bot/ /opt/rs3-bot/
```

Transfer `.env` separately with restrictive permissions:

```bash
scp OLD_HOST:/opt/rs3-bot/.env /opt/rs3-bot/.env
chmod 600 /opt/rs3-bot/.env
```

The `--delete` option is appropriate only for a new/dedicated destination. Omit it if the destination contains work that must be preserved.

## New-machine installation

Example for a Debian/Ubuntu host:

```bash
sudo apt update
sudo apt install -y postgresql postgresql-client rsync
# Install Node.js 22+ by the preferred supported method.
sudo mkdir -p /opt/rs3-bot
sudo chown -R "$USER":"$USER" /opt/rs3-bot
cd /opt/rs3-bot
npm ci
npm run build
npm run test
npm run lint
npm run format:check
```

Create a dedicated database role and database. Choose a new strong password and put the matching URL in `.env`:

```bash
sudo -u postgres createuser --pwprompt rs3_bot
sudo -u postgres createdb --owner=rs3_bot rs3_bot
pg_restore --dbname='postgresql://rs3_bot:NEW_PASSWORD@127.0.0.1:5432/rs3_bot' \
  --no-owner --no-acl --exit-on-error /path/to/rs3_bot.dump
```

Passwords containing URL-reserved characters must be percent-encoded in `DATABASE_URL`. Prefer `127.0.0.1` over `localhost` if local IPv4/IPv6 authentication differs.

Do not run `npm run migrate` before restoring into an empty database. After restoring the authoritative dump, running it is safe and applies only migration files not already in `schema_migrations`.

Then register Discord resources:

```bash
cd /opt/rs3-bot
npm run migrate
npm run register-commands
npm run register-skill-emojis
```

`register-skill-emojis` needs `DISCORD_GUILD_ID` and the bot needs permission to manage expressions/emojis. `register-commands` uses guild commands when `DISCORD_GUILD_ID` is present, otherwise global commands.

## Recommended systemd service

The repository's existing `deploy/rs3-discord-bot.service` points to `/opt/rs3-discord-bot`, not the current `/opt/rs3-bot`, and its direct `node dist/index.js` command does not load `.env`. Use this corrected unit if keeping `/opt/rs3-bot`:

```ini
[Unit]
Description=RS3-inspired Discord Bot
After=network-online.target postgresql.service
Wants=network-online.target

[Service]
Type=simple
User=rs3bot
Group=rs3bot
WorkingDirectory=/opt/rs3-bot
Environment=NODE_ENV=production
EnvironmentFile=/opt/rs3-bot/.env
ExecStart=/usr/bin/node /opt/rs3-bot/dist/index.js
Restart=always
RestartSec=5
TimeoutStopSec=30
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=full
ReadWritePaths=/opt/rs3-bot

[Install]
WantedBy=multi-user.target
```

Install and start it:

```bash
sudo useradd --system --home /opt/rs3-bot --shell /usr/sbin/nologin rs3bot
sudo chown -R rs3bot:rs3bot /opt/rs3-bot
sudo install -m 0644 /path/to/rs3-discord-bot.service /etc/systemd/system/rs3-discord-bot.service
sudo systemctl daemon-reload
sudo systemctl enable --now rs3-discord-bot
sudo systemctl status rs3-discord-bot --no-pager
sudo journalctl -u rs3-discord-bot -n 100 --no-pager
```

Confirm the actual Node binary with `command -v node`; change `ExecStart` if it is not `/usr/bin/node`. At audit time no `rs3-discord-bot.service` unit was installed on the old host.

## Cutover checklist

1. Build and test the copied source on the new host.
2. Create PostgreSQL role/database on the new host.
3. Stop the old bot so no writes occur and Discord has only one connected instance.
4. Create and checksum a fresh final database dump.
5. Transfer and verify the dump checksum.
6. Restore the dump on the new host.
7. Securely transfer `.env`, update only `DATABASE_URL` as necessary, and set mode `600`.
8. Run migrations, register commands/emojis, then start the new service.
9. Check the journal for `Discord bot ready` and database errors.
10. In Discord, test `/profile`, `/skills`, `/bank`, `/minion status`, and a short activity.
11. Keep the old server and dump intact until the new instance has been verified. Then revoke/rotate credentials if the old disk will leave your control.

## What the next Codex instance should know

Give Codex this file and access to the copied repository. Tell it that GitHub `main` is only the old scaffold and that the local dirty working tree is the real current application. Ask it to inspect `git status`, `.env.example`, `package.json`, `db/migrations/`, and the restored migration ledger before making changes. Do not paste `.env` values into the conversation; Codex can verify variable presence locally without displaying values.

The currently implemented surface includes `/chop`, `/equip`, `/quest`, `/profile`, `/skills`, `/bank`, `/minion buy|start|status|cancel`, `/sell`, `/help`, and administrator controls for skills, items, and coins. The runtime settles completed activities every five seconds, posts completion notifications, and uses signed persistent buttons for repeat/cancel interactions.
