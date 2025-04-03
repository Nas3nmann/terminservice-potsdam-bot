# Terminservice Potsdam Telegram Bot
Notifies you about free appointments at the "Bürgerservice" Potsdam, Germany

This one is quick and dirty, but got me an appointment about two month earlier than I could have gotten one manually.

## How to use
- checkout
- build docker image
- crate telegram bot
  - [How to create a telegram bot and get the telegram chat ID](https://gist.github.com/nafiesl/4ad622f344cd1dc3bb1ecbe468ff9f8a)
  - [Telegram bot father](https://core.telegram.org/bots/features#botfather)
- provide environment variables
  - `BOT_TOKEN` telegram bot token 
  - `CHAT_ID` chat id
  - `RUN_EVERY_N_MINUTES` appointment scraping period (defaults to every 10min)
- run docker container

No issues will be answered and not PRs will be accepted. Feel free to fork and improve. Have fun :)
