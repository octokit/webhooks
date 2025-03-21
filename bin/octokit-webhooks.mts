#!/usr/bin/env -S npx tsx

import yargs from "yargs";
import type { Options as yargsOptions, Arguments } from "yargs";
import { hideBin } from "yargs/helpers";
import { checkOrUpdateWebhooks } from "../lib/index.mjs";

interface Options {
  cached: boolean;
  ghe?: string;
  githubAE?: boolean;
  updateAll?: boolean;
}

const options: Record<string, yargsOptions> = {
  cached: {
    describe: "Load HTML from local cache",
    type: "boolean",
    default: false,
  },
  ghe: {
    describe:
      'GitHub Enterprise. To load a specific version set it the version, e.g. "2.20"',
    type: "string",
  },
  githubAE: {
    describe: "Fetch webhooks for GitHub AE",
    type: "boolean",
    default: false,
  },
  updateAll: {
    describe:
      "Fetch webhooks for github.com as well as all enterprise versions",
    type: "boolean",
    default: false,
  },
};

const {
  cached,
  ghe,
  githubAE,
  updateAll,
  _: [command],
} = yargs(hideBin(process.argv))
  .command("update", "Update webhooks", (yargs) => {
    yargs.options(options).example("$0 update --cached", "");
  })
  .command("check", "Check if webhooks are up-to-date", (yargs) => {
    yargs.options(options).example("$0 check --cached", "");
  })
  .help("h")
  .alias("h", ["help", "usage"])
  .demandCommand(1, "")
  .scriptName("bin/octokit-webhooks")
  .usage("$0 <command> [--cached]").argv as Arguments<Options>;

if (!["update", "check"].includes(command.toString())) {
  console.log(`"${command}" must be one of: update, check`);
  process.exit(1);
}

checkOrUpdateWebhooks({
  cached,
  ghe,
  githubAE,
  updateAll,
  checkOnly: command === "check",
}).catch((error: Error) => {
  console.log(error.stack);
  process.exit(1);
});
