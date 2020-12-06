# Payload examples

All payload example file names have to start with the event name followed by a `.`. E.g. `check_run.completed.payload.json`. The part before the first `.` is needed to assign the payload example to the correct event name.

After making any changes to example payloads, run `node bin/octokit-webhooks.js update --cached` to update the exported `index.json` file
