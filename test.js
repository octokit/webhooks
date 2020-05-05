const assert = require('assert')
const webhooks = require('.')

assert(Array.isArray(webhooks), 'webhooks module should export an array')
assert(webhooks.length > 0, 'webhooks module array is not empty')

webhooks.forEach(webhook => {
  assert(typeof webhook.name === 'string')
  assert(Array.isArray(webhook.actions))
  assert(Array.isArray(webhook.examples))
})
