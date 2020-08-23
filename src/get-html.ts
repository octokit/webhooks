import { request } from "@octokit/request";
import cache from "./cache";

const WEBHOOKS_DOCS_URL =
  "https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads";

export default async function getHtml(state: any) {
  const cacheFilePath = "webhook-events-and-payloads.html";

  if (state.cached && (await cache.exists(cacheFilePath))) {
    return cache.read(cacheFilePath);
  }

  console.log(`⌛  fetching ${WEBHOOKS_DOCS_URL}`);

  const { data: html } = await request(WEBHOOKS_DOCS_URL);

  const normalizedCache = html.replace(
    /<meta name="csrf-token" content="[^"]+" \/>/,
    '<meta name="csrf-token" content="[REMOVED]" />'
  );

  await cache.writeHtml(cacheFilePath, normalizedCache);
  return normalizedCache;
}
