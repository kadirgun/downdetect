const core = require('@actions/core')
const github = require('@actions/github')
const { EmbedBuilder } = require('discord.js')
const { WebhookClient } = require('discord.js')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    // The `who-to-greet` input is defined in action metadata file
    const whoToGreet = core.getInput('who-to-greet', { required: true })
    core.info(`Hello, ${whoToGreet}!`)

    // Get the current time and set as an output
    const time = new Date().toTimeString()
    core.setOutput('time', time)

    // Output the payload for debugging
    core.info(
      `The event payload: ${JSON.stringify(github.context.payload, null, 2)}`
    )
  } catch (error) {
    // Fail the workflow step if an error occurs
    core.setFailed(error.message)
  }
}

/**
 * Ping the server to check if it is up.
 * @returns {Promise<void>} Resolves when the server is up.
 */
async function ping() {
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
  if (!expectedStatusCodes.includes(response.status)) {
    return sendErrorToDiscord(
      `The server at ${url} returned a status code of ${response.status}.`
    )
  }

  const responseTime = Date.now() - start

  if (responseTime > expectedResponseTime) {
    return sendErrorToDiscord(
      `The server at ${url} took ${responseTime}ms to respond, which is longer than the expected ${expectedResponseTime}ms.`
    )
  }

  core.setOutput('response-time', responseTime)
  core.setOutput('status-code', response.status)
}

/**
 * Send an error message to Discord.
 * @param {string} error
 */
async function sendErrorToDiscord(error) {
  const url = core.getInput('discord-webhook-url')

  // If the URL is not set, fail the action to prevent silent failures
  if (!url) {
    core.setFailed(error)
    return
  }

  const webhookClient = new WebhookClient({ url })

  const embed = new EmbedBuilder()
  embed.setTitle('Website Down')
  embed.setColor(0xda3633)
  embed.setDescription(error)

  try {
    await webhookClient.send({
      embeds: [embed]
    })
  } catch {
    // If the message fails to send, fail the action to prevent silent failures
    core.setFailed(error)
  }
}

module.exports = {
  run
}
