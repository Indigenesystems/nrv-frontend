import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserData } from "../types";
import { ROUTES } from "../constants";
import {
  getAccountBlockedMessage,
  isAccountLoginBlocked,
  isLandlordAccount,
  isPathAllowedForRole,
  isTenantAccount,
  setRoleCookie,
  type NrvRole,
} from "@/lib/authSession";
import { clearAuthSession } from "@/lib/sessionIdle";

export const useAuthRedirect = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectUser = useCallback((userData: UserData) => {
    const userAccountType = String(userData?.user?.accountType || "").toLowerCase();
    const userStatus = String(userData?.user?.status || "").toLowerCase();
    const mustChangePassword = Boolean(
      (userData?.user as { mustChangePassword?: boolean } | undefined)
        ?.mustChangePassword,
    );

    if (isAccountLoginBlocked(userStatus)) {
      clearAuthSession();
      const params = new URLSearchParams();
      params.set("reason", getAccountBlockedMessage(userStatus));
      router.replace(`/sign-in?${params.toString()}`);
      return;
    }

    const role: NrvRole | null = isTenantAccount(userAccountType)
      ? "tenant"
      : isLandlordAccount(userAccountType)
        ? "landlord"
        : null;

    if (role) {
      setRoleCookie(role);
    }

    // Handle inactive users
    if (userStatus === "inactive") {
      // Keep verification inside the sign-in flow (not the sign-up onboarding).
      // Ensure the verification screen can read the email.
      if (userData?.user?.email) {
        localStorage.setItem("emailToVerify", JSON.stringify({ data: { email: userData.user.email } }));
      }
      router.push(ROUTES.VERIFY_ACCOUNT);
      return;
    }

    // Invited users must set a new password before entering the dashboard.
    if (userStatus === "active" && mustChangePassword) {
      router.replace(ROUTES.SET_PASSWORD);
      return;
    }

    const redirectFromQuery =
      searchParams.get("redirect") || searchParams.get("returnUrl");

    // Prevent open redirects: only allow internal relative paths.
    const safeRedirect =
      redirectFromQuery &&
      typeof redirectFromQuery === "string" &&
      redirectFromQuery.startsWith("/") &&
      !redirectFromQuery.startsWith("//")
        ? redirectFromQuery
        : null;

    const propertyMatch = safeRedirect
      ? safeRedirect.match(/^\/properties\/([^\/?#]+)/)
      : null;
    const redirectPropertyId = propertyMatch?.[1] ?? null;

    // Handle active users based on account type
    if (userStatus === "active") {
      // If the user came from a public property deep link (`/properties/:id`),
      // send them directly to the tenant dashboard property details page.
      if (userAccountType === "tenant" && redirectPropertyId) {
        router.push(`/dashboard/tenant/properties/${redirectPropertyId}`);
        return;
      }

      // Deep links only when they match this account's role area.
      if (safeRedirect && role && isPathAllowedForRole(safeRedirect, role)) {
        router.push(safeRedirect);
        return;
      }

      switch (userAccountType) {
        case "landlord":
          router.push(ROUTES.LANDLORD_DASHBOARD);
          break;
        case "tenant":
          router.push(ROUTES.TENANT_DASHBOARD);
          break;
        default:
          // Fallback to home page for unknown account types
          router.push(ROUTES.HOME);
          break;
      }
    }
  }, [router, searchParams]);

  return {
    redirectUser,
  };
}; 