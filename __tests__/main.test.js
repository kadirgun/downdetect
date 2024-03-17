/**
 * Unit tests for the action's main functionality, src/main.js
 */
const core = require('@actions/core')
const github = require('@actions/github')
const main = require('../src/main')
const { WebhookClient } = require('discord.js')

// Mock the GitHub Actions core library
const infoMock = jest.spyOn(core, 'info').mockImplementation()
const getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
const setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
const setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
// mock the discord.js WebhookClient send method
const discordSendMock = jest
  .spyOn(WebhookClient.prototype, 'send')
  .mockResolvedValue({})

// This is a fake Discord webhook URL
const discordWebhook =
  'https://discord.com/api/webhooks/000000000000000000/7TTlQhopjkUsosiCM1u0YRCEFsxVzne5fVi9WW5gSVlsGu6XZCcLvdCBLWERxIpTZoC7'

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('do not fail on success url', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'url':
          return 'https://example.com'
        case 'expected-response-time':
          return '5000'
        case 'expected-status-codes':
          return '200,201,202'
        default:
          return ''
      }
    })

    github.context.payload = {}

    await main.run()

    expect(runMock).toHaveReturned()
    expect(setOutputMock).toHaveBeenCalledWith('status-code', 200)
    expect(setFailedMock).not.toHaveBeenCalled()
  })

  it('sends discord on error', async () => {
    discordSendMock.mockResolvedValueOnce({ id: '1234567890' })

    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'url':
          return 'https://example.com/not-found'
        case 'discord-webhook':
          return discordWebhook
        case 'expected-status-codes':
          return '200,201,202'
        default:
          return ''
      }
    })

    github.context.payload = {}

    await main.run()

    expect(runMock).toHaveReturned()
    expect(discordSendMock).toHaveBeenCalledWith(expect.any(Object))
    expect(setFailedMock).not.toHaveBeenCalled()
  })

  it('sets the response-time output', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'url':
          return 'https://example.com/not-found'
        default:
          return ''
      }
    })

    github.context.payload = {}

    await main.run()

    expect(runMock).toHaveReturned()
    expect(setOutputMock).toHaveBeenCalledWith(
      'response-time',
      expect.any(Number)
    )
  })

  it('fail on exceeded response time', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'url':
          return 'https://example.com'
        case 'expected-response-time':
          return '1'
        case 'expected-status-codes':
          return '200,201,202'
        default:
          return ''
      }
    })

    github.context.payload = {}

    await main.run()

    expect(runMock).toHaveReturned()
    expect(setFailedMock).toHaveBeenCalledWith(
      expect.stringContaining('which is longer than the expected')
    )
  })

  it('fail on discord send error', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'url':
          return 'https://example.com/not-found'
        case 'discord-webhook':
          return discordWebhook
        case 'expected-status-codes':
          return '200,201,202'
        default:
          return ''
      }
    })

    discordSendMock.mockRejectedValueOnce('Error sending to Discord')

    github.context.payload = {}

    await main.run()

    expect(runMock).toHaveReturned()
    expect(setFailedMock).toHaveBeenCalled()
  })
})
