#!/usr/bin/env -S npx tsx

import Ajv from "ajv";
import addFormats from "ajv-formats";
import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { parseArgv } from "./utils/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const [, {}] = parseArgv(__filename, [], []);

const ajv = new Ajv.default({ strict: true });

addFormats.default(ajv);
ajv.addKeyword("tsAdditionalProperties");

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const schema = JSON.parse(
  readFileSync(resolve(__dirname, "../payload-schemas/schema.json"), "utf-8"),
);

// if this is invalid, an error will be thrown
ajv.compile(schema);
