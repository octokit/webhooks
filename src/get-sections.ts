import cheerio from "cheerio";

export default async function getSections(state: any, html: any) {
  const $ = cheerio.load(html);

  const sections = await Promise.all(
    $(".article-grid-toc-content a:not(.link-gray-dark)")
      .map(async (index: any, element: any) => {
        const url = $(element).attr("href");
        const sectionId = url?.split("#")[1];

        if (!sectionId) {
          throw new Error(`${$(element).attr("href")} has no #anchor hash`);
        }

        const $title = $(`#${sectionId}`);
        const html =
          $.html($title) +
          "\n" +
          $title
            .nextUntil("h3")
            .map((i: any, el: any) => $.html(el))
            .get()
            .join("\n");

        return {
          id: sectionId,
          html,
        };
      })
      .get()
  );

  return sections.slice(1);
}
