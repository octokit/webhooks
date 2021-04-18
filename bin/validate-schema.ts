#!/usr/bin/env ts-node-transpile-only

import Ajv from "ajv";
import addFormats from "ajv-formats";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parseArgv } from "./utils";

const [, {}] = parseArgv(__filename, [], []);

const ajv = new Ajv({ strict: true });

addFormats(ajv);
ajv.addKeyword("tsAdditionalProperties");

const schema = JSON.parse(
  readFileSync(resolve(__dirname, "../payload-schemas/schema.json"), "utf-8")
);

// if this is invalid, an error will be thrown
ajv.compile(schema);
