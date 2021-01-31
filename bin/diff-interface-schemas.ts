#!/usr/bin/env ts-node-transpile-only

import { strict as assert } from "assert";
import { diffString } from "json-diff";
import { JSONSchema7 } from "json-schema";
import {
  getSchemaFromPath,
  loadMapOfSchemas,
  normalizeSchema,
  parseArgv,
} from "./utils";

const [[interfacePropertyPath1, interfacePropertyPath2], flags] = parseArgv(
  process.argv.slice(2)
);

const skipNormalizingSchema = flags.includes("--full");

assert.ok(
  interfacePropertyPath1,
  "first argument must be path to a property on an interface to compare the schema of"
);

assert.ok(
  interfacePropertyPath2,
  "second argument must be path to a property on an interface to compare the schema of"
);

const schemas = loadMapOfSchemas();

const getSchema = (interfacePath: string): JSONSchema7 => {
  const schema = getSchemaFromPath(interfacePath, schemas);

  if (skipNormalizingSchema) {
    return schema;
  }

  return normalizeSchema(schema);
};

const firstSchema = getSchema(interfacePropertyPath1);
const secondSchema = getSchema(interfacePropertyPath2);

console.log(diffString(firstSchema, secondSchema));
