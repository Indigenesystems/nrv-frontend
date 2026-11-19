"use client";

import React from "react";
import Link from "next/link";
import NavBar from "@/app/components/shared/navigations/NavBar";
import Footer from "@/app/components/screens/landing-page/Footer";

const TermsPage = () => {
  return (
    <div className="font-jakarta">
      <NavBar />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
        <h1 className="text-3xl font-bold text-[#03442C] mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-6">Last updated: 28 February 2026</p>

        <div className="prose max-w-none text-gray-600 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-[#03442C] mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the NaijaRentVerify platform ("Platform"), operated by NaijaRentVerify
              ("we", "us", or "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not
              agree, you must not use the Platform. These Terms apply to all visitors, users, landlords, tenants,
              agents, and property listers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#03442C] mb-3">2. Eligibility</h2>
            <p>
              You must be at least 18 years of age and possess the legal capacity to enter into binding agreements
              under Nigerian law. By using the Platform, you represent and warrant that you meet these requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#03442C] mb-3">3. Account Registration</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must provide accurate, current, and complete information during registration.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must notify us immediately of any unauthorized use of your account.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#03442C] mb-3">4. Platform Services</h2>
            <p>NaijaRentVerify provides:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Tenant Verification:</strong> Identity, rental history, and reference checks on prospective tenants.
              </li>
              <li>
                <strong>Property Listings:</strong> A marketplace for landlords and agents to list verified properties for rent.
              </li>
              <li>
                <strong>Rent Payment Tracking:</strong> Tools to manage and record rental payments.
              </li>
              <li>
                <strong>Maintenance Management:</strong> A system for tenants to report and track maintenance requests.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#03442C] mb-3">5. User Obligations</h2>

            <h3 className="text-lg font-semibold text-[#03442C] mt-4 mb-2">5.1 Landlords and Property Listers</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must only list properties you own or are legally authorized to manage.</li>
              <li>All property descriptions, images, and pricing must be accurate and not misleading.</li>
              <li>You must not engage in fraudulent or deceptive practices.</li>
              <li>Properties must comply with all applicable Nigerian housing regulations and safety standards.</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#03442C] mt-4 mb-2">5.2 Shortlet managers</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Shortlet managers must provide their National Identification Number (NIN) when they register. NRV staff review that NIN before the account is fully enabled for guest checks. Listing a shortlet on NRV is optional.
              </li>
              <li>
                After admin approval, NRV may grant free guest-check credits. Additional credits may be purchased. Each completed guest check uses one credit.
              </li>
              <li>
                Guest identity checks are presented as NaijaRentVerify. Hosts receive a result summary only — not the guest’s full NIN, selfie, or biometric images.
              </li>
              <li>
                You remain responsible for stay payment, check-in, and whether you host a guest.
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-[#03442C] mt-4 mb-2">5.3 Tenants</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must provide truthful information during verification processes.</li>
              <li>You must not misrepresent your identity, rental history, or financial capacity.</li>
              <li>You acknowledge that NaijaRentVerify facilitates verification but does not guarantee tenancy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#03442C] mb-3">6. Property Address Confidentiality</h2>
            <p>
              For the safety and security of property owners and tenants, exact property addresses are not publicly
              displayed on the Platform. General location information (area, city, and state) is shown on public
              listings. Full addresses are only accessible by:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The property owner or authorized agent.</li>
              <li>Verified tenants assigned to the property.</li>
              <li>Platform administrators for verification and support purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#03442C] mb-3">7. Verification Services Disclaimer</h2>
            <p>
              While we strive to provide accurate and thorough verification results, NaijaRentVerify does not
              guarantee the completeness, accuracy, or reliability of any verification report. Verification results are
              provided "as-is" and should be used as one factor among many in your decision-making process. We are not
              liable for any losses or damages arising from reliance on verification reports.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#03442C] mb-3">8. Payment Terms</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Certain services on the Platform may require payment of fees.</li>
              <li>All fees are quoted in Nigerian Naira (NGN) unless otherwise stated.</li>
              <li>
                Payments are non-refundable unless expressly stated otherwise or required by applicable Nigerian
                consumer protection laws.
              </li>
              <li>We reserve the right to modify fees with reasonable advance notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#03442C] mb-3">9. Intellectual Property</h2>
            <p>
              All content, logos, trademarks (including the NaijaRent Verification Badge), software, and materials on
              the Platform are the property of NaijaRentVerify or its licensors. You may not reproduce, distribute,
              modify, or create derivative works without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#03442C] mb-3">10. Prohibited Activities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Using the Platform for fraudulent, illegal, or unauthorized purposes.</li>
              <li>Impersonating another person or entity.</li>
              <li>Uploading malicious content, viruses, or harmful code.</li>
              <li>Scraping, data mining, or automated extraction of Platform data.</li>
              <li>Circumventing or attempting to bypass security features.</li>
              <li>Harassment, abuse, or threatening behavior toward other users.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#03442C] mb-3">11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by Nigerian law, NaijaRentVerify shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from your use of the Platform. Our total
              liability shall not exceed the amount paid by you to us in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#03442C] mb-3">12. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless NaijaRentVerify, its directors, officers, employees, and
              agents from any claims, damages, losses, or expenses arising from your use of the Platform or violation
              of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#03442C] mb-3">13. Termination</h2>
            <p>
              We may suspend or terminate your access to the Platform at any time, with or without cause, and with or
              without notice. Upon termination, your right to use the Platform ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#03442C] mb-3">14. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of
              Nigeria. Any disputes shall be resolved in the courts of competent jurisdiction in Lagos, Nigeria.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#03442C] mb-3">15. Changes to These Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Material changes will be communicated via the
              Platform or email. Continued use of the Platform after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#03442C] mb-3">16. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at{" "}
              <a className="font-medium text-gray-800 hover:underline" href="mailto:legal@naijarentverify.com">
                legal@naijarentverify.com
              </a>
              .
            </p>
          </section>

          <div className="pt-6 border-t border-gray-200 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/legal/privacy" className="hover:text-gray-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/legal/data-processing" className="hover:text-gray-900 transition-colors">
              Data Processing Policy
            </Link>
            <Link href="/legal/disclaimer" className="hover:text-gray-900 transition-colors">
              Legal Disclaimer
            </Link>
            <Link href="/legal/safety-tips" className="hover:text-gray-900 transition-colors">
              Safety Tips
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsPage;
