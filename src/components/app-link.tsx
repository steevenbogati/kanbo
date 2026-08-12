"use client";

import NextLink from "next/link";

/**
 * Same as next/link but without prefetching: the app is published as static
 * files, and Next asks for prefetch files that a static export does not write,
 * which fills the console with harmless 404s. Navigation still happens without
 * reloading the page.
 */
export function Link(props: React.ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={false} {...props} />;
}
