import { JSONSchema7 } from "json-schema";
import { ensureArray, isJsonSchemaObject } from ".";

const metaProperties = [
  "$schema", //
  "$id",
  "title",
  "description",
  "default",
  "format",
];

export const normalizeSchema = (schema: JSONSchema7): JSONSchema7 => {
  try {
    return JSON.parse(JSON.stringify(schema), (key, value: unknown) => {
      if (metaProperties.includes(key)) {
        return undefined;
      }

      if (
        key === "$ref" &&
        typeof value === "string" &&
        !value.startsWith("common/") &&
        value.endsWith(".schema.json")
      ) {
        return `common/${value}`;
      }

      if (Array.isArray(value)) {
        return [...value].sort();
      }

      if (isJsonSchemaObject(value)) {
        if (value.type) {
          value.type = ensureArray(value.type);
        }

        if (value.const !== undefined) {
          value.enum = [value.const];
        }
      }

      return value;
    }) as JSONSchema7;
  } catch (error) {
    console.log(schema);

    throw error;
  }
};
