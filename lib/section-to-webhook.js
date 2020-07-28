module.exports = sectionHtmlToWebhook;

const cheerio = require("cheerio");
const TurndownService = require("turndown");
const turndownService = new TurndownService({
  codeBlockStyle: "fenced",
});

function sectionHtmlToWebhook(state, section) {
  const $ = cheerio.load(section.html);

  // ignore obsolete events that are no longer sent
  if (
    /Events of this type are no longer delivered/.test($(".warning").text())
  ) {
    return null;
  }

  // rewrite local links to /v3* as fully-qualified URLs
  $("a").each((i, el) => {
    const href = $(el).attr("href");
    if (href.startsWith("/en/v3")) {
      $(el).attr(
        "href",
        href.replace("/en/v3", "https://docs.github.com/en/v3")
      );
    }
  });

  const webhook = {
    name: getName($),
    description: getDescription($),
    actions: getActions($),
    examples: getExamples($),
  };

  return webhook;
}

function getName($) {
  return $("h3").text().trim();
}

function getDescription($) {
  return $("h3")
    .nextUntil("h4")
    .filter("p")
    .map((i, el) => $(el).html())
    .get()
    .map((html) => turndownService.turndown(html))
    .join("\n\n");
}

function getActions($) {
  const unwantedActions = ["true", "false", "status"];

  const $table = $('[id^="webhook-payload-object"]').next("table");

  if (!$table.is("table")) return [];

  const [keyEl, , descriptionEl] = $table.find("tbody tr:first-child td").get();

  if ($(keyEl).text().trim() !== "action") return [];

  const desc = $(descriptionEl).html();

  const actions = cheerio
    .load(desc)("code")
    .map((index, el) => $(el).text().trim())
    .get()
    .filter((action) => !unwantedActions.includes(action))
    .sort();

  // return unique actions
  return [...new Set(actions)];
}

function getExamples($) {
  return $(".language-json")
    .map((index, el) => JSON.parse($(el).text()))
    .get();
}
