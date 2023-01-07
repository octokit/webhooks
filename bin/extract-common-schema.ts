#!/usr/bin/env ts-node-transpile-only

import { strict as assert } from "assert";
import fs from "fs";
import { JSONSchema7 } from "json-schema";
import { format } from "prettier";
import {
  getSchemaFromPath,
  loadMapOfSchemas,
  parseArgv,
  pathToSchemas,
} from "./utils";

const [
  [interfacePropertyPath, interfaceName],
  { overwrite: overwriteIfExists },
] = parseArgv(
  __filename,
  [
    "first argument must be path to a property on an interface to extract into a common schema",
    "second argument must be name of the interface the new common schema should generate",
  ],
  ["overwrite"]
);

const RequiredSchemaProperties = [
  "$id",
  "title",
  "$schema",
  "type",
  "required",
  "properties",
  "additionalProperties",
] as const;

type CommonSchema = Required<
  Pick<JSONSchema7, (typeof RequiredSchemaProperties)[number]>
> &
  JSONSchema7;

function assertHasRequiredProperties(
  schema: JSONSchema7
): asserts schema is CommonSchema {
  const missingProperties = RequiredSchemaProperties.filter(
    (property) => schema[property] === undefined
  ).join(", ");

  assert.ok(
    missingProperties.length === 0,
    `schema is missing the following required properties: ${missingProperties}`
  );
}

const writeNewCommonSchema = (name: string, schema: JSONSchema7) => {
  const pathToSchema = `${pathToSchemas}/common/${name}.schema.json`;

  assertHasRequiredProperties(schema);

  fs.writeFileSync(
    pathToSchema,
    format(
      JSON.stringify(schema, (key, value: unknown) => {
        if (
          key === "$ref" &&
          typeof value === "string" &&
          value.startsWith("common/") &&
          value.endsWith(".schema.json")
        ) {
          return value.substring("common/".length);
        }

        return value;
      }),
      { parser: "json" }
    ),
    { flag: overwriteIfExists ? "w" : "wx" }
  );
};

const schemas = loadMapOfSchemas();
const rawSchema = getSchemaFromPath(interfacePropertyPath, schemas);

if (
  rawSchema.$ref ||
  rawSchema.oneOf?.some((object) => typeof object !== "boolean" && object.$ref)
) {
  throw new Error("schema is already a ref");
}

const fileName = interfaceName.replace(/(?!^)([A-Z])/gu, "-$1").toLowerCase();
const title = interfaceName.replace(/(?!^)([A-Z])/gu, " $1");

const commonSchema: CommonSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  $id: `common/${fileName}.schema.json`,
  required: [],
  type: "object",
  properties: {},
  additionalProperties: false,
  ...rawSchema,
  title,
};

if (Array.isArray(commonSchema.type) && commonSchema.type.includes("null")) {
  commonSchema.type = commonSchema.type.filter((type) => type !== "null");

  if (commonSchema.type.length === 1) {
    commonSchema.type = commonSchema.type[0];
  }
}

writeNewCommonSchema(fileName, commonSchema);

console.log(`wrote extracted schema to ${fileName}`);
