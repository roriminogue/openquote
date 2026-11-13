// The web version's relay to publik API (https://publikhq.com/api/v1). Publik's API doesn't let web pages call it
// directly (it sends no Access-Control-Allow-Origin), so the Home Screen app calls /publik/… on its own address and
// this passes the request on unchanged and streams the answer back. It keeps nothing: no logs, no storage; the key
// stays on the person's phone and travels in the Authorization header as it would to publik.
// Runs as a Cloudflare Pages Function on the same site as the app (free plan: 100,000 requests a day).

const UPSTREAM = "https://publikhq.com/api/v1/";
// Only what the app uses: sign-in, plan, usage counting, AI and search.
const ALLOWED = /^(installs|wallet|telemetry|chat\/completions|messages|search|models)$/;
const PASS_HEADERS = ["authorization", "content-type", "accept", "anthropic-version", "x-api-key", "x-request-id"];

type Ctx = { request: Request; params: { path?: string | string[] } };

export async function onRequest({ request, params }: Ctx): Promise<Response> {
  const path = Array.isArray(params.path) ? params.path.join("/") : (params.path ?? "");
  if (!ALLOWED.test(path)) return new Response("Not found", { status: 404 });
  if (request.method !== "GET" && request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const headers = new Headers();
  for (const name of PASS_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const url = new URL(request.url);
  const upstream = await fetch(UPSTREAM + path + url.search, {
    method: request.method,
    headers,
    body: request.method === "POST" ? request.body : undefined,
  });
  const out = new Headers(upstream.headers);
  out.set("cache-control", "no-store");
  out.delete("set-cookie");
  return new Response(upstream.body, { status: upstream.status, headers: out });
}
