#!/usr/bin/env -S ts-node-transpile-only --esm

import { DefinedError, ErrorObject } from "ajv";
import path from "path";
import { inspect } from "util";
import { ajv, validate } from "../payload-schemas/index.mjs";
import { forEachJsonFile, parseArgv, pathToPayloads } from "./utils/index.mjs";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const [, { continueOnError = false }] = parseArgv(
  __filename,
  [],
  ["continue-on-error"],
);

const printAjvErrors = () => {
  const finalErrors: ErrorObject[] = [];

  ajv.errors?.forEach((error) => {
    const similarError = finalErrors.find(
      (er) =>
        er.keyword === error.keyword && er.instancePath === error.instancePath,
    ) as DefinedError | undefined;

    if (similarError?.keyword === "enum") {
      similarError.params.allowedValues.push(...error.params.allowedValues);

      return;
    }

    finalErrors.push(error);
  });

  console.error(inspect(finalErrors, { depth: Infinity, colors: true }));
};

forEachJsonFile(pathToPayloads, (filePath) => {
  if (filePath.includes("/index.json")) return;
  const file = JSON.parse(
    readFileSync(
      path.join(fileURLToPath(import.meta.url), "..", "..", filePath),
    ).toString(),
  ) as unknown;
  const { dir: event, base: filename } = path.parse(
    path.relative(pathToPayloads, filePath),
  );

  try {
    const validationResult = validate(event, file);

    if (!validationResult) {
      console.error(`❌ Payload '${event}/${filename}' does not match schema`);
      printAjvErrors();
      process.exitCode = 1;
    } else {
      console.log(`✅ Payload '${event}/${filename}' matches schema`);
    }
  } catch (err: any) {
    if (!continueOnError) {
      throw err;
    }

    console.error(`💥 Payload '${event}/${filename}' errored: ${err.message}`);
    process.exitCode = 1;
  }
});
