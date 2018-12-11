module.exports = checkOrUpdateWebhooks

const { writeFileSync } = require('fs')
const { diff, diffString } = require('json-diff')

const createPrOnChange = require('./create-pr-on-change')
const getHtml = require('./get-html')
const getSections = require('./get-sections')
const toWebhook = require('./section-to-webhook')

async function checkOrUpdateWebhooks ({ cached, checkOnly }) {
  const state = {
    cached,
    checkOnly
  }

  const html = await getHtml({ cached })
  const sections = await getSections(state, html)
  const wekhooks = sections.map(toWebhook.bind(null, state)).filter(Boolean)

  const currentWebhooks = require('../index.json')

  if (!diff(currentWebhooks, wekhooks)) {
    console.log(`✅  webhooks are up-to-date`)
    return
  }

  console.log(`❌  webhooks are not up-to-date`)
  console.log(diffString(currentWebhooks, wekhooks))

  if (checkOnly) {
    process.exit(1)
  }

  writeFileSync('index.json', JSON.stringify(wekhooks, null, 2) + '\n')
  console.log(`✏️  index.json written`)

  if (process.env.TRAVIS_EVENT_TYPE === 'cron') {
    await createPrOnChange()
  }
}
