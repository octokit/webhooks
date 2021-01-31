#!/usr/bin/env ts-node-transpile-only

import { strict as assert } from "assert";
import fs from "fs";
import {
  JSONSchema7,
  JSONSchema7Definition,
  JSONSchema7TypeName,
} from "json-schema";
import { format } from "prettier";
import {
  pathToSchemas,
  ensureArray,
  isJsonSchemaObject,
  forEachJsonFile,
  parseArgv,
} from "./utils";

parseArgv(__filename, []);

const JSONSchema7TypeNameOrder = [
  "string",
  "number",
  "integer",
  "boolean",
  "object",
  "array",
  "null",
] as const;

const standardizeTypeProperty = (
  types: JSONSchema7TypeName[]
): JSONSchema7TypeName | JSONSchema7TypeName[] => {
  if (types.length === 1) {
    return types[0];
  }

  return JSONSchema7TypeNameOrder.filter((type) => types.includes(type));
};

const isNullType = (
  object: JSONSchema7Definition
): object is { type: "null" | ["null"] } & JSONSchema7 => {
  if (typeof object === "boolean") {
    return false;
  }

  if (Array.isArray(object.type)) {
    return object.type.length === 1 && object.type[0] === "null";
  }

  return object.type === "null";
};

const addNullToObject = (object: JSONSchema7) => {
  assert.ok(object.type, `object schema is missing type`);

  object.type = ensureArray(object.type).concat("null");

  if (object.const) {
    object.enum = [object.const];

    delete object.const;
  }

  if (object.enum) {
    object.enum.push(null);
  }
};

forEachJsonFile(pathToSchemas, (pathToSchema) => {
  const contents = JSON.parse(fs.readFileSync(pathToSchema, "utf-8"));

  fs.writeFileSync(
    pathToSchema,
    format(
      JSON.stringify(contents, (key, value: unknown | JSONSchema7) => {
        if (!isJsonSchemaObject(value)) {
          return value;
        }

        if (value.type) {
          if (Array.isArray(value.type)) {
            value.type = standardizeTypeProperty(value.type);
          }

          if (
            ensureArray(value.type).includes("object") &&
            !("tsAdditionalProperties" in value)
          ) {
            value.additionalProperties ||= false;
          }
        }

        if (value.anyOf) {
          assert.ok(!value.oneOf, "object has both oneOf & anyOf");

          // we don't have any use for anyOf, while oneOf is stricter
          value.oneOf = value.anyOf;
          delete value.anyOf;
        }

        if (value.oneOf) {
          // { "type": "null" } & { ... } can be combined as "type" supports an array
          if (value.oneOf.some(isNullType)) {
            const [notNullType] = value.oneOf.filter(
              (object) => !isNullType(object)
            );

            assert.ok(
              typeof notNullType !== "boolean",
              "unexpected boolean in oneOf"
            );

            if (!notNullType.$ref && !notNullType.allOf) {
              addNullToObject(notNullType);

              return notNullType;
            }
          }

          // "oneOf" is redundant if it's only got one schema
          if (value.oneOf.length === 1) {
            return value.oneOf[0];
          }
        }

        return value;
      }),
      { parser: "json" }
    )
  );
});
