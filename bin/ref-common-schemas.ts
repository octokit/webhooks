#!/usr/bin/env ts-node-transpile-only

import deepEqual from "fast-deep-equal";
import fs from "fs";
import { JSONSchema7 } from "json-schema";
import { format } from "prettier";

const pathToSchemas = "payload-schemas/schemas";

const metaProperties = [
  "$schema", //
  "$id",
  "title",
  "description",
];

const cloneObject = <TObject extends object>(object: TObject): TObject =>
  JSON.parse(JSON.stringify(object)) as TObject;

const isJsonSchemaObject = (object: unknown): object is JSONSchema7 =>
  typeof object === "object" && object !== null && !Array.isArray(object);

const ensureArray = <T>(arr: T | T[]): T[] =>
  Array.isArray(arr) ? arr : [arr];

const normalizeSchema = (schema: JSONSchema7): JSONSchema7 => {
  try {
    return JSON.parse(
      JSON.stringify(cloneObject(schema), (key, value: unknown) => {
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

        if (key === "type") {
          return ensureArray(value);
        }

        if (Array.isArray(value)) {
          return [...value].sort();
        }

        if (isJsonSchemaObject(value)) {
          if (value.const !== undefined) {
            value.enum = [value.const];
          }
        }

        return value;
      })
    ) as JSONSchema7;
  } catch (error) {
    console.log(schema);

    throw error;
  }
};

const commonSchemas = fs
  .readdirSync(`${pathToSchemas}/common`)
  .map<[name: string, schema: JSONSchema7]>((commonSchema) => [
    commonSchema,
    normalizeSchema(
      require(`../${pathToSchemas}/common/${commonSchema}`) as JSONSchema7
    ),
  ]);

const findCommonSchema = (object: JSONSchema7) => {
  const normalisedSchema = normalizeSchema(object);

  const [schema] = commonSchemas.find(([, commonSchema]) =>
    deepEqual(commonSchema, normalisedSchema)
  ) ?? [null];

  return schema;
};

const splitIntoObjectAndNull = (
  object: Readonly<JSONSchema7>
): [JSONSchema7, { type: "null" } | null] => {
  // if the object cannot be null, just return the object
  if (!ensureArray(object.type).includes("null")) {
    return [object, null];
  }

  const newObject = { ...object };

  if (Array.isArray(newObject.type)) {
    newObject.type = newObject.type.filter((type) => type !== "null");
  }

  if (newObject.enum) {
    newObject.enum = newObject.enum.filter((v) => v !== null);
  }

  return [newObject, { type: "null" }];
};

let count = 0;

fs.readdirSync(pathToSchemas).forEach((eventName) => {
  if (eventName === "common") {
    return; // "common" is not an event
  }

  fs.readdirSync(`${pathToSchemas}/${eventName}`).forEach((file) => {
    const schema = JSON.parse(
      fs.readFileSync(`${pathToSchemas}/${eventName}/${file}`, "utf-8")
    ) as JSONSchema7;

    fs.writeFileSync(
      `${pathToSchemas}/${eventName}/${file}`,
      format(
        JSON.stringify(schema, (key, value) => {
          if (typeof value === "object" && value !== null) {
            const [object, nullType] = splitIntoObjectAndNull(value);

            const commonSchema = findCommonSchema(object);

            if (commonSchema) {
              const commonRef = { $ref: `common/${commonSchema}` };

              if (nullType) {
                return { oneOf: [commonRef, nullType] };
              }

              count += 1;

              return commonRef;
            }
          }

          return value;
        }),
        { parser: "json" }
      )
    );
  });
});

console.log(
  `replaced ${count} ${count === 1 ? "property" : "properties"} with $ref`
);
