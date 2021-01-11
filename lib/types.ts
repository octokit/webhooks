export interface State {
  cached?: boolean;
  checkOnly?: boolean;
}

export interface Webhook<TExample extends object = object> {
  name: string;
  description: string;
  actions: string[];
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
