const core = require('@actions/core')
const github = require('@actions/github')
const { EmbedBuilder, WebhookClient } = require('discord.js')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  const url = core.getInput('url', { required: true })
  const expectedStatusCodes = core
    .getInput('expected-status-codes', {
      trimWhitespace: true
    })
    .split(',')
    .map(Number)

  const expectedResponseTime = core.getInput('expected-response-time')

  core.info(`Pinging ${url}...`)
  const start = Date.now()
  const response = await fetch(url)
  const responseTime = Date.now() - start
  core.setOutput('status-code', response.status)
  core.setOutput('response-time', responseTime)

  let message = null

  if (!expectedStatusCodes.includes(response.status)) {
    message = `The server at ${url} returned a status code of ${response.status}.`
  } else if (responseTime > expectedResponseTime) {
    message = `The server at ${url} took ${responseTime}ms to respond, which is longer than the expected ${expectedResponseTime}ms.`
  }

  if (message) {
    try {
      await sendErrorToDiscord(message)
    } catch {
      core.setFailed(message)
    }
  } else {
    core.info(`The server at ${url} is up and running.`)
    core.info(`Status code: ${response.status}`)
    core.info(`Response time: ${responseTime}ms`)
  }
}

/**
 * Send an error message to Discord.
 * @param {string} error
 */
async function sendErrorToDiscord(error) {
  const url = core.getInput('discord-webhook')

  // If the URL is not set, fail the action to prevent silent failures
  if (!url) {
    throw new Error('Discord webhook URL not set')
  }

  const webhookClient = new WebhookClient({ url })

  const embed = new EmbedBuilder()
  embed.setTitle('Website Down')
  embed.setColor(0xda3633)
  embed.setDescription(error)

  await webhookClient.send({
    embeds: [embed]
  })
}

module.exports = {
  run
}
