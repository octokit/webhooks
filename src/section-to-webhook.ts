import cheerio from "cheerio";
import TurndownService from "turndown";
import { WebhookDefinition } from "../index";

const turndownService = new TurndownService({
  codeBlockStyle: "fenced",
});

export default function sectionHtmlToWebhook(
  state: any,
  section: any
): WebhookDefinition | null {
  const $ = cheerio.load(section.html);

  // ignore obsolete events that are no longer sent
  if (
    /Events of this type are no longer delivered/.test($(".warning").text())
  ) {
    return null;
  }

  // rewrite local links to /v3* as fully-qualified URLs
  $("a").each((i: any, el: any) => {
    const href = $(el).attr("href");
    if (href?.startsWith("/en/v3")) {
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

function getName($: any) {
  return $("h3").text().trim();
}

function getDescription($: any) {
  return $("h3")
    .nextUntil("h4")
    .filter("p")
    .map((i: any, el: any) => $(el).html())
    .get()
    .map((html: any) => turndownService.turndown(html))
    .join("\n\n");
}

function getActions($: any) {
  const unwantedActions = ["true", "false", "status"];

  const $table = $('[id^="webhook-payload-object"]').next("table");

  if (!$table.is("table")) return [];

  const [keyEl, , descriptionEl] = $table.find("tbody tr:first-child td").get();

  if ($(keyEl).text().trim() !== "action") return [];

  const desc = $(descriptionEl).html();

  const actions = cheerio
    .load(desc)("code")
    .map((index: any, el: any) => $(el).text().trim())
    .get()
    .filter((action: any) => !unwantedActions.includes(action))
    .sort();

  // return unique actions
  // @ts-expect-error ts-migrate(2569) FIXME: Type 'Set<unknown>' is not an array type or a stri... Remove this comment to see the full error message
  return [...new Set(actions)];
}

function getExamples($: any) {
  return $(".language-json")
    .map((index: any, el: any) => JSON.parse($(el).text()))
    .get();
}
