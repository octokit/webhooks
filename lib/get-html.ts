import got from "got";
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

  const { body } = await got(WEBHOOKS_DOCS_URL, {
    retry: {
      limit: 10,
      statusCodes: [503],
    },
  });
  const $ = cheerio.load(body);

  // get only the HTML we care about to avoid unnecessary cache updates
  $('[data-testid="callout"]').remove();
  const data = $("#article-contents").parent().parent();
  // Remove all classes from the HTML, except the ones that are actively used in the code to get payload examples.
  // This is done to avoid unnecessary cache updates in order to reduce noise from automated Pull Requests
  // https://github.com/octokit/webhooks/issues/642
  data.find("*").each((i, el) => {
    const classes = $(el).attr("class");

    if (classes) {
      const filteredClasses = classes
        .split(" ")
        .filter((classSelector) =>
          ["language-json", "warning"].includes(classSelector)
        );

      if (filteredClasses.length) {
        $(el).attr("class", filteredClasses.join(" "));
      } else {
        $(el).removeAttr("class");
      }
    }
  });
  const html = data.html() ?? "";

  await cache.write(cacheFilePath, prettier.format(html, { parser: "html" }));

  return html;
};
