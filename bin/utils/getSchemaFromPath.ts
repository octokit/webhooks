import { strict as assert } from "assert";
import { JSONSchema7 } from "json-schema";
import { ensureArray } from ".";

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

export const getSchemaFromPath = (
  interfacePropertyPath: string,
  schemas: Record<string, JSONSchema7>
): JSONSchema7 =>
  interfacePropertyPath
    .split(".")
    .reduce<JSONSchema7>(
      (schema, segment) => extractFromSchema(schema, segment),
      { type: "object", properties: schemas }
    );
