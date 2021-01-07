const Ajv = require("ajv").default;
const { readdirSync } = require("fs");
const { resolve } = require("path");
const ajv = new Ajv();

const schemaDir = resolve(__dirname, "schemas");

const requireSchema = (event, filename, keyName = `${event}/${filename}`) => {
  const schemaPath = `${schemaDir}/${event}/${filename}`;

  ajv.addSchema(require(schemaPath), keyName);

  return keyName;
};

readdirSync(`${schemaDir}/common`).forEach((filename) =>
  requireSchema("common", filename)
);
readdirSync(schemaDir)
  .filter((dir) => dir !== "common")
  .forEach((eventName) => {
    const addedSchemas = readdirSync(
      `${schemaDir}/${eventName}`
    ).map((filename) => requireSchema(eventName, filename));

    ajv.addSchema(
      {
        oneOf: addedSchemas.map((schema) => ({ $ref: schema })),
      },
      eventName
    );
  });

module.exports = {
  ajv,
  validate: function (schema, file) {
    return ajv.validate(schema, file);
  },
};
