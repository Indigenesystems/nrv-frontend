const VALID_LANDING_ACCESS_CODES = ["phlip2025", "nrvguest2026"];

/** Cookie middleware checks before allowing any non-root route. */
export const SITE_ACCESS_COOKIE = "nrv_site_access";
export const SITE_ACCESS_COOKIE_VALUE = "1";
/** 30 days */
export const SITE_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export const isValidLandingAccessCode = (input: string): boolean => {
  const normalized = input.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return VALID_LANDING_ACCESS_CODES.includes(normalized);
};

export const hasSiteAccessCookie = (): boolean => {
  if (typeof document === "undefined") {
    return false;
  }
  return document.cookie
    .split(";")
    .some(
      (part) =>
        part.trim() ===
        `${SITE_ACCESS_COOKIE}=${SITE_ACCESS_COOKIE_VALUE}`,
    );
};

export const setSiteAccessCookie = (): void => {
  if (typeof document === "undefined") {
    return;
  }
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${SITE_ACCESS_COOKIE}=${SITE_ACCESS_COOKIE_VALUE}; Path=/; Max-Age=${SITE_ACCESS_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
};
