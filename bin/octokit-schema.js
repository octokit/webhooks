const fs = require("fs");
const $RefParser = require("@apidevtools/json-schema-ref-parser");

async function run() {
  try {
    const index = require("../payload-schemas/schemas/index.json");
    let schema = await $RefParser.dereference(index);
    fs.writeFileSync("index.schema.json", JSON.stringify(schema));
  } catch (err) {
    console.error(err);
  }
}

run();
