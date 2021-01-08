import { readdirSync } from "fs";

const pathToPayloads = "payload-examples/api.github.com";

interface ActionsAndExamples {
  actions: string[];
  examples: object[];
}

export const getActionsAndExamplesFromPayloads = (): Record<
  string,
  ActionsAndExamples
> => {
  const eventsByName: Record<string, ActionsAndExamples> = {};

  readdirSync(pathToPayloads).forEach((event) => {
    readdirSync(`${pathToPayloads}/${event}`)
      .filter((path) => path.endsWith(".json"))
      .forEach((path) => {
        const payload = require(`../${pathToPayloads}/${event}/${path}`) as {
          action?: string;
        };

        eventsByName[event] ||= {
          actions: [],
          examples: [],
        };

        if (payload.action) {
          eventsByName[event].actions.push(payload.action);
        }
        eventsByName[event].examples.push(payload);
      });
  });

  return eventsByName;
};
