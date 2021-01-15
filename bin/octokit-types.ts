#!/usr/bin/env ts-node-transpile-only

import { strict as assert } from "assert";
import { promises as fs } from "fs";
import { JSONSchema7 } from "json-schema";
import { compileFromFile } from "json-schema-to-typescript";
import { format } from "prettier";

const titleCase = (str: string) => `${str[0].toUpperCase()}${str.substring(1)}`;

const guessAtInterfaceName = (str: string) =>
  str.split("_").map(titleCase).join("");

const getEventName = (ref: string): string => {
  assert.ok(
    ref.startsWith("#/definitions/"),
    `${ref} does not point to definitions`
  );

  assert.ok(
    ref.endsWith("event"),
    `${ref} does not point to an event definition`
  );

  const [, eventName] = /^#\/definitions\/(.+)[$_]event$/u.exec(ref) ?? [];

  assert.ok(eventName, `unable to find an event name from ${ref}`);

  return eventName;
};

interface Schema extends JSONSchema7 {
  oneOf: Array<JSONSchema7 & Required<Pick<JSONSchema7, "$ref">>>;
}

const buildEventPayloadMap = (schema: Schema): string => {
  const properties = schema.oneOf.map(({ $ref }) => {
    const eventName = getEventName($ref);
    const interfaceName = guessAtInterfaceName(`${eventName}_event`);

    return `"${eventName}": ${interfaceName}`;
  });

  return ["export interface EventPayloadMap {", ...properties, "}"].join("\n");
};

const getSchema = async () =>
  JSON.parse(await fs.readFile("./schema.json", "utf-8")) as Schema;

const run = async () => {
  const schema = await getSchema();

  const ts = [
    await compileFromFile("./schema.json", { format: false }),
    buildEventPayloadMap(schema),
    "export type WebhookEvent = Schema;",
  ].join("\n\n");

  await fs.writeFile("./schema.d.ts", format(ts, { parser: "typescript" }));
};

run();
