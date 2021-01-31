#!/usr/bin/env ts-node-transpile-only

import fs from "fs";
import { JSONSchema7 } from "json-schema";
import { format } from "prettier";
import {
  forEachJsonFile,
  parseArgv,
  pathToPayloads,
  pathToSchemas,
} from "./utils";

const [, { check: checkOnly }] = parseArgv(__filename, [], ["check"]);

const formatJsonInDirectory = (pathToJsons: string) => {
  forEachJsonFile(pathToJsons, (filePath) => {
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

    fs.writeFileSync(filePath, contentsAfter);
  });
};

formatJsonInDirectory(pathToPayloads);
formatJsonInDirectory(pathToSchemas);
