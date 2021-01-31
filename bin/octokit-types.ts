#!/usr/bin/env ts-node-transpile-only

import { strict as assert } from "assert";
import { promises as fs } from "fs";
import { JSONSchema4, JSONSchema7 } from "json-schema";
import { compile } from "json-schema-to-typescript";
import { format } from "prettier";
import { guessAtInterfaceName, isJsonSchemaObject, parseArgv } from "./utils";

parseArgv(__filename, []);

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
    const interfaceName = guessAtInterfaceName({ $id: `${eventName}_event` });

    return `"${eventName}": ${interfaceName}`;
  });

  return ["export interface EventPayloadMap {", ...properties, "}"].join("\n");
};

const getSchema = async () =>
  JSON.parse(await fs.readFile("./schema.json", "utf-8")) as Schema;

declare module "json-schema" {
  interface JSONSchema7 {
    tsAdditionalProperties?: JSONSchema7["additionalProperties"];
  }
}

const compileSchema = async (): Promise<string> => {
  // has to be 4 due to https://github.com/bcherny/json-schema-to-typescript/issues/359
  const schema: JSONSchema4 = JSON.parse(
    await fs.readFile("./schema.json", "utf-8"),
    (key, value: unknown) => {
      if (isJsonSchemaObject(value) && "tsAdditionalProperties" in value) {
        value.additionalProperties = value.tsAdditionalProperties;
      }

      return value;
    }
  ) as JSONSchema4;

  return compile(schema, "Schema", { format: false });
};

const run = async () => {
  const schema = await getSchema();

  const ts = [
    await compileSchema(),
    buildEventPayloadMap(schema),
    "",
    "export type Asset = ReleaseAsset;",
    "export type WebhookEvent = Schema;",
    "export type WebhookEventMap = EventPayloadMap;",
    "export type WebhookEventName = keyof EventPayloadMap;",
  ].join("\n");

  await fs.writeFile("./schema.d.ts", format(ts, { parser: "typescript" }));
};

run();
