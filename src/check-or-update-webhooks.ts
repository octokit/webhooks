import { writeFileSync } from "fs";
import { diff, diffString } from "json-diff";
import prettier from "prettier";

import createPrOnChange from "./create-pr-on-change";
import getHtml from "./get-html";
import applyWorkarounds from "./workarounds";
import getSections from "./get-sections";
import toWebhook from "./section-to-webhook";
import getActionsAndExamplesFromPayloads from "./get-actions-and-examples-from-payloads";
import currentWebhooks from "../index.json";
import { WebhookDefinition } from "../index";

export default async function checkOrUpdateWebhooks({
  cached,
  checkOnly,
}: any) {
  const state = {
    cached,
    checkOnly,
  };

  const html = await getHtml({ cached });
  const sections = await getSections(state, html);
  const webhooksFromScrapingDocs = sections
    .map(toWebhook.bind(null, state))
    .filter(Boolean) as WebhookDefinition[];
  const webhooksFromPayloadExamplesByName = getActionsAndExamplesFromPayloads();

  const webhooks = webhooksFromScrapingDocs.map(
    (webhook: WebhookDefinition) => {
      const name = webhook.name;
      const webhookFromPayloadExamples =
        webhooksFromPayloadExamplesByName[name];

      if (!webhookFromPayloadExamples) {
        console.warn(`No payload examples for ${name}`);
        return webhook;
      }

      return {
        name,
        description: webhook.description,
        actions: [
          // @ts-expect-error ts-migrate(2569) FIXME: Type 'Set<unknown>' is not an array type or a stri... Remove this comment to see the full error message
          ...new Set(
            webhook.actions.concat(webhookFromPayloadExamples.actions)
          ),
        ],
        examples: webhook.examples.concat(webhookFromPayloadExamples.examples),
      };
    }
  );

  applyWorkarounds(webhooks);

  if (!diff(currentWebhooks, webhooks)) {
    console.log("✅  webhooks are up-to-date");
    return;
  }

  console.log("❌  webhooks are not up-to-date");
  console.log(diffString(currentWebhooks, webhooks));

  if (checkOnly) {
    process.exit(1);
  }

  writeFileSync(
    "index.json",
    prettier.format(JSON.stringify(webhooks, null, 2), {
      parser: "json",
    })
  );
  console.log("✏️  index.json written");

  if (process.env.TRAVIS_EVENT_TYPE === "cron") {
    await createPrOnChange();
  }
}
