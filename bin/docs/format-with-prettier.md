# bin/format-with-prettier.ts

Formats all the json payloads and schemas within this repo using `prettier`
consistently by stripping them of all whitespace and newlines first.

The difference between this script and running `prettier --write` on the files
directly is that `prettier` preserves multiline objects.

You can pass the `--check` flag to just check if any files need formatting
without writing the formatted contents back to disk.

## Usage

    bin/format-with-prettier.ts [--check]
    bin/format-with-prettier.ts
