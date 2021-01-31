#!/usr/bin/env ts-node-transpile-only

import { diffString } from "json-diff";
import { JSONSchema7 } from "json-schema";
import {
  getSchemaFromPath,
  loadMapOfSchemas,
  normalizeSchema,
  parseArgv,
} from "./utils";

const [
  [interfacePropertyPath1, interfacePropertyPath2],
  { full: skipNormalizingSchema },
] = parseArgv(
  __filename,
  [
    "first argument must be path to a property on an interface to compare the schema of",
    "second argument must be path to a property on an interface to compare the schema of",
  ],
  ["full"]
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
