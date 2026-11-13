/**
 * Single source of truth for landlord dashboard navigation.
 * Used by desktop sidebar and mobile hamburger menu. Only includes routes that have pages (no 404s).
 */
export const LANDLORD_NAV_ITEMS = [
  { name: "Dashboard", route: "/dashboard/landlord" },
  { name: "Properties", route: "/dashboard/landlord/properties" },
  { name: "Leads & Applications", route: "/dashboard/landlord/properties/renters" },
  { name: "Tenants", route: "/dashboard/landlord/tenants" },
  { name: "Tenant Verification", route: "/dashboard/landlord/properties/verification" },
  { name: "Maintenance", route: "/dashboard/landlord/properties/maintenance" },
  { name: "Messages", route: "/dashboard/landlord/messages" },
  { name: "How it works", route: "/dashboard/landlord/guide" },
  { name: "Buy verification credit", route: "/dashboard/landlord/settings/plans" },
] as const;
