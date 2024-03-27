# Bankara Misskey-bot

![Bankara Workflow Status](https://img.shields.io/github/actions/workflow/status/sasagar/bankara-misskey-bot/build-image.yml?label=Container%20Build&style=for-the-badge)

![GitHub package.json version (subfolder of monorepo)](https://img.shields.io/github/package-json/v/sasagar/bankara-misskey-bot?style=for-the-badge) ![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/sasagar/bankara-misskey-bot?include_prereleases&style=for-the-badge)

## What

Post Splatoon3 schedule to Misskey.

## Getting started

At any directory that specified, make `compose.yml` like below.

```yaml
services:
  bankara-misskey-bot:
    image: ghcr.io/sasagar/bankara-misskey-bot
    restart: always
    volumes:
      - .env:/usr/src/app/.env:ro
      - ./JSON:/usr/src/app/JSON
```

Put the `.env` file at the same directory you make `compose.yml`.  
You can copy `JSON` directory from this repository. It contains all stage badges and weapon badges, so you should change them if needed to meet your server's emoji reactions.  
Sample `.env` file can be found at this repository as `.env.sample`.

- You should get account (that you want to note them on) API TOKEN from Misskey, and put it on the `.env` file.
- You should change MISSKEY_URL on the `.env` file too.

Then, it's time to start.

```shell
docker compose up -d
```

And you can get the note as it scheduled.

## Spec

- Usualy, the notes are send in every 2 hours. (even-numbered hour at UTC)
- Now, only supports Japanese. (Of course you can contribute!)

## Spacial thanks

Schedule data: <https://spla3.yuu26.com/>
