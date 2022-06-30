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
  ghe,
  githubAE,
  updateAll,
}: State): Promise<void> => {
  if (updateAll) {
    await checkOrUpdateWebhooks({
      cached,
      checkOnly,
      ghe: "",
    });
    await checkOrUpdateWebhooks({
      cached,
      checkOnly,
      githubAE: true,
    });
  }

  if (ghe === "") {
    const gheVersions = ["3.1", "3.2", "3.3", "3.4", "3.5"];

    for (let gheVersion of gheVersions) {
      await checkOrUpdateWebhooks({
        cached,
        checkOnly,
        ghe: gheVersion,
      });
    }

    return;
  }

  const [baseUrl, folderName] = ghe
    ? [
        `https://docs.github.com/en/enterprise-server@${ghe}/developers/webhooks-and-events/webhooks/webhook-events-and-payloads`,
        `ghes-${ghe.replace(".", "")}`,
      ]
    : githubAE
    ? [
        "https://docs.github.com/en/github-ae@latest/developers/webhooks-and-events/webhooks/webhook-events-and-payloads",
        "github.ae",
      ]
    : [
        "https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/webhooks/webhook-events-and-payloads",
        "api.github.com",
      ];

  const currentWebhooks = JSON.parse(
    readFileSync(`./payload-examples/${folderName}/index.json`).toString()
  );
  const html = await getHtml({ cached, baseUrl, folderName });
  const sections = getSections(html);
  const webhooksFromScrapingDocs = sections.map(toWebhook).filter(isNotNull);
  const webhooksFromPayloadExamplesByName =
    getActionsAndExamplesFromPayloads(folderName);

  const webhooks = webhooksFromScrapingDocs.map((webhook) => {
    const name = webhook.name;

    if (!(name in webhooksFromPayloadExamplesByName)) {
      console.warn(`[${folderName}] No payload examples for ${name}`);

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
    console.log(`✅  webhooks ${folderName} are up-to-date`);

    return;
  }

  console.log(`❌  webhooks ${folderName} are not up-to-date`);
  console.log(diffString(currentWebhooks, webhooks));

  if (checkOnly) {
    process.exitCode = 1;

    return;
  }

  writeFileSync(
    `./payload-examples/${folderName}/index.json`,
    prettier.format(JSON.stringify(webhooks), { parser: "json" })
  );
  console.log(`✏️  ${folderName}/index.json, written`);
};
