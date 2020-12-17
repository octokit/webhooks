#!/usr/bin/env node

const fs = require('fs');
const { ajv, validate } = require('../payload-schemas');

let hasErrors = false;
const payloads = `./payload-examples/api.github.com`;

fs.readdirSync(payloads)
  .filter((filename) => filename.endsWith('.json'))
  .forEach((filename) => {
    const [event, ...unused] = filename.split('.');
    const fileBuffer = fs.readFileSync(`${payloads}/${filename}`);
    const file = JSON.parse(fileBuffer.toString());

    try {
      const validationResult = validate(event, file);
      if (!validationResult) {
        console.error(`❌ Payload '${filename}' does not match schema`);
        hasErrors = true;
      } else {
        console.log(`✅ Payload '${filename}' matches schema`);
      }
    } catch (err) {
      console.error(`Missing schema for event '${event}'`);
      hasErrors = true;
    }
  });

if (hasErrors) {
  process.exit(1);
}
