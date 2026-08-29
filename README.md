# EZComment Discord Bot

Listens to every channel in your Discord server and forwards new messages
into the same Supabase project that powers the FB Comment Intelligence
dashboard, so Discord messages can show up alongside Facebook comments.

## Setup

1. Push this folder to a new GitHub repo (e.g. `ezcomment-discord-bot`).
2. Create a project on Railway (or Render) and connect it to that repo.
3. In the host's dashboard, set these environment variables:
   - `DISCORD_BOT_TOKEN` — from Discord Developer Portal > Bot > Token
   - `SUPABASE_URL` — from Supabase Project Settings > API
   - `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Project Settings > API
4. Deploy. Check the logs — you should see `Logged in as <bot name>`.
5. Send a test message in any channel the bot can see — check the
   `discord_messages` table in Supabase to confirm it was saved.

## Notes

- The bot must run as a persistent process (Railway/Render), not on Vercel —
  Vercel serverless functions can't hold an open connection to Discord.
- Only channels the bot has "View Channel" + "Read Message History"
  permission for will be picked up.
