const Ajv = require('ajv');
const { readdirSync, lstatSync } = require('fs');
const { resolve } = require('path');
const ajv = new Ajv();

const commonSchemaDir = './payload-schemas/schemas/common';
const schemaDir = './payload-schemas/schemas';

function requireSchema(dir, filename) {
  const filepath = resolve(dir, filename);
  if (lstatSync(filepath).isFile()) {
    ajv.addSchema(require(filepath));
  }
}

readdirSync(commonSchemaDir).forEach((filename) => requireSchema(commonSchemaDir, filename));
readdirSync(schemaDir).forEach((filename) => requireSchema(schemaDir, filename));

module.exports = function (schema, file) {
  return ajv.validate(schema, file);
};
