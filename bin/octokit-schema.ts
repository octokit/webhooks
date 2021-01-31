#!/usr/bin/env ts-node-transpile-only

import { strict as assert } from "assert";
import fs from "fs";
import { JSONSchema7 } from "json-schema";
import path from "path";
import { format } from "prettier";
import { parseArgv, pathToSchemas } from "./utils";

parseArgv(__filename, []);

const removeExtension = (fileName: string, ext: string): string => {
  assert.ok(fileName.endsWith(ext), `"${fileName}" does not end with "${ext}"`);

  return fileName.substring(0, fileName.length - ext.length);
};

const buildCommonSchemasDefinitionSchema = (): Record<string, JSONSchema7> => {
  const commonSchemas = fs.readdirSync(`${pathToSchemas}/common`);
  const definitions: Record<string, JSONSchema7> = {};

  commonSchemas.forEach((schema) => {
    definitions[
      removeExtension(schema, ".schema.json")
    ] = require(`../${pathToSchemas}/common/${schema}`);
  });

  return definitions;
};

const listEvents = () => {
  const directoryEntities = fs.readdirSync(pathToSchemas, {
    withFileTypes: true,
  });

  return directoryEntities
    .filter((entity) => entity.isDirectory() && entity.name !== "common")
    .map((entity) => entity.name);
};

type EventSchema = JSONSchema7 &
  Required<Pick<JSONSchema7, "$id" | "oneOf" | "definitions">>;

const combineEventSchemas = () => {
  const eventSchema: EventSchema = {
    $id: "webhooks",
    $schema: "http://json-schema.org/draft-07/schema#",
    definitions: {},
    oneOf: [],
  };

  const events = listEvents();

  events.forEach((event) => {
    const schemas = fs.readdirSync(`${pathToSchemas}/${event}`);

    if (schemas.length === 1 && schemas[0] === "event.schema.json") {
      // schemas without any actions are just called "event"
      const schema = require(`../${pathToSchemas}/${event}/event.schema.json`) as JSONSchema7;
      const eventName = schema.$id;

      assert.ok(eventName, `${event}/event.schema.json does not have an $id`);

      eventSchema.definitions = {
        ...eventSchema.definitions,
        ...schema.definitions,
        [eventName]: schema,
      };

      delete schema.definitions;

      eventSchema.oneOf.push({ $ref: `#/definitions/${eventName}` });

      return;
    }

    const eventActions = schemas.map((schemaName) => {
      const schema = require(`../${pathToSchemas}/${event}/${schemaName}`) as JSONSchema7;
      const actionEventName = schema.$id;

      assert.ok(actionEventName, `${event}/${schemaName} does not have an $id`);

      eventSchema.definitions = {
        ...eventSchema.definitions,
        ...schema.definitions,
        [actionEventName]: schema,
      };

      delete schema.definitions;

      return actionEventName;
    });

    const eventName = `${event}_event`;

    eventSchema.definitions = {
      ...eventSchema.definitions,
      [eventName]: {
        oneOf: eventActions.map((eventAction) => ({
          $ref: `#/definitions/${eventAction}`,
        })),
      },
    };

    eventSchema.oneOf.push({ $ref: `#/definitions/${eventName}` });
  });

  return eventSchema;
};

async function run() {
  try {
    const schema: EventSchema = combineEventSchemas();
    const commonSchemaDefinitions = buildCommonSchemasDefinitionSchema() as Record<
      string,
      JSONSchema7
    >;

    schema.definitions = {
      ...schema.definitions,
      ...commonSchemaDefinitions,
    };

    fs.writeFileSync(
      "schema.json",
      format(
        JSON.stringify(schema, (key, value: unknown) => {
          if (typeof value === "string" && value.endsWith(".schema.json")) {
            const { base } = path.parse(value);

            return `#/definitions/${removeExtension(base, ".schema.json")}`;
          }

          return value;
        }),
        { parser: "json" }
      )
    );
  } catch (err) {
    console.error(err);
  }
}

run();
