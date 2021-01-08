import { request } from "@octokit/request";
import cheerio from "cheerio";
import prettier from "prettier";
import { State, cache } from ".";

const WEBHOOKS_DOCS_URL =
  "https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/webhook-events-and-payloads";

export const getHtml = async (state: State): Promise<string> => {
  const cacheFilePath = "webhook-events-and-payloads.html";

  if (state.cached && (await cache.exists(cacheFilePath))) {
    return cache.read(cacheFilePath);
  }

  console.log(`⌛  fetching ${WEBHOOKS_DOCS_URL}`);

  const { data: body } = (await request(WEBHOOKS_DOCS_URL)) as { data: string };
  const $ = cheerio.load(body);

  // get only the HTML we care about to avoid unnecessary cache updates
  const html = $("#article-contents").parent().html() ?? "";

  await cache.writeHtml(
    cacheFilePath,
    prettier.format(html, { parser: "html" })
  );

  return html;
};
