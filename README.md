# Down Detector Action

[![GitHub Super-Linter](https://github.com/kadirgun/downdetect/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/kadirgun/downdetect/actions/workflows/ci.yml/badge.svg)

This GitHub Action periodically sends HTTP requests to a specified URL to detect
crashes and notifies you through a
[Discord webhook](https://discord.com/developers/docs/resources/webhook).

## Usage

Here's an example of how to use this action in a workflow file:

```yaml
name: Down Detector

on:
  schedule:
    - cron: '*/5 * * * *'

jobs:
  detect:
    name: Check if the website is down
    runs-on: ubuntu-latest

    steps:
      - name: Ping the website
        uses: kadirgun/downdetect@main
        with:
          url: https://example.com
          expected-status-codes: 200,201
          expected-response-time: 1000
          discord-webhook: ${{ secrets.DISCORD_WEBHOOK }}
```

## Inputs

| Input                     | Default | Description                                                 |
| ------------------------- | ------- | ----------------------------------------------------------- |
| `expected-status-codes`   | 200     | The status code that the website is expected to return.     |
| `unexpected-status-codes` |         | The status code that the website is not expected to return. |
| `expected-response-time`  | 3000    | The expected response time in milliseconds.                 |
| `discord-webhook`         |         | The Discord webhook URL to send notifications to.           |

## Outputs

| Output          | Description                              |
| --------------- | ---------------------------------------- |
| `response-time` | The status code returned by the website. |
| `status-code`   | The response time of the website.        |
