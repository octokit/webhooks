module.exports = checkOrUpdateWebhooks

const { writeFileSync } = require('fs')
const { diff, diffString } = require('json-diff')

const createPrOnChange = require('./create-pr-on-change')
const getHtml = require('./get-html')
const applyWorkarounds = require('./workarounds')
const getSections = require('./get-sections')
const toWebhook = require('./section-to-webhook')

async function checkOrUpdateWebhooks ({ cached, checkOnly }) {
  const state = {
    cached,
    checkOnly
  }

  const html = await getHtml({ cached })
  const sections = await getSections(state, html)
  const webhooks = sections.map(toWebhook.bind(null, state)).filter(Boolean)

  applyWorkarounds(webhooks)

  const currentWebhooks = require('../index.json')

  if (!diff(currentWebhooks, webhooks)) {
    console.log(`✅  webhooks are up-to-date`)
    return
  }

  console.log(`❌  webhooks are not up-to-date`)
  console.log(diffString(currentWebhooks, webhooks))

  if (checkOnly) {
    process.exit(1)
  }

  writeFileSync('index.json', JSON.stringify(webhooks, null, 2) + '\n')
  console.log(`✏️  index.json written`)

  if (process.env.TRAVIS_EVENT_TYPE === 'cron') {
    await createPrOnChange()
  }
}
