#!/usr/bin/env node

const fs = require("fs");
const { ajv, validate } = require("../payload-schemas");
const { MissingRefError } = require("ajv/dist/compile/error_classes");

let hasErrors = false;
const payloads = `./payload-examples/api.github.com`;

fs.readdirSync(payloads).forEach((event) => {
  fs.readdirSync(`${payloads}/${event}`)
    .filter((filename) => filename.endsWith(".json"))
    .forEach((filename) => {
      const file = require(`../${payloads}/${event}/${filename}`);

      try {
        const validationResult = validate(event, file);
        if (!validationResult) {
          console.error(
            `❌ Payload '${event}/${filename}' does not match schema`
          );
          console.error(ajv.errors);
          hasErrors = true;
        } else {
          console.log(`✅ Payload '${event}/${filename}' matches schema`);
        }
      } catch (err) {
        console.error(`Missing schema for event '${event}'`);
        hasErrors = true;
      }
    });
});

if (hasErrors) {
  process.exit(1);
}
