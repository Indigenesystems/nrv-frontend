"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "react-toastify";
import ManagerLayout from "@/app/components/layout/ManagerLayout";
import DateInputField from "@/app/components/shared/input-fields/DateInputField";
import CenterModal from "@/app/components/shared/modals/CenterModal";
import {
  createGuestVerification,
  fetchGuestVerifications,
  resendGuestVerification,
  type GuestVerificationRequest,
} from "@/lib/guestVerificationApi";

const STATUS_LABEL: Record<string, string> = {
  pending_invite: "Pending",
  in_progress: "In progress",
  verified: "Verified",
  review_required: "Review",
  unsuccessful: "Unsuccessful",
  expired: "Expired",
};

export default function GuestVerificationsPage() {
  const [items, setItems] = useState<GuestVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const load = async () => {
    try {
      const data = await fetchGuestVerifications();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    if (typeof window !== "undefined" && window.location.hash === "#new-check") {
      setFormOpen(true);
    }
  }, []);

  const openForm = () => {
    setInviteUrl("");
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }
    setFormOpen(false);
  };

  const resetForm = () => {
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setCheckInDate("");
  };

  const createRequest = async (sendEmail: boolean) => {
    if (!guestName.trim()) {
      toast.error("Enter the guest full name.");
      return;
    }
    if (!guestEmail.trim() && !guestPhone.trim()) {
      toast.error("Enter an email or phone number.");
      return;
    }
    if (!checkInDate) {
      toast.error("Enter the expected check-in date.");
      return;
    }
    setSaving(true);
    try {
      const res = await createGuestVerification({
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim() || undefined,
        guestPhone: guestPhone.trim() || undefined,
        checkInDate,
        sendEmail,
      });
      const url = res?.data?.inviteUrl || "";
      setInviteUrl(url);
      resetForm();
      toast.success(
        sendEmail && guestEmail.trim()
          ? "Invite sent by email."
          : "Invite link ready to copy.",
      );
      await load();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Could not create this request.",
      );
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void createRequest(Boolean(guestEmail.trim()));
  };

  const copyText = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied for WhatsApp.");
    } catch {
      toast.error("Copy failed. Select the link and copy it.");
    }
  };

  const copyLink = async () => {
    if (inviteUrl && !guestName.trim()) {
      await copyText(inviteUrl);
      return;
    }
    if (
      !guestName.trim() ||
      !checkInDate ||
      (!guestEmail.trim() && !guestPhone.trim())
    ) {
      if (inviteUrl) {
        await copyText(inviteUrl);
        return;
      }
      toast.error("Fill in the guest details first.");
      return;
    }
    setSaving(true);
    try {
      const res = await createGuestVerification({
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim() || undefined,
        guestPhone: guestPhone.trim() || undefined,
        checkInDate,
        sendEmail: false,
      });
      const url = res?.data?.inviteUrl || "";
      setInviteUrl(url);
      resetForm();
      if (url) {
        await copyText(url);
      }
      await load();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Could not create this request.",
      );
    } finally {
      setSaving(false);
    }
  };

  const copyAgain = async (id: string) => {
    try {
      const res = await resendGuestVerification(id, false);
      const url = res?.data?.inviteUrl;
      if (url) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied.");
      }
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not copy this link.");
    }
  };

  return (
    <ManagerLayout mainPath="Guest verifications">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[#101828]">
              Guest verifications
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Send a link so the guest can confirm identity. Stay payment stays
              off NRV.
            </p>
          </div>
          <button
            type="button"
            onClick={openForm}
            className="shrink-0 rounded-full bg-[#03442C] px-4 py-2 text-sm font-semibold text-white"
          >
            New verification
          </button>
        </div>

        <section>
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500">
              No guest checks yet.{" "}
              <button
                type="button"
                onClick={openForm}
                className="font-medium text-[#03442C]"
              >
                Start a new verification
              </button>
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
              <table className="min-w-full text-sm">
                <thead className="text-left text-gray-500 border-b">
                  <tr>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Check-in</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Result</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item._id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#101828]">
                          {item.guestName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.guestEmail || item.guestPhone || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.checkInDate
                          ? new Date(item.checkInDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {STATUS_LABEL[item.status] || item.status}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {item.report?.idName ||
                          (item.ninLast4 ? `NIN ****${item.ninLast4}` : "—")}
                        {item.identitySummary ? (
                          <span className="block">
                            {item.identitySummary.faceMatch
                              ? "Face match"
                              : "No face match"}
                            {item.identitySummary.livenessPassed
                              ? " · Live"
                              : " · Liveness fail"}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {item.status === "pending_invite" ||
                        item.status === "in_progress" ||
                        item.status === "expired" ? (
                          <button
                            type="button"
                            onClick={() => void copyAgain(item._id)}
                            className="text-[#03442C] font-medium"
                          >
                            Copy link
                          </button>
                        ) : (
                          <Link
                            href={`/dashboard/manager/requests/${item._id}`}
                            className="text-[#03442C] font-medium"
                          >
                            View report
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      <CenterModal isOpen={formOpen} onClose={closeForm}>
        <div className="max-h-[85vh] overflow-y-auto p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#101828]">
                New verification
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                The guest does not need an NRV account.
              </p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="text-sm text-gray-500"
            >
              Close
            </button>
          </div>
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Guest full name</span>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Guest email</span>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Guest phone</span>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+234..."
              />
            </label>
            <DateInputField
              label="Expected check-in date"
              name="checkInDate"
              variant="nested"
              placeholder="Select check-in date"
              value={checkInDate || null}
              required
              disablePast
              displayFormat="dd MMM yyyy"
              onChange={(selectedDate) => {
                setCheckInDate(format(selectedDate, "yyyy-MM-dd"));
              }}
            />
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#03442C] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Email link
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void copyLink()}
                className="rounded-full border border-[#03442C]/30 px-5 py-2.5 text-sm font-semibold text-[#03442C] disabled:opacity-60"
              >
                Copy link for WhatsApp
              </button>
            </div>
          </form>
          {inviteUrl ? (
            <p className="mt-4 break-all text-xs text-gray-500">{inviteUrl}</p>
          ) : null}
        </div>
      </CenterModal>
    </ManagerLayout>
  );
}
