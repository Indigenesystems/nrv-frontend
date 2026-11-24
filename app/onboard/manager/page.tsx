"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import ManagerProtectedRoute from "@/app/components/guard/ManagerProtectedRoute";
import CompleteProfileSideBar from "@/app/components/screens/sign-up/CompleteProfileSideBar";
import AccountTypeBadge from "@/app/components/screens/sign-up/AccountTypeBadge";
import InputField from "@/app/components/shared/input-fields/InputFields";
import Button from "@/app/components/shared/buttons/Button";
import { API_URL } from "@/config/constant";

const readSession = () => {
  try {
    const raw = localStorage.getItem("nrv-user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

function ManagerBusinessProfileForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({
    businessName: "",
    businessAddress: "",
    managerRole: "",
    notifyEmail: "",
    businessPhone: "",
    nin: "",
  });

  useEffect(() => {
    const session = readSession();
    const nextUser = session?.user || null;
    setValues((current) => ({
      ...current,
      businessName: nextUser?.businessName || "",
      businessAddress: nextUser?.businessAddress || "",
      managerRole: nextUser?.managerRole || "",
      notifyEmail: nextUser?.notifyEmail || nextUser?.email || "",
      businessPhone: nextUser?.businessPhone || nextUser?.phoneNumber || "",
    }));
  }, []);

  const onChange = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const session = readSession();
    const token = session?.accessToken;
    if (!token) {
      toast.error("Please sign in again.");
      router.push("/sign-in");
      return;
    }
    setSaving(true);
    try {
      const response = await axios.post(
        `${API_URL}/users/me/manager-profile`,
        {
          ...values,
          nin: String(values.nin || "").replace(/\D/g, ""),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const updated = response.data?.data;
      if (updated && session) {
        localStorage.setItem(
          "nrv-user",
          JSON.stringify({ ...session, user: { ...session.user, ...updated } }),
        );
      }
      toast.success(
        "Business profile saved. Your account verification is pending.",
      );
      router.push("/dashboard/manager");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Could not save your business profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <div className="hidden lg:block w-1/2 bg-[#E9F4E7]">
        <CompleteProfileSideBar accountType="shortlet_manager" />
      </div>
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-5">
        <div className="max-w-md mx-auto w-full">
          <AccountTypeBadge accountType="shortlet_manager" className="mb-4" />
          <h1 className="text-2xl font-semibold text-[#101828]">
            Business profile
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Tell us about your shortlet business and submit your NIN. We use
            this to confirm your account before complimentary guest
            verification credits are added. Your guest checks stay on NRV.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <InputField
              name="businessName"
              label="Business or trading name"
              placeholder="Enter your business or trading name"
              value={values.businessName}
              onChange={(e: any) => onChange("businessName", e.target.value)}
            />
            <InputField
              name="businessAddress"
              label="Business address"
              placeholder="Enter your business address"
              value={values.businessAddress}
              onChange={(e: any) =>
                onChange("businessAddress", e.target.value)
              }
            />
            <InputField
              name="managerRole"
              label="Manager's role"
              placeholder="For example, Owner or Operations manager"
              value={values.managerRole}
              onChange={(e: any) => onChange("managerRole", e.target.value)}
            />
            <InputField
              name="notifyEmail"
              label="Business contact email"
              placeholder="Enter your business email address"
              inputType="email"
              value={values.notifyEmail}
              onChange={(e: any) => onChange("notifyEmail", e.target.value)}
            />
            <InputField
              name="businessPhone"
              label="Business contact phone"
              placeholder="Enter your business phone number"
              inputType="phone"
              value={values.businessPhone}
              onChange={(e: any) => onChange("businessPhone", e.target.value)}
            />
            <InputField
              name="nin"
              label="NIN"
              placeholder="Enter your 11-digit NIN"
              inputType="nin"
              value={values.nin}
              onChange={(e: any) => onChange("nin", e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Your NIN is reviewed before complimentary guest verification
              credits are added to your account.
            </p>
            <Button
              type="submit"
              variant="darkPrimary"
              size="large"
              className="block w-full mt-2 font-medium text-[16px]"
              isLoading={saving}
            >
              Save and continue
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ManagerOnboardPage() {
  return (
    <ManagerProtectedRoute>
      <ManagerBusinessProfileForm />
    </ManagerProtectedRoute>
  );
}
