module.exports = checkOrUpdateWebhooks

const { writeFileSync } = require('fs')
const { diff, diffString } = require('json-diff')

const createPrOnChange = require('./create-pr-on-change')
const getHtml = require('./get-html')
const applyWorkarounds = require('./workarounds')
const getSections = require('./get-sections')
const toWebhook = require('./section-to-webhook')
const getActionsAndExamplesFromPayloads = require('./get-actions-and-examples-from-payloads')

async function checkOrUpdateWebhooks ({ cached, checkOnly }) {
  const state = {
    cached,
    checkOnly
  }

  const html = await getHtml({ cached })
  const sections = await getSections(state, html)
  const webhooksFromScrapingDocs = sections.map(toWebhook.bind(null, state)).filter(Boolean)
  const webhooksFromPayloadExamplesByName = getActionsAndExamplesFromPayloads()

  const webhooks = webhooksFromScrapingDocs.map((webhook) => {
    const name = webhook.name
    const webhookFromPayloadExamples = webhooksFromPayloadExamplesByName[name]

    if (!webhookFromPayloadExamples) {
      console.warn(`No payload examples for ${name}`)
      return webhook
    }

    return {
      name,
      description: webhook.description,
      actions: [...new Set(webhook.actions.concat(webhookFromPayloadExamples.actions))],
      examples: webhook.examples.concat(webhookFromPayloadExamples.examples)
    }
  })

  applyWorkarounds(webhooks)

  const currentWebhooks = require('../index.json')

  if (!diff(currentWebhooks, webhooks)) {
    console.log('✅  webhooks are up-to-date')
    return
  }

  console.log('❌  webhooks are not up-to-date')
  console.log(diffString(currentWebhooks, webhooks))

  if (checkOnly) {
    process.exit(1)
  }

  writeFileSync('index.json', JSON.stringify(webhooks, null, 2) + '\n')
  console.log('✏️  index.json written')

  if (process.env.TRAVIS_EVENT_TYPE === 'cron') {
    await createPrOnChange()
  }
}
