# `@sugarcube/plugin-telegram`

I had to do the following steps to make this work:

1. Send a message to @BotFather: /newbot
   This asks you for a name and a username for your bot. You get back a bot token.
2. Run `curl -v https://api.telegram.org/bot<your bot key>/getUpdates` and
   look for the channel ID of this bot.

Edit your config file and add:

```
{
  "telegram": {
    "bot_key": "<your bot key>",
    "channel_id": "<your channel id"
  }
}
```

## Plugins

- `telegram_send_message` - Sends the content of `_sc_content_fields` of every
  unit to the Telegram chat.