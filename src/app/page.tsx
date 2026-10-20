import { redirect } from "next/navigation";

// The proxy sends "/" to /estimates or /login; this only runs if the proxy is bypassed.
export default function Home() {
  redirect("/estimates");
}
