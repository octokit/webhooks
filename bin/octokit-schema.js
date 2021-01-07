const { strict: assert } = require("assert");
const fs = require("fs");
const path = require("path");
const prettier = require("prettier");
const $RefParser = require("@apidevtools/json-schema-ref-parser");

const pathToWebhookSchemas = "payload-schemas/schemas";

const removeExtension = (fileName, ext) => {
  assert.ok(fileName.endsWith(ext), `"${fileName}" does not end with "${ext}"`);

  return fileName.substring(0, fileName.length - ext.length);
};

const buildCommonSchemasDefinitionSchema = () => {
  const commonSchemas = fs.readdirSync(`${pathToWebhookSchemas}/common`);
  const definitions = {};

  commonSchemas.forEach((schema) => {
    definitions[removeExtension(schema, ".schema.json")] = {
      $ref: `${pathToWebhookSchemas}/common/${schema}`,
    };
  });

  return definitions;
};

const listEvents = () => {
  const directoryEntities = fs.readdirSync(pathToWebhookSchemas, {
    withFileTypes: true,
  });

  return directoryEntities
    .filter((entity) => entity.isDirectory() && entity.name !== "common")
    .map((entity) => entity.name);
};

const combineEventSchemas = () => {
  const eventSchema = {
    $id: "webhooks",
    $schema: "http://json-schema.org/draft-07/schema#",
    definitions: {},
    oneOf: [],
  };

  const events = listEvents();

  events.forEach((event) => {
    const schemas = fs.readdirSync(`${pathToWebhookSchemas}/${event}`);
    const eventName = `${event}_event`;

    if (schemas.length === 1 && schemas[0] === "event.schema.json") {
      // schemas without any actions are just called "event"
      const schema = require(`../${pathToWebhookSchemas}/${event}/event.schema.json`);
      const eventName = schema.$id;

      eventSchema.definitions = {
        ...eventSchema.definitions,
        ...schema.definitions,
        [eventName]: schema,
      };

      delete schema.definitions;

      eventSchema.oneOf.push({ $ref: `#/definitions/${eventName}` });

      return eventSchema;
    }

    const eventActions = schemas.map((schemaName) => {
      const schema = require(`../${pathToWebhookSchemas}/${event}/${schemaName}`);
      const actionEventName = schema.$id;

      eventSchema.definitions = {
        ...eventSchema.definitions,
        ...schema.definitions,
        [actionEventName]: schema,
      };

      delete schema.definitions;

      return actionEventName;
    });

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
    const schema = combineEventSchemas();
    const commonSchemaDefinitions = await $RefParser.dereference(
      buildCommonSchemasDefinitionSchema()
    );

    schema.definitions = {
      ...schema.definitions,
      ...commonSchemaDefinitions,
    };

    fs.writeFileSync(
      "schema.json",
      prettier.format(
        JSON.stringify(schema, (key, value) => {
          if (
            typeof value === "string" &&
            value.startsWith("common/") &&
            value.endsWith(".schema.json")
          ) {
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
