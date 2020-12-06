module.exports = getActionsAndExamplesFromPayloads;

const { readdirSync } = require("fs");

function getActionsAndExamplesFromPayloads() {
  const eventsByName = {};
  for (const path of readdirSync("payload-examples/api.github.com")) {
    if (!/\.json$/.test(path)) {
      continue;
    }

    const [name] = path.split(".");

    const payload = require(`../payload-examples/api.github.com/${path}`);

    if (!eventsByName[name]) {
      eventsByName[name] = {
        actions: [],
        examples: [],
      };
    }

    if (payload.action) {
      eventsByName[name].actions.push(payload.action);
    }
    eventsByName[name].examples.push(payload);
  }

  return eventsByName;
}
