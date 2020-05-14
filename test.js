const assert = require('assert')
const Ajv = require('ajv')
const ajv = new Ajv()
const schema = require('./schema.js')
const webhooks = require('.')

const errors = []

webhooks.forEach(webhook => {
  const valid = ajv.validate(schema, webhook)
  if (!valid) {
    errors.push({
      webhookName: webhook.name,
      errors: ajv.errors
    })
  }
})

if (errors.length) {
  console.log(JSON.stringify(errors, null, 2))
  process.exit(1)
}