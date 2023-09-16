import Ajv from "ajv";
import addFormats from "ajv-formats";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";

export const ajv = new Ajv({
  strict: true,
  strictTypes: true,
  strictTuples: true,
});

addFormats(ajv);

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const schemaDir = resolve(__dirname, "api.github.com");

const requireSchema = (
  event: string,
  filename: string,
  keyName = `${event}/${filename}`,
) => {
  const schemaPath = `${schemaDir}/${event}/${filename}`;

  const schema = JSON.parse(readFileSync(schemaPath, "utf-8").toString());
  ajv.addSchema(schema, keyName);

  return keyName;
};

ajv.addKeyword("tsAdditionalProperties");

readdirSync(`${schemaDir}/common`).forEach((filename) =>
  requireSchema("common", filename),
);
readdirSync(schemaDir, { withFileTypes: true })
  .filter((entity) => entity.isDirectory())
  .map((entity) => entity.name)
  .filter((dir) => dir !== "common")
  .forEach((eventName) => {
    const addedSchemas = readdirSync(`${schemaDir}/${eventName}`).map(
      (filename) => requireSchema(eventName, filename),
    );

    ajv.addSchema(
      {
        oneOf: addedSchemas.map((schema) => ({ $ref: schema })),
      },
      eventName,
    );
  });

export const validate = (schema: string, file: unknown): boolean =>
  ajv.validate(schema, file);
