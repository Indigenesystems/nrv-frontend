"use client";

import { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import ManagerLayout from "@/app/components/layout/ManagerLayout";
import { API_URL } from "@/config/constant";
import { getStoredSession } from "@/lib/authSession";

export default function ManagerSettingsPage() {
  const [businessName, setBusinessName] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const session = getStoredSession();
    const user = session?.user as
      | { _id?: string; email?: string; businessName?: string; notifyEmail?: string }
      | undefined;
    setUserId(String(user?._id || ""));
    setBusinessName(String((user as any)?.businessName || ""));
    setNotifyEmail(String((user as any)?.notifyEmail || user?.email || ""));
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Sign in again to update settings.");
      return;
    }
    setSaving(true);
    try {
      const token = getStoredSession()?.accessToken;
      const res = await axios.put(
        `${API_URL}/users/${userId}`,
        { businessName: businessName.trim(), notifyEmail: notifyEmail.trim() },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      const updated = res.data?.data;
      try {
        const raw = localStorage.getItem("nrv-user");
        const parsed = raw ? JSON.parse(raw) : {};
        parsed.user = { ...(parsed.user || {}), ...updated };
        localStorage.setItem("nrv-user", JSON.stringify(parsed));
        window.dispatchEvent(new Event("nrv-user-updated"));
      } catch {
        // ignore storage
      }
      toast.success("Settings saved.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ManagerLayout mainPath="Settings">
      <div className="p-4 sm:p-6 lg:p-8 max-w-xl">
        <h1 className="text-xl font-semibold text-[#101828]">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Shown on guest invites. Results go to the notify email.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Business display name</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Notify email</span>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#03442C] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Save
          </button>
        </form>
      </div>
    </ManagerLayout>
  );
}
