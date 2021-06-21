import { request } from "@octokit/request";
import cheerio from "cheerio";
import prettier from "prettier";
import { State, cache } from ".";

export const getHtml = async (
  state: State & { baseUrl: string; folderName: string }
): Promise<string> => {
  const WEBHOOKS_DOCS_URL = state.baseUrl;
  const cacheFilePath = `${state.folderName}/webhook-events-and-payloads.html`;

  try {
    if (state.cached) {
      return cache.read(cacheFilePath);
    }
  } catch {
    // if we can't read from the cache, continue and fetch from the source
  }

  console.log(`⌛  fetching ${WEBHOOKS_DOCS_URL}`);

  const { data: body } = (await request(WEBHOOKS_DOCS_URL)) as { data: string };
  const $ = cheerio.load(body);

  // get only the HTML we care about to avoid unnecessary cache updates
  const html = $("#article-contents").parent().parent().html() ?? "";

  await cache.write(cacheFilePath, prettier.format(html, { parser: "html" }));

  return html;
};
