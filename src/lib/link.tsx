import type { AnchorHTMLAttributes, Ref } from "react";
import { Link as RouterLink } from "react-router";

// <Link href> as the screens (and Astryx's LinkProvider) use it, on top of React Router. Links that leave the app
// (web, phone, email, text) are plain anchors.

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  replace?: boolean;
  prefetch?: boolean | null;
  scroll?: boolean;
  ref?: Ref<HTMLAnchorElement>;
};

const EXTERNAL = /^(https?:|mailto:|tel:|sms:|capacitor:|file:)/i;

export default function Link({ href, replace, prefetch: _prefetch, scroll: _scroll, ref, ...rest }: Props) {
  if (EXTERNAL.test(href) || rest.target === "_blank") return <a ref={ref} href={href} {...rest} />;
  return <RouterLink ref={ref} to={href} replace={replace} {...rest} />;
}
