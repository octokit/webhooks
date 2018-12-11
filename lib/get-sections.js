module.exports = getSections

const cheerio = require('cheerio')

async function getSections (state, html) {
  const $ = cheerio.load(html)

  const sections = await Promise.all($('#markdown-toc a')
    .map(async (index, element) => {
      const sectionId = $(element).attr('href').substr(1)
      const $title = $(`#${sectionId}`).parent()
      const html = $.html($title) + '\n' + $title
        .nextUntil('h2')
        .map((i, el) => $.html(el))
        .get()
        .join('\n')

      return {
        id: sectionId,
        html
      }
    })
    .get())

  return sections
}
