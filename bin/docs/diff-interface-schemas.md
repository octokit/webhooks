# bin/diff-interface-schemas.ts

Shows the difference between the json schemas for the given interface
properties.

By default, the schemas are normalized before being compared, meaning "meta
properties" such as `description`, `$id`, `title`, etc are removed and other
tweaks are made (such as replacing `const` with `enum`) in order to make it
easier to identify how much difference there is between two schemas at time of
validation.

You can see the full diff for two schemas by passing the `--full` flag.

## Usage

    bin/diff-interface-schemas.ts <interface property path> <interface property path> [--full]
    bin/diff-interface-schemas.ts PullRequestOpenEvent.pull_request PullRequestCloseEvent.pull_request

## Details

The schemas are selected by providing an "interface property path", which is
made up of the name of an interface, followed by the dot path to the property
whose schema you wish to select.

For example, if schema.d.ts contains the following:

```ts
interface PullRequestOpenEvent {
  action: "open";
  pull_request: {
    id: string;
    title: string;
    number: string;
    state: "open";
  };
}

interface PullRequestCloseEvent {
  action: "close";
  pull_request: {
    id: string;
    title: string;
    number: string;
    state: "closed";
  };
}
```

You could compare the schemas of the "pull_request" property on each interface
like so:

    bin/diff-interface-schema.ts PullRequestOpenEvent.pull_request PullRequestCloseEvent.pull_request

Note that you can also provide just the name of an interface, i.e.

```ts
interface PullRequest {
  id: string;
  title: string;
  number: string;
  state: "open";
}

interface PullRequestCloseEvent {
  action: "close";
  pull_request: {
    id: string;
    title: string;
    number: string;
    state: "closed";
  };
}
```

    bin/diff-interface-schema.ts PullRequest PullRequestCloseEvent.pull_request
