# Octokit Webhooks

> machine-readable, always up-to-date GitHub Webhooks specifications

![Update status](https://github.com/octokit/webhooks/workflows/Update/badge.svg)

## Download

Download the latest specification at
[unpkg.com/@octokit/webhooks-schemas/schema.json](https://unpkg.com/@octokit/webhooks-schemas/schema.json)

## Usage as Node module

To get the JSON schema for webhook payloads, require the `@octokit/webhooks-schemas` package.

```js
// Use Node.js require:
const SCHEMA = require("@octokit/webhooks-schemas");

// Or ESM/TypeScript import:
import SCHEMA from "@octokit/webhooks-schemas";
```

### Usage with `ajv` in `strict` mode

When running in `strict` mode, `ajv` will throw an "unknown keyword" error if it
encounters any keywords that have not been defined.

This schema currently uses custom keywords provided by `ajv-formats`, along with
the custom keyword `tsAdditionalProperties`.

Here is an example of how you can set this up:

```ts
import type { WebhookEvent } from "@octokit/webhooks-types";
import * as githubWebhookSchema from "@octokit/webhooks-schemas";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ strict: true });

addFormats(ajv);
ajv.addKeyword("tsAdditionalProperties");

const validate = ajv.compile<WebhookEvent>(githubWebhookSchema);
```

## See also

- [octokit/graphql-schema](https://github.com/octokit/graphql-schema) – GitHub’s
  GraphQL Schema with validation
- [octokit/openapi](https://github.com/octokit/openapi) – GitHub REST API route
  specifications
- [octokit/app-permissions](https://github.com/octokit/app-permissions) – GitHub
  App permission specifications

## LICENSE

[MIT](LICENSE.md)
