module.exports = getActionsAndExamplesFromPayloads;

const { readdirSync } = require("fs");

const pathToPayloads = "payload-examples/api.github.com";

function getActionsAndExamplesFromPayloads() {
  const eventsByName = {};
  readdirSync(pathToPayloads).forEach((event) => {
    for (const path of readdirSync(`${pathToPayloads}/${event}`)) {
      if (!/\.json$/.test(path)) {
        continue;
      }

      const payload = require(`../${pathToPayloads}/${event}/${path}`);

      if (!eventsByName[event]) {
        eventsByName[event] = {
          actions: [],
          examples: [],
        };
      }

      if (payload.action) {
        eventsByName[event].actions.push(payload.action);
      }
      eventsByName[event].examples.push(payload);
    }
  });

  return eventsByName;
}
