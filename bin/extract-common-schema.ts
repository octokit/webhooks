#!/usr/bin/env ts-node-transpile-only

import { strict as assert } from "assert";
import fs from "fs";
import { JSONSchema7 } from "json-schema";
import { format } from "prettier";

const pathToSchemas = "payload-schemas/schemas";

const [interfacePropertyPath, interfaceName] = process.argv.slice(2);

assert.ok(
  interfacePropertyPath,
  "first argument must be path to a property on an interface to extract into a common schema"
);
assert.ok(
  interfaceName,
  "second argument must be name of the interface the new common schema should generate"
);

const titleCase = (str: string) => `${str[0].toUpperCase()}${str.substring(1)}`;

const guessAtInterfaceName = (schema: JSONSchema7): string => {
  const str = schema.title || schema.$id;

  assert.ok(str, "unable to guess interface name");

  return str
    .split(/[$_ -]/u)
    .map(titleCase)
    .join("");
};

const ensureArray = <T>(arr: T | T[]): T[] =>
  Array.isArray(arr) ? arr : [arr];

type InterfaceNameAndSchema = [interfaceName: string, schema: JSONSchema7];

const loadSchemas = (directory: string): InterfaceNameAndSchema[] => {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entity) => {
      const pathToEntity = `${directory}/${entity.name}`;

      if (entity.isDirectory()) {
        return loadSchemas(pathToEntity);
      }

      const schema = JSON.parse(
        fs.readFileSync(pathToEntity, "utf-8")
      ) as JSONSchema7;

      return [[guessAtInterfaceName(schema), schema]];
    });
};

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
  Pick<JSONSchema7, typeof RequiredSchemaProperties[number]>
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
    { flag: "wx" }
  );
};

const extractFromSchema = (schema: JSONSchema7, name: string): JSONSchema7 => {
  if (ensureArray(schema.type).includes("object")) {
    assert.ok(
      schema.properties,
      "cannot extract from an object-type schema that lacks properties"
    );

    const value = schema.properties[name];

    assert.ok(typeof value !== "boolean", "this is not what you want");

    return value;
  }

  if (ensureArray(schema.type).includes("array")) {
    assert.ok(schema.items);
  }

  if (schema.oneOf) {
    throw new Error("extracting schemas from unions is not supported");
  }

  throw new Error(
    `schemas can only be extracted from objects or arrays (got ${schema.type})`
  );
};

const schemas = Object.fromEntries(loadSchemas(pathToSchemas));
const segments = interfacePropertyPath.split(".");

const rawSchema = segments.reduce<JSONSchema7>(
  (schema, segment) => extractFromSchema(schema, segment),
  { type: "object", properties: schemas }
);

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
