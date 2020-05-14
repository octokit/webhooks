module.exports = sectionHtmlToWebhook

const cheerio = require('cheerio')

function sectionHtmlToWebhook (state, section) {
  const $ = cheerio.load(section.html)

  // ignore obsolete events that are no longer sent
  if (/Events of this type are no longer delivered/.test($('.warning').text())) {
    return null
  }

  const webhook = {
    name: getName($),
    actions: getActions($),
    examples: getExamples($)
  }
  
  return webhook
}

function getName ($) {
  return $('[id^="webhook-event-name"]')
    .parent()
    .nextUntil('h2, h3')
    .last()
    .text()
    .trim()
}

function getActions ($) {
  const $table = $('[id^="events-api-payload"]')
    .parent()
    .next('table')

  if (!$table.is('table')) return []

  const [keyEl,, descriptionEl] = $table.find('tbody tr:first-child td').get()

  if ($(keyEl).text().trim() !== 'action') return []

  const [, listOfActionsText] = $(descriptionEl).html().split(/\. /)

  // look for action names surrounded by quotes
  const matches = listOfActionsText.match(/&quot;(\w+)&quot;/g)

  let actions = []
  if (matches) {
    actions = matches.map(m => m.replace(/&quot;/g, '')).sort()
  } else {
    actions = cheerio.load(listOfActionsText)('code')
    .map((index, el) => $(el).text().trim())
    .get()
    .sort()
  }

  // return unique actions
  return [...new Set(actions)]
    .filter(action => action !== 'status')
}

function getExamples ($) {
  return $('.highlight-json')
    .map((index, el) => JSON.parse($(el).text()))
    .get()
}