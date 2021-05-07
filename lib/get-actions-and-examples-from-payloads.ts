import { readdirSync } from "fs";

interface ActionsAndExamples {
  actions: string[];
  examples: object[];
}

export const getActionsAndExamplesFromPayloads = (
  folderName: string
): Record<string, ActionsAndExamples> => {
  const pathToPayloads = `payload-examples/${folderName}`;
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
