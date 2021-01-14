#!/usr/bin/env ts-node-transpile-only

import { strict as assert } from "assert";
import fs from "fs";
import {
  JSONSchema7,
  JSONSchema7Definition,
  JSONSchema7TypeName,
} from "json-schema";
import { format } from "prettier";

const payloads = "payload-schemas/schemas";

const isJustType = (
  object: JSONSchema7Definition
): object is Pick<Required<JSONSchema7>, "type"> => {
  if (typeof object === "boolean") {
    return false;
  }

  return Object.keys(object).length === 1 && object.type !== undefined;
};

const ensureArray = <T>(arr: T | T[]): T[] =>
  Array.isArray(arr) ? arr : [arr];

const isJsonSchemaObject = (object: unknown): object is JSONSchema7 =>
  typeof object === "object" && object !== null && !Array.isArray(object);

const mergeSimpleTypes = (
  objects: JSONSchema7Definition[]
): JSONSchema7Definition[] => {
  const simpleTypes = new Set<JSONSchema7TypeName>();

  return objects
    .filter((object) => {
      if (isJustType(object)) {
        ensureArray(object.type).forEach((type) => simpleTypes.add(type));

        return false;
      }

      return true;
    })
    .concat({ type: Array.from(simpleTypes) });
};

fs.readdirSync(payloads).forEach((event) => {
  fs.readdirSync(`${payloads}/${event}`).forEach((schema) => {
    const pathToSchema = `${payloads}/${event}/${schema}`;
    const contents = JSON.parse(fs.readFileSync(pathToSchema, "utf-8"));

    fs.writeFileSync(
      pathToSchema,
      format(
        JSON.stringify(contents, (key, value: unknown | JSONSchema7) => {
          if (!isJsonSchemaObject(value)) {
            return value;
          }

          if (value.anyOf) {
            assert.ok(!value.oneOf, "object has both oneOf & anyOf");

            // we don't have any use for anyOf, while oneOf is stricter
            value.oneOf = value.anyOf;
            delete value.anyOf;
          }

          if (value.oneOf) {
            value.oneOf = mergeSimpleTypes(value.oneOf);

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
});
