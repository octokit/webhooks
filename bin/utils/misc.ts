import { strict as assert } from "assert";
import { JSONSchema7 } from "json-schema";

export const capitalize = (str: string) =>
  `${str[0].toUpperCase()}${str.substring(1)}`;

export const guessAtInterfaceName = (schema: JSONSchema7): string => {
  const str = schema.title || schema.$id;

  assert.ok(str, "unable to guess interface name");

  return str
    .split(/[$_ -]/u)
    .map(capitalize)
    .join("");
};

export const ensureArray = <T>(arr: T | T[]): T[] =>
  Array.isArray(arr) ? arr : [arr];

export const isJsonSchemaObject = (object: unknown): object is JSONSchema7 =>
  typeof object === "object" && object !== null && !Array.isArray(object);
