import { WebhookEventName, WebhookEventMap } from "@octokit/webhooks-types";
export type WebhookDefinition<
  TName extends WebhookEventName = WebhookEventName
> = {
  name: TName;
  actions: string[];
  description: string;
  examples: WebhookEventMap[TName][];
  properties: Record<
    string,
    {
      description: string;
      type:
        | "string"
        | "number"
        | "boolean"
        | "object"
        | "integer"
        | "array"
        | "null";
    }
  >;
};

declare const WebhookDefinitions: WebhookDefinition[];
export default WebhookDefinitions;
