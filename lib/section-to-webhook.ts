import { strict as assert } from "assert";
import cheerio from "cheerio";
import TurndownService from "turndown";
import { Section, Webhook } from ".";

const turndownService = new TurndownService({
  codeBlockStyle: "fenced",
});

const isObsoleteEvent = ($: cheerio.Root): boolean =>
  $(".warning").text().includes("Events of this type are no longer delivered");

export const toWebhook = (section: Section): Webhook | null => {
  const $ = cheerio.load(section.html);

  // ignore obsolete events that are no longer sent
  if (isObsoleteEvent($)) {
    return null;
  }

  // rewrite local links to /v3* as fully-qualified URLs
  $("a").each((i, element) => {
    const url = $(element).attr("href");

    assert.ok(url, `${element} has no url attribute`);

    if (url.startsWith("/en/v3")) {
      $(element).attr(
        "href",
        url.replace("/en/v3", "https://docs.github.com/en/v3")
      );
    }
  });

  return {
    name: getName($),
    description: getDescription($),
    actions: getActions($),
    examples: getExamples($),
  };
};

const getName = ($: cheerio.Root): string => $("h3").text().trim();

const getDescription = ($: cheerio.Root): string =>
  $("h3")
    .nextUntil("h4")
    .filter("p")
    .map((i, el) => $(el).html())
    .get()
    .map((html) => turndownService.turndown(html))
    .join("\n\n");

const getActions = ($: cheerio.Root): string[] => {
  const unwantedActions = ["true", "false", "status"];

  const $table = $('[id^="webhook-payload-object"]').next("table");

  if (!$table.is("table")) {
    return [];
  }

  const [keyEl, , descriptionEl] = $table
    .find("tbody tr:first-child td")
    .get() as cheerio.Element[];

  if ($(keyEl).text().trim() !== "action") {
    return [];
  }

  const desc = $(descriptionEl).html();

  assert.ok(desc, `${descriptionEl} has no description!`);

  const actions: string[] = (cheerio
    .load(desc)("code")
    .map((index, el) => $(el).text().trim())
    .get() as string[])
    .filter((action) => !unwantedActions.includes(action))
    .sort((a, b) => a.localeCompare(b));

  // return unique actions
  return [...new Set(actions)];
};

const getExamples = ($: cheerio.Root) =>
  $(".language-json")
    .map((index, el) => JSON.parse($(el).text()) as unknown)
    .get() as object[];
