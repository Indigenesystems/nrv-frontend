"use client";

import ManagerLayout from "@/app/components/layout/ManagerLayout";
import HowItWorksGuide from "@/app/components/shared/HowItWorksGuide";

export default function ManagerGuidePage() {
  return (
    <ManagerLayout path="How it works">
      <div className="p-4 sm:p-6 lg:p-8">
        <HowItWorksGuide
          title="Know your guest before check-in"
          intro="NRV confirms guest identity for stays you booked on WhatsApp, Airbnb, or Instagram. You still collect payment and handle check-in outside NRV."
          sections={[
            {
              heading: "Send a check",
              steps: [
                {
                  title: "Buy shortlet identity credits",
                  body: "Each completed guest check uses one shortlet credit. Tenant screening packs are not used here. Unused invites do not consume a credit.",
                },
                {
                  title: "Create a request",
                  body: "Enter the guest name, email or phone, and expected check-in date. Email the link or copy it into WhatsApp.",
                },
              ],
            },
            {
              heading: "Guest confirms identity",
              steps: [
                {
                  title: "No NRV account needed",
                  body: "The guest opens the link, consents, enters NIN, and takes a live selfie.",
                },
                {
                  title: "Review the result",
                  body: "You see Verified, Review required, or Unsuccessful — not the guest’s NIN, selfie, or biometrics. You decide whether to host.",
                },
              ],
            },
          ]}
        />
      </div>
    </ManagerLayout>
  );
}
