#!/usr/bin/env ts-node-transpile-only

import { strict as assert } from "assert";
import fs from "fs";
import { JSONSchema7 } from "json-schema";
import path from "path";
import { format } from "prettier";
import { parseArgv, pathToSchemas } from "./utils";
import {
  OpenApi,
  OpenApiSchema,
  OpenApiMap,
  OpenApiReference,
  OpenApiPath,
} from "@tstypes/openapi-v3";

parseArgv(__filename, []);

const removeExtension = (fileName: string, ext: string): string => {
  assert.ok(fileName.endsWith(ext), `"${fileName}" does not end with "${ext}"`);

  return fileName.substring(0, fileName.length - ext.length);
};

const buildCommonSchemasDefinitionSchema = (): Record<string, JSONSchema7> => {
  const commonSchemas = fs.readdirSync(`${pathToSchemas}/common`);
  const definitions: Record<string, JSONSchema7> = {};

  commonSchemas.forEach((schemaName) => {
    const schema = require(`../${pathToSchemas}/common/${schemaName}`);
    delete schema.$schema;
    definitions[
      removeExtension(schemaName, ".schema.json")
    ] = schema;
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

type EventSchema = OpenApi & {
  components: { schemas: OpenApiMap<OpenApiSchema | OpenApiReference> };
  webhooks: Record<string, OpenApiPath>;
};

const combineEventSchemas = () => {
  const eventSchema: EventSchema = {
    openapi: "3.1.0",
    info: {
      title: "webhooks",
      version: "1.0.0",
    },
    components: {
      schemas: {},
    },
    webhooks: {},
  };

  const events = listEvents();

  events.forEach((event) => {
    const schemas = fs.readdirSync(`${pathToSchemas}/${event}`);

    if (schemas.length === 1 && schemas[0] === "event.schema.json") {
      // schemas without any actions are just called "event"
      const schema = require(`../${pathToSchemas}/${event}/event.schema.json`) as JSONSchema7;
      const eventName = schema.$id;

      assert.ok(eventName, `${event}/event.schema.json does not have an $id`);

      eventSchema.components = {
        schemas: {
          ...eventSchema.components.schemas,
          ...(schema.definitions as any),
          [eventName]: schema,
        },
      };

      delete schema.definitions;
      delete schema.$schema;

      eventSchema.webhooks[event] = {
        post: {
          requestBody: {
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${eventName}` },
              },
            },
          },
          responses: {
            "200": { "description": "foo"}
          },
        },
      };

      return;
    }

    const eventActions = schemas.map((schemaName) => {
      const schema = require(`../${pathToSchemas}/${event}/${schemaName}`) as JSONSchema7;
      const actionEventName = schema.$id;

      assert.ok(actionEventName, `${event}/${schemaName} does not have an $id`);

      eventSchema.components = {
        schemas: {
          ...eventSchema.components.schemas,
          ...(schema.definitions as any),
          [actionEventName]: schema,
        },
      };

      delete schema.definitions;
      delete schema.$schema;

      return actionEventName;
    });

    const eventName = `${event}_event`;

    eventSchema.components = {
      schemas: {
        ...eventSchema.components.schemas,
        [eventName]: {
          oneOf: eventActions.map((eventAction) => ({
            $ref: `#/components/schemas/${eventAction}`,
          })),
        },
      },
    };

    eventSchema.webhooks[event] = {
      post: {
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${eventName}` },
            },
          },
        },
        responses: {
          "200": { "description": "foo"}
        },
      },
    };
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

    schema.components = {
      schemas: {
        ...schema.components.schemas,
        ...commonSchemaDefinitions,
      }
    };

    fs.writeFileSync(
      "./payload-schemas/openapi-schema.json",
      format(
        JSON.stringify(schema, (key, value: unknown) => {
          if (key === "$id") {
            return undefined;
          }

          if (typeof value === "string" && value.endsWith(".schema.json")) {
            const { base } = path.parse(value);

            return `#/components/schemas/${removeExtension(base, ".schema.json")}`;
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
