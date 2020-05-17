module.exports = createPrOnChange;

const execa = require("execa");
const { request } = require("@octokit/request");

async function createPrOnChange() {
  const [owner, repo] = process.env.TRAVIS_REPO_SLUG.split("/");
  const branchName = `cron/webhooks-changes/${new Date()
    .toISOString()
    .substr(0, 10)}`;

  // check if webhook files changed
  const { stdout } = await execa("git", ["status"]);
  if (/nothing to commit/.test(stdout)) {
    console.log("🤖  No changes detected in cron job.");
    return;
  }

  console.log("🤖  Changes detected in cron job. Creating pull request ...");

  // count changes
  const diffResult = await execa("git diff --stat", { shell: true });
  const changesSummary = diffResult.stdout
    .split("\n")
    .pop()
    .trim()
    .replace(/file/, "webhook definition");

  // push changes back to GitHub
  await execa("git", ["checkout", "-b", branchName]);
  await execa("git", ["add", "cache"]);
  await execa("git", ["commit", "-m", "build: cache"]);
  await execa("git", ["add", "."]);
  await execa("git", ["commit", "-m", "build: webhooks"]);
  await execa("git", [
    "push",
    `https://${process.env.GH_TOKEN}@github.com/${owner}/${repo}.git`,
    `HEAD:${branchName}`,
  ]);
  await execa("git", ["checkout", "-"]);

  // start pullrequest
  const { body } = await request("POST /repos/:owner/:repo/pulls", {
    owner,
    repo,
    headers: {
      authorization: `token ${process.env.GH_TOKEN}`,
    },
    title: `🤖🚨 ${changesSummary}`,
    head: branchName,
    base: "master",
    body: `Dearest humans,

My friend Travis asked me to let you know that they found webhook changes in their daily routine check.`,
  });

  console.log(`🤖  Pull request created: ${body.html_url}`);
}
