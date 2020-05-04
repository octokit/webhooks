module.exports = workarounds

const getPingWebhook = require('./get-ping-webhook')

function workarounds (webhooks) {
  // https://github.com/octokit/webhooks/issues/3
  webhooks.push(getPingWebhook())

  // https://github.com/octokit/webhooks/issues/4
  webhooks.forEach(webhook => {
    if (webhook.name === 'pull_request') {
      if (webhook.actions.includes('synchronize')) {
        throw new Error('Remove workaround that adds "synchronize" action to "pull_request" event')
      }

      webhook.actions = webhook.actions.concat('synchronize').sort()
    }
  })
}
