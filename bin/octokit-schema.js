const fs = require("fs");
const prettier = require("prettier");
const $RefParser = require("@apidevtools/json-schema-ref-parser");

async function run() {
  try {
    const index = require("../payload-schemas/schemas/index.json");
    let schema = await $RefParser.dereference(index);
    fs.writeFileSync(
      "schema.json",
      prettier.format(JSON.stringify(schema), { parser: "json" })
    );
  } catch (err) {
    console.error(err);
  }
}

run();
