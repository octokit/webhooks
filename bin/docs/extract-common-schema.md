# bin/extract-common-schema.ts

Extracts a schema from within another into a new "common" schema which are
placed in `schemas/common/`.

By default, an error will be thrown if a common schema already exists with the
generated name. You can pass the `--overwrite` flag to change this behaviour.

## Usage

    bin/extract-common-schema.ts <interface property path> <interface name> [--overwrite]
    bin/extract-common-schema.ts PullRequestOpenEvent.pull_request PullRequest

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

You could extract the schema for the type of `pull_request` property on one of
the interfaces into its own common schema that would generate an interface named
`PullRequest` with the following:

    bin/extract-common-schema.ts PullRequestOpenEvent.pull_request PullRequest

This would create a new schema located at
`payload-schemas/schemas/common/pull-request.schema.json` which would generate
the following type:

```ts
interface PullRequest {
  id: string;
  title: string;
  number: string;
  state: "open";
}
```
