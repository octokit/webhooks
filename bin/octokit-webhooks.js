#!/usr/bin/env node

const checkOrUpdateWebhooks = require("../lib/check-or-update-webhooks");

const {
  cached,
  _: [command],
} = require("yargs")
  .command("update", "Update webhooks", (yargs) => {
    yargs
      .options({
        cached: {
          describe: "Load HTML from local cache",
          type: "boolean",
          default: false,
        },
      })
      .example("$0 update --cached");
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
      .example("$0 check --cached");
  })
  .help("h")
  .alias("h", ["help", "usage"])
  .demandCommand(1, "")
  .usage("bin/octokit-webhooks.js <command> [--cached]").argv;

if (!["update", "check"].includes(command)) {
  console.log(`"${command}" must be one of: update, check`);
  process.exit(1);
}

checkOrUpdateWebhooks({ cached, checkOnly: command === "check" }).catch(
  (error) => {
    console.log(error.stack);
    process.exit(1);
  }
);
