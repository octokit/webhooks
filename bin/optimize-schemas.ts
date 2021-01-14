#!/usr/bin/env ts-node-transpile-only

import { strict as assert } from "assert";
import fs from "fs";
import { JSONSchema7, JSONSchema7TypeName } from "json-schema";
import { format } from "prettier";

const JSONSchema7TypeNameOrder = [
  "string",
  "number",
  "integer",
  "boolean",
  "object",
  "array",
  "null",
] as const;

const payloads = "payload-schemas/schemas";

const isJsonSchemaObject = (object: unknown): object is JSONSchema7 =>
  typeof object === "object" && object !== null && !Array.isArray(object);

const standardizeTypeProperty = (
  types: JSONSchema7TypeName[]
): JSONSchema7TypeName | JSONSchema7TypeName[] => {
  if (types.length === 1) {
    return types[0];
  }

  return JSONSchema7TypeNameOrder.filter((type) => types.includes(type));
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

          if (value.type && Array.isArray(value.type)) {
            value.type = standardizeTypeProperty(value.type);
          }

          if (value.anyOf) {
            assert.ok(!value.oneOf, "object has both oneOf & anyOf");

            // we don't have any use for anyOf, while oneOf is stricter
            value.oneOf = value.anyOf;
            delete value.anyOf;
          }

          if (value.oneOf) {
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
