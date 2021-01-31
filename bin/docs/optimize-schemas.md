# bin/optimize-schemas.ts

Applies a handful of "optimizations" to all the schemas in
`payload-schemas/schemas`.

These optimizations include:

- sorting the content of `"type"` properties that are arrays to be in a
  consistent order (i.e. `"type": [null, "array"]` -> `"type": ["array", null]`)
- inlining one-item `"type"` properties so that they're just the type (i.e.
  `"type": ["array"]` -> `"type": "array"`)
- inlining one-item `oneOf`s so that they're just the schema
- merging elements in `oneOf`s where applicable (particularly with types that
  `x | null`)
- replacing `anyOf`s with `oneOf`s (as the latter is stricter)
- ensuring all `object` type objects have `tsAdditionalProperties` or
  `additionalProperties` set

## Usage

    bin/optimize-schemas.ts
