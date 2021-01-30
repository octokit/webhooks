import fs from "fs";
import { JSONSchema7 } from "json-schema";
import { forEachJsonFile, guessAtInterfaceName, pathToSchemas } from ".";

type InterfaceNameAndSchema = [interfaceName: string, schema: JSONSchema7];

export const loadMapOfSchemas = (): Record<string, JSONSchema7> => {
  const entries: InterfaceNameAndSchema[] = [];

  forEachJsonFile(pathToSchemas, (pathToSchema) => {
    const schema = JSON.parse(
      fs.readFileSync(pathToSchema, "utf-8")
    ) as JSONSchema7;

    entries.push([guessAtInterfaceName(schema), schema]);
  });

  return Object.fromEntries(entries);
};
