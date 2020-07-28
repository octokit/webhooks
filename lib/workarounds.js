module.exports = workarounds;

function workarounds(webhooks) {
  webhooks.forEach((webhook) => {
    if (webhook.name === "workflow_dispatch") {
      webhook.examples.forEach((example) => {
        example.inputs = {};
      });
    }
  });
}
