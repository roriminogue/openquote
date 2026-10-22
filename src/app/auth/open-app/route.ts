import { type NextRequest } from "next/server";

// Sign-in links requested from the iPhone app land here in Safari. We hand the one-time code to the app through
// its openquote:// URL scheme, so the session is created inside the app (where the sign-in was started) rather
// than in Safari.
export function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const safe = encodeURIComponent(code);
  const appUrl = `openquote://auth/callback?code=${safe}`;
  const webUrl = `/auth/callback?code=${safe}`;
  const html = `<!doctype html>
<html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Opening OpenQuote</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 24px; box-sizing: border-box;
    background: #fcfcfc; color: #18191b; font: 15px/1.5 -apple-system, system-ui, sans-serif; text-align: center; }
  @media (prefers-color-scheme: dark) { body { background: #0f0f10; color: #f4f4f5; } p { color: #a1a1aa; } }
  h1 { font-size: 20px; font-weight: 600; margin: 0; } p { color: #6b6b74; margin: 6px 0 20px; }
  a.btn { display: inline-block; padding: 12px 20px; border-radius: 10px; background: linear-gradient(#404040, #262626);
    color: #fff; text-decoration: none; font-weight: 500; }
  a.alt { display: block; margin-top: 16px; color: inherit; font-size: 14px; }
</style></head>
<body><main>
  <h1>Opening OpenQuote…</h1>
  <p>If the app doesn’t open, tap the button.</p>
  <a class="btn" href="${appUrl}">Open OpenQuote</a>
  <a class="alt" href="${webUrl}">Sign in here in Safari instead</a>
</main>
<script>location.href = ${JSON.stringify(appUrl)};</script>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
