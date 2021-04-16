import { JSONSchema7TypeName } from "json-schema";

export enum versions {
  "ghes-219" = "enterprise-server@2.19",
  "ghes-220" = "enterprise-server@2.20",
  "ghes-221" = "enterprise-server@2.21",
  "ghes-222" = "enterprise-server@2.22",
  "ghes-30" = "enterprise-server@3.0",
  "github.ae" = "github-ae@latest",
  "api.github.com" = "free-pro-team@latest",
}
export interface State {
  cached?: boolean;
  checkOnly?: boolean;
  version?: keyof typeof versions;
}

export interface Webhook<TExample extends object = object> {
  name: string;
  description: string;
  actions: string[];
  properties: Record<
    string,
    { type: JSONSchema7TypeName; description: string }
  >;
  examples: TExample[];
}

export interface Section {
  id: string;
  html: string;
}

// polyfills for types used by turndown to avoid having the include the DOM lib
// as they'd be considered globally available in the whole codebase by typescript
// (remove if we actually start using DOM elements e.g. via jsdom)
declare global {
  interface DocumentFragment {}
  interface HTMLElement {}
  interface HTMLElementTagNameMap {}
}
