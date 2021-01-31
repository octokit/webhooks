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
[`index.json` file](https://github.com/octokit/webhooks/blob/master/index.json)
is generated, please do not edit it. Instead, make changes in the
[`payload-examples/api.github.com/` folder](https://github.com/octokit/webhooks/tree/master/payload-examples/api.github.com),
then update `index.json` by running the following command

```
npm run build:webhooks -- --cached
```

When you send a pull request, make sure that the `index.json` file is up-to-date
with the changes in the `payload-examples/api.github.com/` folder, otherwise the
tests will fail.

## Updating types

The
[`schema.d.ts` file](https://github.com/octokit/webhooks/blob/master/schema.d.ts)
is generated, please do not edit it. Instead, make changes to the schemas in the
[`payload-schemas/schemas/` folder](https://github.com/octokit/webhooks/tree/master/payload-schemas/schemas),
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
