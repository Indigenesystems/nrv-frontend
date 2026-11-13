import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const PUBLIC_PATHS = [
  "/",
  "/listings",
  "/short-stays",
  "/sign-up",
  "/about-us",
  "/careers",
  "/contact-us",
  "/contact-us/support",
  "/legal/terms",
  "/legal/privacy",
  "/legal/safety-tips",
  "/legal/disclaimer",
  "/legal/data-processing",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-10-01");

  return PUBLIC_PATHS.map((path) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path === "/" || path === "/listings" ? "daily" : "monthly",
    priority: path === "/" ? 1 : path === "/listings" ? 0.9 : 0.6,
  }));
}
