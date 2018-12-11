module.exports = sectionHtmlToWebhook

const cheerio = require('cheerio')

function sectionHtmlToWebhook (state, section) {
  const $ = cheerio.load(section.html)

  // ignore obsolete events that are no longer sent
  if (/Events of this type are no longer delivered/.test($('.warning').text())) {
    return null
  }

  const webhook = $('h3')
    .filter((index, el) => $(el).text().trim() === 'Webhook event name')
    .map((index, el) => {
      // get event name
      const name = $(el).nextUntil('h3').last().text().trim()
      const $table = $(el).prev()

      if (!$table.is('table')) {
        return {
          name,
          actions: []
        }
      }

      const [keyEl,, descriptionEl] = $table.find('tbody tr:first-child td').get()

      if ($(keyEl).text().trim() !== 'action') {
        return {
          name,
          actions: []
        }
      }

      const [, listOfActionsText] = $(descriptionEl).html().split(/\. /)

      // look for action names surrounded by quotes
      const matches = listOfActionsText.match(/&quot;(\w+)&quot;/g)

      if (matches) {
        return {
          name,
          actions: matches.map(m => m.replace(/&quot;/g, '')).sort()
        }
      }

      const actions = cheerio.load(listOfActionsText)('code')
        .map((index, el) => {
          return $(el).text().trim()
        })
        .get().sort()

      return {
        name,
        actions
      }
    })
    .get()[0]

  webhook.examples = $('.highlight-json')
    .map((index, el) => JSON.parse($(el).text()))
    .get()

  return webhook
}
