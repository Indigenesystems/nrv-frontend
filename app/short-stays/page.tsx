import Link from "next/link";
import HomePageLayout from "@/app/components/layout/HomePageLayout";
import { pageMetadata } from "@/lib/seo";

const HERO_DESCRIPTION =
  "Verify your guests' identities before arrival with NRV Shortlet Verify. Send secure verification requests, track their progress, and receive identity verification results—all from one convenient dashboard.";

export const metadata = pageMetadata(
  "Know Your Guest Before Check-In",
  HERO_DESCRIPTION,
  "/short-stays",
);

export default function ShortStayMarketingPage() {
  return (
    <HomePageLayout>
      <section className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-sm font-semibold text-[#03442C]">NRV Shortlet Verify</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-[#101828]">
          Know Your Guest Before Check-In
        </h1>
        <p className="mt-4 text-gray-600 leading-relaxed">{HERO_DESCRIPTION}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/sign-up?role=shortlet_manager"
            className="rounded-full bg-[#03442C] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Start as a shortlet manager
          </Link>
          <Link
            href="/sign-in"
            className="rounded-full border border-[#03442C]/30 px-5 py-2.5 text-sm font-semibold text-[#03442C]"
          >
            Sign in
          </Link>
        </div>
      </section>
    </HomePageLayout>
  );
}
