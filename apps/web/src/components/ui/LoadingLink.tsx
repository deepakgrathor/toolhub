"use client";

import Link from "next/link";
import NProgress from "nprogress";
import type { ComponentProps } from "react";

type LoadingLinkProps = ComponentProps<typeof Link>;

export function LoadingLink({ href, children, onClick, ...props }: LoadingLinkProps) {
  return (
    <Link
      href={href}
      onClick={(e) => {
        NProgress.start();
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
