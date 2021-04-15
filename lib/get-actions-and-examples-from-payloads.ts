import { readdirSync } from "fs";
import { State, versions } from "./types";

interface ActionsAndExamples {
  actions: string[];
  examples: object[];
}

export const getActionsAndExamplesFromPayloads = (
  version: State["version"]
): Record<string, ActionsAndExamples> => {
  const pathToPayloads = `payload-examples/${version?.toLowerCase()}`;
  const eventsByName: Record<string, ActionsAndExamples> = {};

  readdirSync(pathToPayloads, { withFileTypes: true })
    .filter((entity) => entity.isDirectory())
    .map((entity) => entity.name)
    .forEach((event) => {
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
