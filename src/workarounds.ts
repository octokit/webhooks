export default function workarounds(webhooks: any) {
  webhooks.forEach((webhook: any) => {
    if (webhook.name === "repository_dispatch") {
      webhook.examples.forEach((example: any) => {
        example.client_payload = {};
      });
    }

    if (webhook.name === "workflow_dispatch") {
      webhook.examples.forEach((example: any) => {
        example.inputs = {};
      });
    }
  });
}
