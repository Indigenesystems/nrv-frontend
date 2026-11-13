"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ManagerLayout from "@/app/components/layout/ManagerLayout";
import {
  fetchGuestVerification,
  type GuestVerificationRequest,
} from "@/lib/guestVerificationApi";

const STATUS_LABEL: Record<string, string> = {
  pending_invite: "Pending",
  in_progress: "In progress",
  verified: "Verified",
  review_required: "Review required",
  unsuccessful: "Unsuccessful",
  expired: "Expired",
};

const RESULT_CLASS: Record<string, string> = {
  passed: "text-[#03442C] bg-[#03442C]/10",
  failed: "text-red-700 bg-red-50",
  review: "text-amber-800 bg-amber-50",
  pending: "text-gray-600 bg-gray-100",
};

const formatWhen = (value?: string) => {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function GuestVerificationReportPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const [item, setItem] = useState<GuestVerificationRequest | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }
    fetchGuestVerification(id)
      .then(setItem)
      .catch((err: any) => {
        setError(err?.response?.data?.message || "Could not load this report.");
      });
  }, [id]);

  const report = item?.report;
  const done = ["verified", "review_required", "unsuccessful"].includes(
    item?.status || "",
  );

  return (
    <ManagerLayout mainPath="Guest verifications" path="Report">
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
        <Link
          href="/dashboard/manager/requests"
          className="text-sm font-medium text-[#03442C]"
        >
          ← All verifications
        </Link>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {!item && !error ? (
          <p className="mt-4 text-sm text-gray-500">Loading report…</p>
        ) : null}
        {item ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {STATUS_LABEL[item.status] || item.status}
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-[#101828]">
                {item.guestName}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Check-in{" "}
                {item.checkInDate
                  ? new Date(item.checkInDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
                {item.guestEmail ? ` · ${item.guestEmail}` : ""}
                {item.guestPhone ? ` · ${item.guestPhone}` : ""}
              </p>
              {report?.recommendation ? (
                <p className="mt-4 rounded-xl bg-[#f7f8f6] px-4 py-3 text-sm text-[#101828]">
                  {report.recommendation}
                </p>
              ) : !done ? (
                <p className="mt-4 text-sm text-gray-600">
                  This guest has not finished the check yet. You will get a
                  full report after they complete NIN and the live camera.
                </p>
              ) : null}
            </div>

            {done ? (
              <>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-[#101828]">
                    What we checked
                  </h2>
                  <ul className="mt-3 space-y-3">
                    {(report?.checks || []).map((check) => (
                      <li
                        key={check.label}
                        className="flex items-start justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-[#101828]">
                            {check.label}
                          </p>
                          {check.detail ? (
                            <p className="text-xs text-gray-500">
                              {check.detail}
                            </p>
                          ) : null}
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                            RESULT_CLASS[check.result] || RESULT_CLASS.pending
                          }`}
                        >
                          {check.result}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {report?.providerError ? (
                    <p className="mt-3 text-sm text-red-600">
                      Provider note: {report.providerError}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-[#101828]">
                    Identity on file
                  </h2>
                  <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">
                        Name on NIN
                      </dt>
                      <dd className="mt-0.5 text-[#101828]">
                        {report?.idName || "Not returned"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">
                        Date of birth
                      </dt>
                      <dd className="mt-0.5 text-[#101828]">
                        {report?.dateOfBirth || "Not returned"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">
                        Gender
                      </dt>
                      <dd className="mt-0.5 text-[#101828]">
                        {report?.gender || "Not returned"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">
                        NIN
                      </dt>
                      <dd className="mt-0.5 tabular-nums text-[#101828]">
                        {item.ninLast4 ? `****${item.ninLast4}` : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">
                        Guest consented
                      </dt>
                      <dd className="mt-0.5 text-[#101828]">
                        {formatWhen(report?.consentedAt || item.consentAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">
                        Check completed
                      </dt>
                      <dd className="mt-0.5 text-[#101828]">
                        {formatWhen(report?.completedAt || item.dojahRanAt)}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-xs text-gray-500">
                    NRV does not show the full NIN, selfie, or biometric
                    images. Use this summary to decide whether to host.
                  </p>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </ManagerLayout>
  );
}
