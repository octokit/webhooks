# Payload examples

- All payloads should end with `.payload.json`.
- They should be placed in the folder whose name matches the event they're an
  example of.
- If the payload has an `action`, that should be the start of the filename
  followed by a `.`.

E.g.

- `check_run/completed.payload.json`
- `check_run/completed.with-organization.payload.json`
- `check_run/rerequested.payload.json`
- `check_run/rerequested.with-organization.payload.json`
- `create/payload.json`
- `create/with-description.payload.json`

After making any changes to example payloads, run
`npm run build:webhooks -- --cached` to update the exported `index.json` file
