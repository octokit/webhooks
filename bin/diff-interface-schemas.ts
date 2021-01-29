#!/usr/bin/env ts-node-transpile-only

import { strict as assert } from "assert";
import fs from "fs";
import { diffString } from "json-diff";
import { JSONSchema7 } from "json-schema";

const pathToSchemas = "payload-schemas/schemas";

const metaProperties = [
  "$schema", //
  "$id",
  "title",
  "description",
  "format",
];

const parseArgv = (argv: string[]): [args: string[], flags: string[]] => {
  const flags: string[] = [];
  const args: string[] = [];

  argv.forEach((arg) => {
    arg.startsWith("--") ? flags.push(arg) : args.push(arg);
  });

  return [args, flags];
};

const [[interfacePropertyPath1, interfacePropertyPath2], flags] = parseArgv(
  process.argv.slice(2)
);

const skipNormalizingSchema = flags.includes("--full");

assert.ok(
  interfacePropertyPath1,
  "first argument must be path to a property on an interface to compare the schema of"
);

assert.ok(
  interfacePropertyPath2,
  "second argument must be path to a property on an interface to compare the schema of"
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

const cloneObject = <TObject extends object>(object: TObject): TObject =>
  JSON.parse(JSON.stringify(object)) as TObject;

const isJsonSchemaObject = (object: unknown): object is JSONSchema7 =>
  typeof object === "object" && object !== null && !Array.isArray(object);

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
      })
    ) as JSONSchema7;
  } catch (error) {
    console.log(schema);

    throw error;
  }
};

const schemas = Object.fromEntries(loadSchemas(pathToSchemas));

const getSchemaFromPath = (interfacePropertyPath: string) => {
  const schema = interfacePropertyPath
    .split(".")
    .reduce<JSONSchema7>(
      (schema, segment) => extractFromSchema(schema, segment),
      { type: "object", properties: schemas }
    );

  if (skipNormalizingSchema) {
    return schema;
  }

  return normalizeSchema(schema);
};

const firstSchema = getSchemaFromPath(interfacePropertyPath1);
const secondSchema = getSchemaFromPath(interfacePropertyPath2);

console.log(diffString(firstSchema, secondSchema));
