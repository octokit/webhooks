module.exports = workarounds

const getPingWebhook = require('./get-ping-webhook')

function workarounds (webhooks) {
  // https://github.com/octokit/webhooks/issues/3
  webhooks.push(getPingWebhook())

  // https://github.com/octokit/webhooks/issues/4
  webhooks.forEach(webhook => {
    if (webhook.name === 'member') {
      if (webhook.actions.length) {
        throw new Error('Remove workaround to get "member" actions')
      }

      webhook.actions = [
        'added',
        'deleted',
        'edited'
      ]
    }
  })
}
