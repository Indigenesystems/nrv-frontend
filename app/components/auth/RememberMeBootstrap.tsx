"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { restoreSessionFromRememberMe } from "@/lib/rememberMe";
import {
  getDashboardHomeForRole,
  getStoredSession,
  isAccessTokenExpired,
  isPathAllowedForRole,
  resolveNrvRole,
  syncRoleCookieFromSession,
} from "@/lib/authSession";

/**
 * On first load, sync role cookie from local session (or restore from remember-me).
 * Redirect away from the wrong role dashboard if needed.
 */
export function RememberMeBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        let session = getStoredSession();
        if (
          !session?.accessToken ||
          isAccessTokenExpired(session.accessToken)
        ) {
          session = await restoreSessionFromRememberMe();
        } else {
          syncRoleCookieFromSession(session);
        }

        if (cancelled || !session?.accessToken) {
          return;
        }
        if (pathname.startsWith("/guest-check")) {
          return;
        }

        const role = resolveNrvRole(session.user?.accountType);
        if (!role) {
          return;
        }

        const onAuthPage =
          pathname === "/sign-in" || pathname === "/forgot-password";
        if (onAuthPage) {
          router.replace(getDashboardHomeForRole(role));
          return;
        }

        const onRoleArea =
          pathname.startsWith("/dashboard/") || pathname.startsWith("/onboard/");
        if (onRoleArea && !isPathAllowedForRole(pathname, role)) {
          window.location.replace(getDashboardHomeForRole(role));
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
