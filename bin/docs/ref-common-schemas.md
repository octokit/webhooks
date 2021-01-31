# bin/ref-common-schemas.ts

Compares the contents of every schema within `payload-schemas/schemas` _except
the common schemas_ against the common schemas, replacing any matches with a
reference to the matched common schema.

Note that currently this doesn't compare the common schemas against each other.

The schemas are normalized before being compared, meaning "meta properties" such
as `description`, `$id`, `title`, etc are removed and other tweaks are made
(such as replacing `const` with `enum`) in order to make it easier to identify
how much difference there is between two schemas at time of validation.

## Usage

    bin/ref-common-schemas.ts <interface property path> <interface property path> [--full]
    bin/ref-common-schemas.ts PullRequestOpenEvent.pull_request PullRequestCloseEvent.pull_request
