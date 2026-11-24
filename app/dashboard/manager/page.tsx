"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ManagerLayout from "@/app/components/layout/ManagerLayout";
import { fetchGuestVerifications } from "@/lib/guestVerificationApi";
import { getVerificationCreditBalances } from "@/helpers/verificationCredits";

const readSessionUser = () => {
  try {
    const raw = localStorage.getItem("nrv-user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function ManagerDashboardPage() {
  const [counts, setCounts] = useState({
    pending: 0,
    in_progress: 0,
    verified: 0,
    review_required: 0,
    unsuccessful: 0,
    total: 0,
  });
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ninVerified, setNinVerified] = useState(true);
  const [hasSubmittedNin, setHasSubmittedNin] = useState(true);

  useEffect(() => {
    try {
      const session = readSessionUser();
      const user = session?.user || null;
      setCredits(getVerificationCreditBalances(user).shortlet);
      setNinVerified(Boolean(user?.managerNinVerifiedAt));
      setHasSubmittedNin(Boolean(user?.nin || user?.ninLast4));
    } catch {
      setCredits(0);
    }
    fetchGuestVerifications()
      .then((data) => {
        if (data?.counts) {
          setCounts({
            pending: data.counts.pending || 0,
            in_progress: data.counts.in_progress || 0,
            verified: data.counts.verified || 0,
            review_required: data.counts.review_required || 0,
            unsuccessful: data.counts.unsuccessful || 0,
            total: data.counts.total || 0,
          });
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Pending", value: counts.pending },
    { label: "In progress", value: counts.in_progress },
    { label: "Verified", value: counts.verified },
    { label: "Review needed", value: counts.review_required },
    { label: "Unsuccessful", value: counts.unsuccessful },
  ];

  return (
    <ManagerLayout mainPath="Dashboard">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[#101828]">
            Guest verification
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage guest identity verifications, track requests, and review
            verification results—all in one place.
          </p>
        </div>
        {!hasSubmittedNin ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-[#101828]">
              Complete your business profile to continue.{" "}
              <Link
                href="/onboard/manager"
                className="font-semibold text-[#03442C] underline"
              >
                Add business details
              </Link>
            </p>
          </div>
        ) : !ninVerified ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-[#101828]">
              Your account verification is pending. Once approved, your
              complimentary guest verification credit will be added to your
              account.
            </p>
          </div>
        ) : null}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {card.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[#03442C]">
                {loading ? "—" : card.value}
              </p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Identity credits
            </p>
            <p className="text-lg font-semibold tabular-nums">
              Available credits: {credits}
            </p>
            {hasSubmittedNin && !ninVerified ? (
              <p className="text-sm text-gray-600">
                Complimentary credits: Pending
              </p>
            ) : (
              <p className="text-sm text-gray-600">{credits} remaining</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/manager/credits"
              className="rounded-full border border-[#03442C]/30 px-4 py-2 text-sm font-semibold text-[#03442C]"
            >
              Purchase Verification Credits
            </Link>
            <Link
              href="/dashboard/manager/requests#new-check"
              className="rounded-full bg-[#03442C] px-4 py-2 text-sm font-semibold text-white"
            >
              New Guest Verification
            </Link>
          </div>
        </div>
        {!loading && counts.total === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold text-[#101828]">
              No Guest Verifications Yet
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Start by sending your first identity verification request. You can
              track its progress and view the result here.
            </p>
            <Link
              href="/dashboard/manager/requests#new-check"
              className="mt-4 inline-flex rounded-full bg-[#03442C] px-5 py-2.5 text-sm font-semibold text-white"
            >
              New Guest Verification
            </Link>
          </div>
        ) : null}
      </div>
    </ManagerLayout>
  );
}
