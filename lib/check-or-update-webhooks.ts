import { writeFileSync, readFileSync } from "fs";
import { diff, diffString } from "json-diff";
import prettier from "prettier";
import {
  State,
  WorkableWebhook,
  applyWorkarounds,
  getActionsAndExamplesFromPayloads,
  getHtml,
  getSections,
  toWebhook,
} from ".";

const isNotNull = <T>(value: T | null): value is T => value !== null;

export const checkOrUpdateWebhooks = async ({
  cached,
  checkOnly,
  version,
}: State): Promise<void> => {
  const currentWebhooks = JSON.parse(
    readFileSync(`./payload-examples/${version}/index.json`).toString()
  );
  const html = await getHtml({ cached, version });
  const sections = getSections(html);
  const webhooksFromScrapingDocs = sections.map(toWebhook).filter(isNotNull);
  const webhooksFromPayloadExamplesByName = getActionsAndExamplesFromPayloads(
    version
  );

  const webhooks = webhooksFromScrapingDocs.map((webhook) => {
    const name = webhook.name;

    if (!(name in webhooksFromPayloadExamplesByName)) {
      console.warn(`[${version}] No payload examples for ${name}`);

      return webhook;
    }

    const webhookFromPayloadExamples = webhooksFromPayloadExamplesByName[name];

    return {
      name,
      description: webhook.description,
      actions: Array.from(
        new Set(webhook.actions.concat(webhookFromPayloadExamples.actions))
      ),
      properties: webhook.properties,
      examples: webhook.examples.concat(webhookFromPayloadExamples.examples),
    };
  });

  applyWorkarounds(webhooks as WorkableWebhook[]);

  if (!diff(currentWebhooks, webhooks)) {
    console.log(`✅  webhooks ${version} are up-to-date`);

    return;
  }

  console.log(`❌  webhooks ${version} are not up-to-date`);
  console.log(diffString(currentWebhooks, webhooks));

  if (checkOnly) {
    process.exitCode = 1;

    return;
  }

  writeFileSync(
    `./payload-examples/${version}/index.json`,
    prettier.format(JSON.stringify(webhooks, null, 2), { parser: "json" })
  );
  console.log(`✏️  ${version}/index.json, written`);
};
