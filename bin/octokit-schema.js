const { strict: assert } = require("assert");
const fs = require("fs");
const path = require("path");
const prettier = require("prettier");
const $RefParser = require("@apidevtools/json-schema-ref-parser");

const removeExtension = (fileName, ext) => {
  assert.ok(fileName.endsWith(ext), `"${fileName}" does not end with "${ext}"`);

  return fileName.substring(0, fileName.length - ext.length);
};

const buildCommonSchemasDefinitionSchema = () => {
  const commonSchemas = fs.readdirSync("payload-schemas/schemas/common");
  const definitions = {};

  commonSchemas.forEach((schema) => {
    definitions[removeExtension(schema, ".schema.json")] = {
      $ref: `payload-schemas/schemas/common/${schema}`,
    };
  });

  return definitions;
};

const combineEventSchemas = () => {
  const eventSchema = {
    $id: "webhooks",
    $schema: "http://json-schema.org/draft-07/schema#",
    definitions: {},
    oneOf: [],
  };

  const schemas = fs
    .readdirSync("payload-schemas/schemas")
    .filter((name) => name !== "common" && name !== "index.json");

  schemas.forEach((schemaName) => {
    const schema = require(`../payload-schemas/schemas/${schemaName}`);
    const eventName = `${removeExtension(schemaName, ".schema.json")}_event`;

    eventSchema.definitions = {
      ...eventSchema.definitions,
      ...schema.definitions,
      [eventName]: schema,
    };

    delete schema.definitions;

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
