// Discord Bot — forwards every new message from every channel into Supabase
// ---------------------------------------------------------------------------
// Runs as a persistent process (must be hosted somewhere that stays "always on",
// e.g. Railway or Render — NOT Vercel, which only runs code in short bursts).
//
// Setup:
// 1. npm install
// 2. Set these environment variables on your host (Railway/Render dashboard):
//      DISCORD_BOT_TOKEN         = the token you copied from Discord Developer Portal
//      SUPABASE_URL              = your project URL (Project Settings > API)
//      SUPABASE_SERVICE_ROLE_KEY = your service_role key (Project Settings > API)
// 3. Deploy. Logs will show "Logged in as <bot name>" once connected.
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!DISCORD_BOT_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing one of: DISCORD_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
// Strips control characters that Postgres text columns reject.
function sanitizeText(str) {
  if (!str) return '';
  return str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}
client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  console.log(`Watching ${c.guilds.cache.size} server(s).`);
});
client.on(Events.MessageCreate, async (message) => {
  // Ignore messages sent by bots (including this bot itself) to avoid noise/loops.
  if (message.author.bot) return;
  const row = {
    message_id: message.id,
    guild_id: message.guildId || '',
    guild_name: sanitizeText(message.guild ? message.guild.name : 'Unknown Server'),
    channel_id: message.channelId,
    channel_name: message.channel && message.channel.name ? message.channel.name : 'unknown',
    author_id: message.author.id,
    author_name: sanitizeText(message.member?.displayName || message.author.username),
    content: sanitizeText(message.content || ''),
    created_time: message.createdAt.toISOString(),
  };
  const { error } = await supabase.from('discord_messages').upsert(row, { onConflict: 'message_id' });
  if (error) {
    console.error('Failed to insert message:', error.message, row);
  } else {
    console.log(`Saved message from #${row.channel_name} @ ${row.guild_name} (${row.author_name})`);
  }
});
client.login(DISCORD_BOT_TOKEN);
