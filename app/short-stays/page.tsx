import Link from "next/link";
import HomePageLayout from "@/app/components/layout/HomePageLayout";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Know your guest before check-in",
  "Shortlet managers use NaijaRentVerify to confirm guest identity. Stay payment stays off the platform.",
  "/short-stays",
);

export default function ShortStayMarketingPage() {
  return (
    <HomePageLayout>
      <section className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-sm font-semibold text-[#03442C]">NRV Shortlet Verify</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-[#101828]">
          Know your guest before check-in
        </h1>
        <p className="mt-4 text-gray-600 leading-relaxed">
          Bookings still happen on WhatsApp, Airbnb, or Instagram. NRV gives
          you an identity result and an auditable record. You collect payment
          and handle check-in yourself.
        </p>
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
