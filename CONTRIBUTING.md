# Contributing

Thanks for wanting to contribute to the Octokit Fixtures, we welcome your help.
For contributions of any kind we ask you to abide by our
[Code of Conduct](CODE_OF_CONDUCT.md).

For a general overview of how Octokit Webhooks work, have a look at the
[How it works](README.md#how-it-works) section in the README.

The most common issue people will run into is an unexpected webhook definition.
Please create an issue describing the problem.

Then edit the [`index.json`](index.json) file directly to what you think it
should be, then run `npm test` to see the test failing. This is your failing
test, you can start a pull request with the failing test only and we can take
the discussion there.

If you figure out how to fix the issue then please push the fix to the pull
request as well.

There are a number of bin scripts that can help with maintaining and
contributing to this repo that are located in `bin/`. You can find documentation
for these scripts in `bin/docs`, which can also be accessed by passing `--help`
(for a summary) and `--help-full` (for the full document) to any of the scripts.

## Adding examples

The
[`index.json` file](https://github.com/octokit/webhooks/blob/main/payload-examples/api.github.com/index.json)
is generated, please do not edit it. Instead, make changes in the
[`payload-examples/api.github.com/` folder](https://github.com/octokit/webhooks/tree/main/payload-examples/api.github.com),
then update `index.json` by running the following command

```
npm run build:webhooks -- --cached
```

When you send a pull request, make sure that the `index.json` file is up-to-date
with the changes in the `payload-examples/api.github.com/` folder, otherwise the
tests will fail.

## Creating a new schema

The webhook schemas are [JSON schemas](https://json-schema.org/) that are manually created using example payloads for webhook events.

- Create a new folder for the event in `payload-schemas/api.github.com/`, if it doesn't already exist
- Create a new JSON file in that folder named `<action>.schema.json` if the event has an `action` property, otherwise name it `event.schema.json`
- The `$id` property should start with the event name, followed by the `action` name separated with `$` if the event has an `action` property, e.g. `pull_request$created`. If the event doesn't have an `action` property then simply use `event` instead of the `action` name.
- the `title` property's value should be in the format `<eventName> <action> event`, where `<eventName>` is the name of the event, and `<action>` is the value of the `action` property of the webhook payload. If there is no action, the it should simply be `<eventName> event`
- `type` should be `object`
- Add any required properties in an array in the [`required` property](https://json-schema.org/understanding-json-schema/reference/object.html#required-properties)
- Define properties of the payload in the [`properties` property](https://json-schema.org/understanding-json-schema/reference/object.html#properties) as an object in that property, like so:

```json
{
  "properties": {
    "myproperty": {
      "type": "int",
      "description": "My Property's description"
    }
  }
}
```

- When a property is a `string`, or `number` and has a defined set of values it can be, add the values in an array in the [`enum`](https://json-schema.org/understanding-json-schema/reference/generic.html#enumerated-values) property of the `property`'s object
  - If the property may have `null` as a value, add `null` to the `enum` array
  ```json
  {
    "type": ["string", "null"],
    "enum": ["foo", "bar", null]
  }
  ```
- When a property can be of multiple types, use a [`oneOf`](https://json-schema.org/understanding-json-schema/reference/combining.html#oneof) for the decleration of that property, and declare each type in the `oneOf`
- When it is possible that a property may have a value of `null`:

  - if there is only one other type the property can be, change the `type` property to an array including the type, and the string `null`

  ```json
  {
    "type": ["string", "null"]
  }
  ```

  - if there are more than one other type, that the property can be, simply add it to the `oneOf`:

  ```json
  {
    "oneof": [{ "type": "string" }, { "type": "integer" }, { "type": "null" }]
  }
  ```

- Set `additionalProperties` to `false` to prevent the use of other keys without erroring.
- Repeat until you reach the lowest level of the payload

In the end, you should have a document that resembles the following

```json
{
  "$schema": "http://json-schema.org/draft-07/schema",
  "$id": "event_name$action",
  "type": "object",
  "required": ["myProp"],
  "properties": {
    "myProp": {
      "type": "string",
      "enum": ["some", "values"]
    },
    "anoptionalProp": {
      "oneOf": [{ "type": "string" }, { "type": "number" }]
    },
    "anObjectProp": {
      "type": "object",
      "required": ["nestedProp"],
      "properties": {
        "nestedProp": { "type": "string" }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "title": "event name action"
}
```

## Updating types

The
[`schema.d.ts` file](https://github.com/octokit/webhooks/blob/main/payload-types/schema.d.ts)
is generated, please do not edit it. Instead, make changes to the schemas in the
[`payload-schemas/schemas/` folder](https://github.com/octokit/webhooks/tree/main/payload-schemas/schemas),
then generate the schema and update the types with the following commands:

```shell
npm run build:schema
npm run build:types
```

## Merging the Pull Request & releasing a new version

Releases are automated using
[semantic-release](https://github.com/semantic-release/semantic-release). The
following commit message conventions determine which version is released:

1. `fix: ...` or `fix(scope name): ...` prefix in subject: bumps fix version,
   e.g. `1.2.3` → `1.2.4`
2. `feat: ...` or `feat(scope name): ...` prefix in subject: bumps feature
   version, e.g. `1.2.3` → `1.3.0`
3. `BREAKING CHANGE:` in body: bumps breaking version, e.g. `1.2.3` → `2.0.0`

Only one version number is bumped at a time, the highest version change trumps
the others. Besides publishing a new version to npm, semantic-release also
creates a git tag and release on GitHub, generates changelogs from the commit
messages and puts them into the release notes.

If the pull request looks good but does not follow the commit conventions, use
the "Squash & merge" button.
