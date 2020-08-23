module.exports = checkOrUpdateWebhooks;

const { writeFileSync } = require("fs");
const { diff, diffString } = require("json-diff");
const prettier = require("prettier");

// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'createPrOn... Remove this comment to see the full error message
const createPrOnChange = require("./create-pr-on-change");
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'getHtml'.
const getHtml = require("./get-html");
const applyWorkarounds = require("./workarounds");
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'getSection... Remove this comment to see the full error message
const getSections = require("./get-sections");
const toWebhook = require("./section-to-webhook");
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'getActions... Remove this comment to see the full error message
const getActionsAndExamplesFromPayloads = require("./get-actions-and-examples-from-payloads");

// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'checkOrUpd... Remove this comment to see the full error message
async function checkOrUpdateWebhooks({
  cached,
  checkOnly
}: any) {
  const state = {
    cached,
    checkOnly,
  };

  const html = await getHtml({ cached });
  const sections = await getSections(state, html);
  const webhooksFromScrapingDocs = sections
    .map(toWebhook.bind(null, state))
    .filter(Boolean);
  const webhooksFromPayloadExamplesByName = getActionsAndExamplesFromPayloads();

  const webhooks = webhooksFromScrapingDocs.map((webhook: any) => {
    const name = webhook.name;
    const webhookFromPayloadExamples = webhooksFromPayloadExamplesByName[name];

    if (!webhookFromPayloadExamples) {
      console.warn(`No payload examples for ${name}`);
      return webhook;
    }

    return {
      name,
      description: webhook.description,
      actions: [
        // @ts-expect-error ts-migrate(2569) FIXME: Type 'Set<unknown>' is not an array type or a stri... Remove this comment to see the full error message
        ...new Set(webhook.actions.concat(webhookFromPayloadExamples.actions)),
      ],
      examples: webhook.examples.concat(webhookFromPayloadExamples.examples),
    };
  });

  applyWorkarounds(webhooks);

  const currentWebhooks = require("../index.json");

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
