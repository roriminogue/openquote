# Security

OpenQuote AU stores business details, client details and encrypted AI keys, so security problems matter.

## Reporting a problem

Please don't open a public issue for a security problem. Use GitHub's private reporting instead: on this
repository, go to **Security → Report a vulnerability**. Include what you found, how to reproduce it, and what
someone could do with it. You'll get a reply as soon as possible, and credit in the fix if you'd like it.

## What's supported

Only the latest version on the `main` branch gets fixes. If you run your own copy, keep it up to date with
**Sync fork** on GitHub (see the README).

## How your data is protected

- Each install has its own database. Within it, row-level security keeps each business's records apart.
- Saved AI keys are encrypted with AES-256-GCM using your `ENCRYPTION_KEY`, and only the last four characters
  are ever shown back.
- Quote links use long random tokens and can only be accepted or declined once.
