#!/usr/bin/env node
const fs = require('fs');
const validate = require('../payload-schemas');

fs.readdirSync('./payload-examples/api.github.com').forEach(filename => {
  const [event, ...unused] = filename.split('.');
  const fileBuffer = fs.readFileSync(`./payload-examples/api.github.com/${filename}`);
  const file = JSON.parse(fileBuffer.toString());

  try {
    const validationResult = validate(event, file);
    if (!validationResult) {
      console.error(`Payload '${filename}' does not match schema`);
    } else {
      console.error(`Payload '${filename}' matches schema`);
    }
  } catch (err) {
    console.error(`Missing schema for event '${event}'`)
  }
});

