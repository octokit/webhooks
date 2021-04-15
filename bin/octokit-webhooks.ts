#!/usr/bin/env ts-node-transpile-only

import yargs from "yargs";
import { checkOrUpdateWebhooks, versions } from "../lib";

interface Options {
  cached: boolean;
}

const {
  cached,
  _: [command],
} = yargs
  .command("update", "Update webhooks", (yargs) => {
    yargs
      .options({
        cached: {
          describe: "Load HTML from local cache",
          type: "boolean",
          default: false,
        },
      })
      .example("$0 update --cached", "");
  })
  .command("check", "Check if webhooks are up-to-date", (yargs) => {
    yargs
      .options({
        cached: {
          describe: "Load HTML from local cache",
          type: "boolean",
          default: false,
        },
      })
      .example("$0 check --cached", "");
  })
  .help("h")
  .alias("h", ["help", "usage"])
  .demandCommand(1, "")
  .scriptName("bin/octokit-webhooks")
  .usage("$0 <command> [--cached]").argv as yargs.Arguments<Options>;

if (!["update", "check"].includes(command.toString())) {
  console.log(`"${command}" must be one of: update, check`);
  process.exit(1);
}

for (let version of Object.keys(versions)) {
  checkOrUpdateWebhooks({
    cached,
    checkOnly: command === "check",
    version: version as keyof typeof versions,
  }).catch((error: Error) => {
    console.log(error.stack);
    process.exit(1);
  });
}
