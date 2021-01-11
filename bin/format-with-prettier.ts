#!/usr/bin/env ts-node-transpile-only

import fs from "fs";
import { JSONSchema7 } from "json-schema";
import { format } from "prettier";

const checkOnly = process.argv.includes("--check");

const formatJsonInDirectory = (pathToJsons: string) => {
  fs.readdirSync(pathToJsons).forEach((jsonName) => {
    const folderPath = `${pathToJsons}/${jsonName}`;

    fs.readdirSync(folderPath).forEach((file) => {
      const filePath = `${folderPath}/${file}`;

      const contentsBefore = fs.readFileSync(filePath, "utf-8");
      const contentsAfter = format(
        JSON.stringify(JSON.parse(contentsBefore) as JSONSchema7),
        { parser: "json" }
      );

      if (contentsBefore === contentsAfter) {
        return;
      }

      if (checkOnly) {
        console.warn(`${filePath} needs to be formatted`);
        process.exitCode = 1;

        return;
      }

      fs.writeFileSync(filePath, contentsBefore);
    });
  });
};

formatJsonInDirectory("payload-examples/api.github.com");
formatJsonInDirectory("payload-schemas/schemas");
