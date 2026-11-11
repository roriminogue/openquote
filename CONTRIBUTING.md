# Contributing to OpenQuote AU

Thanks for helping. OpenQuote AU is built for tradies, so the best contributions make quoting faster or prices more
accurate for real jobs.

## Ways to help

- **Report a bug or a wrong price.** Open an issue. For prices, include the item, your price, your region and
  where the price came from (supplier and date).
- **Suggest a feature.** Open an issue describing the job or problem first, before writing code.
- **Send a pull request.** Keep each one to one change, and explain what it does in plain words.

## Running it locally

See [For developers](README.md#for-developers) in the README. Before you open a pull request:

```bash
npm test
npm run typecheck
npm run lint
```

## Ground rules

- **Money is integer cents, ex-GST.** All arithmetic lives in `src/lib/pricing.ts`. The AI proposes line items;
  code prices them.
- **Prices come from data.** Price-book changes go in `src/lib/price-book/items.json`, with a typical price, a
  low–high range, how many sources you checked, and a short note. Use averages from several suppliers. Don't
  copy a supplier's catalogue.
- **Database changes** go through `src/db/schema.ts` and `npm run db:generate`. Every table needs row-level
  security, and every server query must filter by the member's organisation.
- **Clean-room only.** Don't contribute code, prompts, copy or designs taken from any commercial product.
- **Never commit secrets.** `.env.local` and your iPhone signing file stay on your machine.

By contributing, you agree that your work is licensed under the [AGPL-3.0](LICENSE), like the rest of
OpenQuote AU.
