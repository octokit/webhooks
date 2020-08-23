import { readdirSync } from "fs";

export default function getActionsAndExamplesFromPayloads() {
  const eventsByName = {};
  for (const path of readdirSync("payload-examples/api.github.com")) {
    const [name] = path.split(".");

    const payload = require(`../payload-examples/api.github.com/${path}`);

    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    if (!eventsByName[name]) {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      eventsByName[name] = {
        actions: [],
        examples: [],
      };
    }

    if (payload.action) {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      eventsByName[name].actions.push(payload.action);
    }
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    eventsByName[name].examples.push(payload);
  }

  return eventsByName;
}
