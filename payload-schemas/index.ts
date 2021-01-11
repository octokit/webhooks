import Ajv from "ajv";
import { readdirSync } from "fs";
import { resolve } from "path";

export const ajv = new Ajv();

const schemaDir = resolve(__dirname, "schemas");

const requireSchema = (
  event: string,
  filename: string,
  keyName = `${event}/${filename}`
) => {
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

export const validate = (schema: string, file: unknown): boolean =>
  ajv.validate(schema, file);
