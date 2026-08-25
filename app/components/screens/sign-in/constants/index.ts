export const ROUTES = {
  HOME: "/",
  SIGN_UP: "/sign-up",
  FORGOT_PASSWORD: "/forgot-password",
  VERIFY_ACCOUNT: "/verify-account",
  SET_PASSWORD: "/set-password",
  LANDLORD_DASHBOARD: "/dashboard/landlord",
  TENANT_DASHBOARD: "/dashboard/tenant",
} as const;

export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: "Email is required",
  EMAIL_INVALID: "Invalid email address",
  PASSWORD_REQUIRED: "Password is required",
  PASSWORD_MIN_LENGTH: "Password must be at least 6 characters",
} as const;

export const SOCIAL_PROVIDERS = {
  GOOGLE: "google",
  FACEBOOK: "facebook",
} as const; 