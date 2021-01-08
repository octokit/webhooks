import { Webhook } from ".";

export type WorkableWebhook =
  | ({ name: "repository_dispatch" } & Webhook<{ client_payload: object }>)
  | ({ name: "workflow_dispatch" } & Webhook<{ inputs: object }>);

export const applyWorkarounds = (webhooks: WorkableWebhook[]): void => {
  webhooks.forEach((webhook) => {
    if (webhook.name === "repository_dispatch") {
      webhook.examples.forEach((example) => {
        example.client_payload = {};
      });
    }

    if (webhook.name === "workflow_dispatch") {
      webhook.examples.forEach((example) => {
        example.inputs = {};
      });
    }
  });
};
