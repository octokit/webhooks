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

    if (webhook.name === 'commit_comment') {
      if (webhook.actions.length) {
        throw new Error('Remove workaround to get "commit_comment" actions')
      }

      webhook.actions = [
        'created'
      ]
    }

    if (webhook.name === 'pull_request') {
      if (webhook.actions.includes('synchronize')) {
        throw new Error('Remove workaround add "synchronize" event to "pull_request"')
      }

      webhook.actions.push('synchronize')
    }
  })
}
