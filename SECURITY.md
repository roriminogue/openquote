# Security

OpenQuote AU holds business details, client details and an AI key that can spend money, so security problems matter.

## Reporting a problem

Please don't open a public issue for a security problem. Use GitHub's private reporting instead: on this
repository, go to **Security → Report a vulnerability**. Include what you found, how to reproduce it, and what
someone could do with it. You'll get a reply as soon as possible, and credit in the fix if you'd like it.

## What's supported

Only the latest version gets fixes: the web version at https://openquote.roriminogue.com updates itself, and the
iPhone app updates when it's reinstalled from the `main` branch.

## How your data is protected

- **Nothing is on a server.** Business details, clients and quotes are saved on the phone, in the app's own
  database. There are no accounts and no database online to break into.
- **The AI key stays on the phone.** The iPhone app keeps it in the Keychain (this device only, not in iCloud
  backups); the web version keeps it in the site's storage on the phone. It's never put in the database or a backup
  file, and only its last four characters are shown back.
- **The web page can only talk to the AI providers.** Its Content-Security-Policy allows scripts from the site
  only, and connections only to the site and the supported AI providers, so nothing on the page could send the key
  or your quotes anywhere else. The page also can't be framed by another site.
- **Backups are checked before they're restored:** it must be an OpenQuote database, and anything the app never
  creates (triggers, views) is removed first.
- **What leaves the phone:** the job description, site address and rates go to the AI provider you chose, to price
  the job; PDFs and backups go wherever you share them.

## Audits

- [November 2026](docs/security-audit-2026-11.md): findings and fixes.
