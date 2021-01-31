import fs from "fs";

export const forEachJsonFile = (
  directory: string,
  callback: (pathToFile: string) => void
) => {
  fs.readdirSync(directory, { withFileTypes: true }).forEach((entity) => {
    const pathToEntity = `${directory}/${entity.name}`;

    if (entity.isDirectory()) {
      return forEachJsonFile(pathToEntity, callback);
    }

    callback(pathToEntity);
  });
};
