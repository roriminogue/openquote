import { useMemo } from "react";
import { useLocation, useNavigate, useSearchParams as useRouterSearchParams } from "react-router";

// The few navigation helpers the screens use, with the names they had under Next.js, on top of React Router.

export function useRouter() {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (href: string) => void navigate(href),
      replace: (href: string) => void navigate(href, { replace: true }),
      back: () => void navigate(-1),
      /** Screens re-read their data after any change (lib/data.tsx), so there's nothing to do. */
      refresh: () => {},
      prefetch: (_href: string) => {},
    }),
    [navigate],
  );
}

export function usePathname() {
  return useLocation().pathname;
}

export function useSearchParams() {
  return useRouterSearchParams()[0];
}

export class NotFoundError extends Error {
  constructor() {
    super("Not found");
    this.name = "NotFoundError";
  }
}

export class RedirectError extends Error {
  constructor(public readonly to: string) {
    super(`Redirect to ${to}`);
    this.name = "RedirectError";
  }
}

/** Shows the not-found screen instead of this one (caught by the route's error screen, see routes.tsx). */
export function notFound(): never {
  throw new NotFoundError();
}

/** Goes to another screen instead of this one (caught by the route's error screen, see routes.tsx). */
export function redirect(to: string): never {
  throw new RedirectError(to);
}

// Navigation from outside React (form actions, after a save). Registered once by the router (routes.tsx).
let navigator: ((to: string, opts?: { replace?: boolean }) => void) | null = null;

export function registerNavigator(fn: typeof navigator) {
  navigator = fn;
}

export function navigateTo(to: string, opts?: { replace?: boolean }) {
  navigator?.(to, opts);
}
