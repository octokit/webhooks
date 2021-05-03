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
  OpenApiInfo,
  OpenApiPaths,
  OpenApiRequestBody
} from "@tstypes/openapi-v3";
import yaml from "yaml";

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
    definitions[removeExtension(schemaName, ".schema.json")] = schema;
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

// In OpenApi 3.1 you do not need a `paths` property anymore, so we omit it and re-add it as optional
type EventSchema = Omit<OpenApi, 'paths'> & {
  paths?: OpenApiPaths;
  components: {
    schemas: OpenApiMap<OpenApiSchema | OpenApiReference>;
    requestBodies: OpenApiMap<OpenApiRequestBody | OpenApiReference>
  }
  webhooks: OpenApiMap<OpenApiReference | OpenApiPath>;
};

const combineEventSchemas = () => {
  const eventSchema: EventSchema = {
    openapi: "3.1.0",
    info: {
      title: "webhooks",
      version: "1.0.0",
      license: {
        name: "MIT",
        url: "https://spdx.org/licenses/MIT"
      },
    },
    components: {
      schemas: {},
      requestBodies: {}
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
        },
        requestBodies: {
          ...eventSchema.components.requestBodies,
          [eventName]: {
            content: {
              "application/json": {schema}
            },
          }
        }
      };

      delete schema.definitions;
      delete schema.$schema;

      eventSchema.webhooks[event] = {
        post: {
          requestBody: {
            content: {
              "application/json": {
                schema: { $ref: `#/components/requestBodies/${eventName}` },
              },
            },
          },
          responses: {
            "200": { description: "foo" },
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
        },
        requestBodies: {
          ...eventSchema.components.requestBodies,
          [actionEventName]: {
            content: {
              "application/json": { schema },
            }
          },
        }
      };

      delete schema.definitions;
      delete schema.$schema;

      return actionEventName;
    });

    const eventName = `${event}_event`;

    eventSchema.components = {
      schemas: {
        ...eventSchema.components.schemas,
      },
      requestBodies: {
        ...eventSchema.components.requestBodies,
        [eventName]: {
          content: {
            'application/json': {
              schema: {
                oneOf: eventActions.map((eventAction) => ({
                  $ref: `#/components/requestBodies/${eventAction}`,
                })),
                discriminator: {
                  propertyName: "action",
                },
              },
            },
          },
        },
      },
    };

    eventSchema.webhooks[event] = {
      post: {
        requestBody: {
          $ref: `#/components/requestBodies/${eventName}`
        },
        responses: {
          "200": { description: "foo" },
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
      },
      requestBodies: {
        ...schema.components.requestBodies
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

            return `#/components/schemas/${removeExtension(
              base,
              ".schema.json"
            )}`;
          }

          return value;
        }),
        { parser: "json" }
      )
    );
    const yamlDoc = new yaml.Document();
    yamlDoc.contents = JSON.parse(fs.readFileSync("./payload-schemas/openapi-schema.json").toString());
    fs.writeFileSync('./payload-schemas/openapi-schema.yml', format(yaml.stringify(yamlDoc), { parser: 'yaml' }))
  } catch (err) {
    console.error(err);
  }
}

run();
