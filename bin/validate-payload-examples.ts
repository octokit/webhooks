#!/usr/bin/env ts-node-transpile-only

import fs from "fs";
import { ajv, validate } from "../payload-schemas";

const payloads = `./payload-examples/api.github.com`;

const continueOnError = process.argv.includes("--continue-on-error");

fs.readdirSync(payloads).forEach((event) => {
  fs.readdirSync(`${payloads}/${event}`)
    .filter((filename) => filename.endsWith(".json"))
    .forEach((filename) => {
      const file = require(`../${payloads}/${event}/${filename}`) as unknown;

      try {
        const validationResult = validate(event, file);

        if (!validationResult) {
          console.error(
            `❌ Payload '${event}/${filename}' does not match schema`
          );
          console.error(ajv.errors);
          process.exitCode = 1;
        } else {
          console.log(`✅ Payload '${event}/${filename}' matches schema`);
        }
      } catch (err) {
        if (!continueOnError) {
          throw err;
        }

        console.error(
          `💥 Payload '${event}/${filename}' errored: ${err.message}`
        );
        process.exitCode = 1;
      }
    });
});
