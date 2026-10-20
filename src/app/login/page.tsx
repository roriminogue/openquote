import { Suspense } from "react";
import { sendMagicLink, signInWithGoogle } from "./actions";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in to OpenQuote</h1>
      <Suspense>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LoginForm({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { sent, error } = await searchParams;

  return (
    <>
      {sent ? (
        <p className="mt-6 rounded-md bg-zinc-100 p-4 text-sm dark:bg-zinc-900">
          Check <strong>{sent}</strong> for a sign-in link.
        </p>
      ) : (
        <>
          <form action={sendMagicLink} className="mt-8 space-y-3">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
            <button className="w-full rounded-md bg-zinc-900 px-3 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900">
              Email me a sign-in link
            </button>
          </form>

          <form action={signInWithGoogle} className="mt-4">
            <button className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700">
              Continue with Google
            </button>
          </form>
        </>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
    </>
  );
}
