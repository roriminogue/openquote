import Link from "next/link";
import { Suspense } from "react";
import { getAuthUser } from "@/lib/auth";
import { estimateTotals, formatAud } from "@/lib/pricing";

// Placeholder home: renders a sample estimate through the real pricing engine.
const sample = estimateTotals(
  [
    {
      name: "Subframe",
      lines: [
        { type: "material", qty: 40, unitCostCents: 840 },
        { type: "labour", qty: 8, unitCostCents: 9500 },
      ],
    },
    {
      name: "Decking",
      lines: [
        { type: "material", qty: 86, unitCostCents: 2290 },
        { type: "labour", qty: 10, unitCostCents: 9500 },
      ],
    },
  ],
  { org: { defaultMarkupPct: 25 }, gstRatePct: 10 },
);

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">OpenQuote</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Describe the job. Get a priced quote. Scaffold is running.
      </p>

      <Suspense>
        <Account />
      </Suspense>

      <section className="mt-10 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="font-medium">Sample: Merbau deck 4×3m</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {sample.groups.map((g) => (
            <li key={g.name} className="flex justify-between">
              <span>{g.name}</span>
              <span className="tabular-nums">{formatAud(g.priceCents)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
          <div className="flex justify-between">
            <dt>Subtotal (ex GST)</dt>
            <dd className="tabular-nums">{formatAud(sample.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>GST</dt>
            <dd className="tabular-nums">{formatAud(sample.gstCents)}</dd>
          </div>
          <div className="flex justify-between font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatAud(sample.totalCents)}</dd>
          </div>
          <div className="flex justify-between text-zinc-500">
            <dt>Margin</dt>
            <dd className="tabular-nums">{sample.marginPct.toFixed(1)}%</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

// Reads the session cookie, so it streams in behind a Suspense boundary.
async function Account() {
  const user = await getAuthUser();
  return user ? (
    <form action="/auth/signout" method="post" className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
      Signed in as {user.email}.{" "}
      <Link href="/settings/ai" className="underline">
        AI settings
      </Link>{" "}
      · <button className="underline">Sign out</button>
    </form>
  ) : (
    <Link href="/login" className="mt-4 inline-block text-sm underline">
      Sign in
    </Link>
  );
}
