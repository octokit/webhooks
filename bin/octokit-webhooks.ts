#!/usr/bin/env node

// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'checkOrUpd... Remove this comment to see the full error message
const checkOrUpdateWebhooks = require("../src/check-or-update-webhooks");

const {
  cached,
  _: [command],
} = require("yargs")
  .command("update", "Update webhooks", (yargs: any) => {
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
  .command("check", "Check if webhooks are up-to-date", (yargs: any) => {
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
  (error: any) => {
    console.log(error.stack);
    process.exit(1);
  }
);
