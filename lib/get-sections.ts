import { strict as assert } from "assert";
import cheerio from "cheerio";
import { Section } from ".";

export const getSections = (html: string): Section[] => {
  const $ = cheerio.load(html);

  const sections = $("#in-this-article")
    .parent()
    .find("ul a")
    .map((index, element) => {
      const url = $(element).attr("href");

      assert.ok(url, `${element} has no url attribute`);

      const [, sectionId] = url.split("#");

      assert.ok(sectionId, `${url} has no #anchor hash`);

      const $title = $(`#${sectionId}`);
      const html = [
        $.html($title),
        "\n",
        $title
          .nextUntil("h2")
          .map((i, el) => $.html(el))
          .get()
          .join("\n"),
      ].join("");

      return {
        id: sectionId,
        html,
      };
    })
    .get() as Section[];

  return sections.slice(1);
};
