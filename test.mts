import Ajv, { ErrorObject } from "ajv";
import { readFileSync } from "fs";
import { JSONSchema7 } from "json-schema";

const webhooks = JSON.parse(readFileSync(new URL("./payload-examples/api.github.com/index.json", import.meta.url)).toString());
const ajv = new Ajv.default();

const schema: JSONSchema7 = {
  type: "object",
  required: ["name", "description", "actions", "examples"],
  properties: {
    name: {
      type: "string",
    },
    description: {
      type: "string",
    },
    actions: {
      type: "array",
      items: { type: "string" },
    },
    examples: {
      type: "array",
      items: { type: "object" },
    },
  },
};

interface WebhookError {
  webhookName: string;
  errors: ErrorObject[];
}

const errors: WebhookError[] = [];

webhooks.forEach((webhook) => {
  const valid = ajv.validate(schema, webhook);

  if (!valid) {
    errors.push({
      webhookName: webhook.name,
      errors: ajv.errors ?? [],
    });
  }
});

if (errors.length) {
  console.log(JSON.stringify(errors, null, 2));
  process.exit(1);
}
