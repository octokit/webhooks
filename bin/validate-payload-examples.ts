#!/usr/bin/env ts-node-transpile-only

import { DefinedError, ErrorObject } from "ajv";
import fs from "fs";
import { ajv, validate } from "../payload-schemas";
import { inspect } from "util";

const payloads = `./payload-examples/api.github.com`;

const continueOnError = process.argv.includes("--continue-on-error");

const printAjvErrors = () => {
  const finalErrors: ErrorObject[] = [];

  ajv.errors?.forEach((error) => {
    const similarError = finalErrors.find(
      (er) => er.keyword === error.keyword && er.dataPath === error.dataPath
    ) as DefinedError | undefined;

    if (similarError?.keyword === "enum") {
      similarError.params.allowedValues.push(...error.params.allowedValues);

      return;
    }

    finalErrors.push(error);
  });

  console.error(inspect(finalErrors, { depth: Infinity, colors: true }));
};

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
          printAjvErrors();
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
