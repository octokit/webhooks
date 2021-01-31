#!/usr/bin/env ts-node-transpile-only

import deepEqual from "fast-deep-equal";
import fs from "fs";
import { JSONSchema7 } from "json-schema";
import { format } from "prettier";
import {
  ensureArray,
  forEachJsonFile,
  normalizeSchema,
  parseArgv,
  pathToSchemas,
} from "./utils";

parseArgv(__filename, []);

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

forEachJsonFile(pathToSchemas, (filePath) => {
  if (filePath.includes("/common/")) {
    return;
  }

  const schema = JSON.parse(fs.readFileSync(filePath, "utf-8")) as JSONSchema7;

  fs.writeFileSync(
    filePath,
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

console.log(
  `replaced ${count} ${count === 1 ? "property" : "properties"} with $ref`
);
