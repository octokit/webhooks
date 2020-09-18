module.exports = getHtml;

const { request } = require("@octokit/request");
const cheerio = require("cheerio");
const prettier = require("prettier");

const cache = require("./cache");

const WEBHOOKS_DOCS_URL =
  "https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads";

async function getHtml(state) {
  const cacheFilePath = "webhook-events-and-payloads.html";

  if (state.cached && (await cache.exists(cacheFilePath))) {
    return cache.read(cacheFilePath);
  }

  console.log(`⌛  fetching ${WEBHOOKS_DOCS_URL}`);

  const { data: body } = await request(WEBHOOKS_DOCS_URL);

  const $ = cheerio.load(body);

  // get only the HTML we care about to avoid unnecessary cache updates
  const html = $("#article-contents").parent().html();

  await cache.writeHtml(
    cacheFilePath,
    prettier.format(html, { parser: "html" })
  );
  return html;
}
