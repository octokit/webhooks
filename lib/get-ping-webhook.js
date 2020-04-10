module.exports = getPingWebhook

/**
 * The "ping" webhook is currently not listed on https://developer.github.com/v3/activity/events/types
 * @see https://github.com/octokit/webhooks/issues/3
 */
function getPingWebhook () {
  return {
    name: 'ping',
    actions: [],
    examples: [{
      event: 'ping',
      payload: {
        zen: 'Design for failure.',
        hook_id: 123,
        hook: {
          type: 'App',
          id: 123,
          name: 'web',
          active: true,
          events: ['pull_request'],
          config: {
            content_type: 'json',
            insecure_ssl: '0',
            url: 'https://my-app.com/webhook'
          },
          updated_at: '2018-12-11T21:18:31Z',
          created_at: '2018-12-11T21:18:31Z',
          app_id: 456
        }
      }
    }]
  }
}
