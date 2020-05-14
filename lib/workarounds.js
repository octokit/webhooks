module.exports = workarounds

const getPingWebhook = require('./get-ping-webhook')

function workarounds (webhooks) {
  // https://github.com/octokit/webhooks/issues/3
  webhooks.push(getPingWebhook())

  webhooks.forEach((webhook) => {
    // https://github.com/octokit/webhooks/pull/98/files/2c25e9c301486e10a258450790243d0a9e704c2a#r425397560
    if (webhook.name === 'check_run') {
      if (webhook.actions.includes('requested_action')) {
        throw new Error(
          'Remove workaround that adds "requested_action" action to "check_run" event'
        )
      }

      webhook.actions = webhook.actions.concat('requested_action').sort()
    }

    // https://github.com/octokit/webhooks/pull/98/files/2c25e9c301486e10a258450790243d0a9e704c2a#r425398872
    if (webhook.name === 'pull_request') {
      if (!webhook.actions.includes('merged')) {
        throw new Error(
          'Remove workaround that removes "merged" action from "pull_request" event'
        )
      }

      webhook.actions = webhook.actions.filter((action) => action !== 'merged')
    }
  })
}
