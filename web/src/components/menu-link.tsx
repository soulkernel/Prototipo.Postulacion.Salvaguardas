"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
  };
}
export function MenuLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => "",
  );
  const [path, anchor] = href.split("#");
  const active = anchor
    ? pathname === path && hash === "#" + anchor
    : pathname === path ||
      (path !== "/internal" &&
        path !== "/applicant" &&
        pathname.startsWith(path + "/")) ||
      (path === "/applicant/applications" &&
        /^\/applicant\/[0-9a-f-]{36}$/i.test(pathname)) ||
      (path === "/internal" && pathname.startsWith("/internal/applications/"));
  return (
    <Link href={href} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
