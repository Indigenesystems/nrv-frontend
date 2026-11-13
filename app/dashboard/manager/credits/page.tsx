"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { fetchPlans } from "@/redux/slices/plansSlice";
import ManagerLayout from "@/app/components/layout/ManagerLayout";
import { RootState } from "@/redux/store";
import { API_URL } from "@/config/constant";
import { getVerificationCreditBalances } from "@/helpers/verificationCredits";
import { calculatePackPricing } from "@/helpers/paymentPricing";

const MAX_CREDIT_QTY = 999;

export default function ManagerCreditsPage() {
  const dispatch = useDispatch();
  const { plans, loading } = useSelector((state: RootState) => state.plans);
  const user = useSelector((state: RootState) => state.user.data);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const userDoc = user?.user ?? user;
  const userId = userDoc?._id ?? (user as any)?._id;
  const shortletPlan = useMemo(
    () =>
      (Array.isArray(plans) ? plans : []).find(
        (plan: any) => plan?.slug === "shortlet",
      ),
    [plans],
  );
  const creditBalances = useMemo(() => {
    if (userDoc && (userDoc as { _id?: string })?._id) {
      return getVerificationCreditBalances(userDoc);
    }
    try {
      const raw = localStorage.getItem("nrv-user");
      return getVerificationCreditBalances(raw ? JSON.parse(raw)?.user : null);
    } catch {
      return { standard: 0, premium: 0, shortlet: 0 };
    }
  }, [user, userDoc]);

  useEffect(() => {
    dispatch(fetchPlans() as any);
  }, [dispatch]);

  const unitPrice = Number(shortletPlan?.unitPriceNaira || 15000);
  const pricing = calculatePackPricing(quantity, unitPrice);

  const handlePurchase = async () => {
    if (!userId || !shortletPlan?._id) return;
    setPurchasingPlanId(shortletPlan._id);
    try {
      const stored = localStorage.getItem("nrv-user");
      const token = stored ? JSON.parse(stored)?.accessToken : undefined;
      const res = await axios.post(
        `${API_URL}/payments/initialize-pack`,
        {
          userId,
          planId: shortletPlan._id,
          amountNaira: pricing.totalNaira,
          quantity,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      const data = res.data?.data || res.data;
      const authUrl = data?.authorization_url;
      if (!authUrl) {
        throw new Error("Could not get Paystack authorization URL.");
      }
      window.location.href = authUrl;
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to start payment.",
      );
      setPurchasingPlanId(null);
    }
  };

  return (
    <ManagerLayout mainPath="Buy shortlet credits">
      <div className="mx-auto max-w-3xl px-4 py-5 sm:p-6">
        <h1 className="mb-1 text-2xl font-semibold text-gray-900">
          Shortlet identity credits
        </h1>
        <p className="text-gray-600">
          Each credit runs one guest identity check (NIN and live selfie). Tenant
          screening packs are not available on this account. Unused invites do
          not consume a credit.
        </p>
        <div className="mt-4 rounded-xl border border-[#03442C]/20 bg-[#03442C]/[0.06] px-4 py-3 text-sm text-gray-800">
          Remaining credits:{" "}
          <strong className="tabular-nums">{creditBalances.shortlet}</strong>
        </div>

        {loading === "pending" ? (
          <div className="mt-10 flex justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
          </div>
        ) : !shortletPlan ? (
          <p className="mt-8 text-gray-500">Shortlet pack is not available yet.</p>
        ) : (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {shortletPlan.name || "Shortlet guest identity"}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              ₦{unitPrice.toLocaleString()} per guest check.
            </p>
            <label className="mt-4 block text-sm text-gray-700">
              Number of checks
              <input
                type="number"
                min={1}
                max={MAX_CREDIT_QTY}
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    Math.max(
                      1,
                      Math.min(MAX_CREDIT_QTY, Number(event.target.value) || 1),
                    ),
                  )
                }
                className="mt-2 w-28 rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <p className="mt-3 text-sm font-medium text-[#03442C]">
              Total ₦{pricing.totalNaira.toLocaleString()}
            </p>
            <button
              type="button"
              disabled={Boolean(purchasingPlanId)}
              onClick={() => void handlePurchase()}
              className="mt-5 rounded-lg bg-[#03442C] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {purchasingPlanId ? "Opening checkout…" : "Buy credits"}
            </button>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
