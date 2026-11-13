export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  (process.env.NODE_ENV === "production"
    ? "https://nrv-backend.onrender.com"
    : "http://localhost:9000");
export const YOUVERIFY_API_URL="https://api.youverify.co/v2/api/identity/ng/bvn"

/** Public marketing / legal pages (matches production content on Vercel). */
export const MARKETING_SITE_URL = "https://v0-naija-rent-verify-app.vercel.app";

/** Landlord flow to request a tenant verification (after purchasing credits). */
export const LANDLORD_VERIFICATION_REQUEST_PATH =
  "/dashboard/landlord/properties/verification/request"; 