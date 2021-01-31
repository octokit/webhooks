# bin/validate-payload-examples.ts

Validates all the payload examples in `payload-examples` against the appropriate
schemas in `payload-schemas`.

If a fatal error is thrown during validation, such as because of a missing file,
validation will stop. You can change this behaviour by passing the
`--continue-on-error` flag.

## Usage

    bin/validate-payload-examples.ts [--continue-on-error]
    bin/validate-payload-examples.ts
