module.exports = getSections

const cheerio = require('cheerio')

async function getSections (state, html) {
  const $ = cheerio.load(html)

  const sections = await Promise.all(
    $('#markdown-toc a')
      .map(async (index, element) => {
        const url = $(element).attr('href')
        const sectionId = url.split('#')[1]

        if (!sectionId) {
          throw new Error(`${$(element).attr('href')} has no #anchor hash`)
        }

        const $title = $(`#${sectionId}`).parent()
        const html =
          $.html($title) +
          '\n' +
          $title
            .nextUntil('h2')
            .map((i, el) => $.html(el))
            .get()
            .join('\n')

        return {
          id: sectionId,
          html
        }
      })
      .get()
  )

  return sections.slice(1)
}
