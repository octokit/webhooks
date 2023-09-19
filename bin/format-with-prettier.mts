#!/usr/bin/env -S ts-node-transpile-only --esm

import fs from "fs";
import { JSONSchema7 } from "json-schema";
import { format } from "prettier";
import {
  forEachJsonFile,
  parseArgv,
  pathToPayloads,
  pathToSchemas,
} from "./utils/index.mjs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const [, { check: checkOnly }] = parseArgv(__filename, [], ["check"]);

const formatJsonInDirectory = (pathToJsons: string) => {
  forEachJsonFile(pathToJsons, async (filePath) => {
    const contentsBefore = fs.readFileSync(filePath, "utf-8");
    const contentsAfter = await format(
      JSON.stringify(JSON.parse(contentsBefore) as JSONSchema7),
      { parser: "json" },
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
