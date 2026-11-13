"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";
import { fetchPlans } from "../../../../../redux/slices/plansSlice";
import LandLordLayout from "@/app/components/layout/LandLordLayout";
import ProtectedRoute from "@/app/components/guard/LandlordProtectedRoute";
import { RootState } from "../../../../../redux/store";
import { API_URL } from "../../../../../config/constant";
import { getVerificationCreditBalances } from "@/helpers/verificationCredits";
import TierFeatureList from "@/app/components/shared/TierFeatureList";
import { calculatePackPricing } from "@/helpers/paymentPricing";

const MAX_CREDIT_QTY = 999;
const PAYMENT_HISTORY_PAGE_SIZE = 10;

function fallbackUnitPrice(plan: { slug?: string; unitPriceNaira?: number }) {
  if (plan.unitPriceNaira != null && plan.unitPriceNaira > 0) return plan.unitPriceNaira;
  return plan.slug === "premium" ? 25_000 : 15_000;
}

function friendlyPlanDescription(isPremium: boolean) {
  if (isPremium) {
    return "Everything in Standard verification, plus Credit Score (Affordability) to check if the tenant can realistically sustain the rent.";
  }
  return "Identity verification and Criminal/Fraud history checks to help you confidently screen a tenant before renting.";
}

interface PaymentRecord {
  _id: string;
  reference?: string;
  planId?: string;
  planName?: string;
  amountNaira: number;
  quantity?: number;
  status: string;
  paidAt?: string;
  createdAt?: string;
}

const formatPaymentDate = (payment: PaymentRecord) => {
  if (payment.paidAt) {
    return new Date(payment.paidAt).toLocaleDateString();
  }
  if (payment.createdAt) {
    return new Date(payment.createdAt).toLocaleDateString();
  }
  return "—";
};

const PaymentStatusBadge = ({ status }: { status: string }) => {
  const label =
    status === "success" ? "Paid" : status === "failed" ? "Failed" : status;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        status === "success"
          ? "bg-green-100 text-green-800"
          : status === "failed"
            ? "bg-red-100 text-red-800"
            : status === "pending"
              ? "bg-amber-100 text-amber-900"
              : "bg-gray-100 text-gray-700"
      }`}
    >
      {label}
    </span>
  );
};

interface PaymentHistoryListProps {
  payments: PaymentRecord[];
  resumingReference: string | null;
  onResume: (payment: PaymentRecord) => void;
}

const PaymentHistoryList = ({
  payments,
  resumingReference,
  onResume,
}: PaymentHistoryListProps) => (
  <>
    {/* Mobile: card layout */}
    <div className="md:hidden divide-y divide-gray-100">
      {payments.map((p) => {
        const isPending = p.status === "pending" && !!p.reference;
        const isResuming = resumingReference === p.reference;

        return (
          <div
            key={p._id}
            className={`p-4 ${isPending ? "bg-amber-50/40" : "bg-white"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">
                  {p.planName ?? "Pack"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatPaymentDate(p)} · {p.quantity ?? 1} verification
                  {(p.quantity ?? 1) === 1 ? "" : "s"}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-gray-900 tabular-nums">
                ₦{(p.amountNaira ?? 0).toLocaleString()}
              </p>
            </div>

            <div className="mt-3">
              <PaymentStatusBadge status={p.status} />
            </div>

            {isPending && (
              <button
                type="button"
                disabled={isResuming}
                onClick={() => onResume(p)}
                className="mt-3 w-full rounded-lg bg-amber-700 py-2.5 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60"
              >
                {isResuming ? "Opening checkout…" : "Continue payment"}
              </button>
            )}
          </div>
        );
      })}
    </div>

    {/* Desktop: table */}
    <table className="hidden md:table w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Plan</th>
          <th className="text-right py-3 px-4 font-medium text-gray-700">
            Verifications
          </th>
          <th className="text-right py-3 px-4 font-medium text-gray-700">Amount</th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
        </tr>
      </thead>
      <tbody>
        {payments.map((p) => {
          const isPending = p.status === "pending";
          const isResuming = resumingReference === p.reference;

          return (
            <tr
              key={p._id}
              className={`border-b border-gray-100 last:border-0 ${
                isPending && p.reference ? "hover:bg-amber-50/60" : ""
              }`}
            >
              <td className="py-3 px-4 text-gray-600">{formatPaymentDate(p)}</td>
              <td className="py-3 px-4 text-gray-900">{p.planName ?? "Pack"}</td>
              <td className="py-3 px-4 text-right text-gray-600">{p.quantity ?? 1}</td>
              <td className="py-3 px-4 text-right text-gray-900 tabular-nums">
                ₦{(p.amountNaira ?? 0).toLocaleString()}
              </td>
              <td className="py-3 px-4">
                {isPending && p.reference ? (
                  <button
                    type="button"
                    disabled={isResuming}
                    onClick={() => onResume(p)}
                    className="inline-flex items-center rounded-md bg-amber-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-800 disabled:opacity-60"
                  >
                    {isResuming ? "Opening…" : "Continue"}
                  </button>
                ) : (
                  <PaymentStatusBadge status={p.status} />
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </>
);

const PlansPage = () => {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const { plans: allPlans, loading } = useSelector((state: RootState) => state.plans);
  const plans = useMemo(
    () =>
      (Array.isArray(allPlans) ? allPlans : []).filter(
        (plan: any) => plan?.slug !== "shortlet",
      ),
    [allPlans],
  );
  const user = useSelector((state: RootState) => state.user.data);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [quantityByPlanId, setQuantityByPlanId] = useState<Record<string, number>>({});
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [resumingReference, setResumingReference] = useState<string | null>(null);
  const prevUserIdRef = useRef<string | undefined>();

  const preferredTier = searchParams.get("tier");
  const insufficientCredits = searchParams.get("reason") === "insufficient_credits";

  const historyTotalPages =
    historyTotal === 0 ? 0 : Math.ceil(historyTotal / PAYMENT_HISTORY_PAGE_SIZE);

  const pendingPayments = useMemo(
    () => paymentHistory.filter((p) => p.status === "pending" && p.reference),
    [paymentHistory],
  );

  const [latestPending, setLatestPending] = useState<PaymentRecord | null>(null);

  const userDoc = user?.user ?? user;
  const userId = userDoc?._id ?? (user as any)?._id;

  const creditBalances = useMemo(() => {
    if (userDoc && (userDoc as { _id?: string })?._id) {
      return getVerificationCreditBalances(userDoc);
    }
    if (typeof window === "undefined") return { standard: 0, premium: 0, shortlet: 0 };
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

  const refreshPaymentHistory = (page = historyPage) => {
    if (!userId) {
      return;
    }
    setHistoryLoading(true);
    axios
      .get(`${API_URL}/payments/history/${userId}`, {
        params: { page, limit: PAYMENT_HISTORY_PAGE_SIZE },
      })
      .then((res) => {
        const data = res.data?.data ?? res.data;
        const pagination = res.data?.pagination;
        setPaymentHistory(Array.isArray(data) ? data : []);
        setHistoryTotal(pagination?.total ?? (Array.isArray(data) ? data.length : 0));
        if (pagination?.page) {
          setHistoryPage(pagination.page);
        }
      })
      .catch(() => {
        setPaymentHistory([]);
        setHistoryTotal(0);
      })
      .finally(() => setHistoryLoading(false));
  };

  const refreshPendingPayment = () => {
    if (!userId) {
      setLatestPending(null);
      return;
    }
    axios
      .get(`${API_URL}/payments/pending/${userId}`)
      .then((res) => {
        const data = res.data?.data ?? null;
        setLatestPending(data?.reference ? data : null);
      })
      .catch(() => setLatestPending(null));
  };

  useEffect(() => {
    if (!userId) {
      setPaymentHistory([]);
      setHistoryTotal(0);
      return;
    }

    if (prevUserIdRef.current !== userId) {
      prevUserIdRef.current = userId;
      if (historyPage !== 1) {
        setHistoryPage(1);
        return;
      }
    }

    refreshPaymentHistory(historyPage);
    refreshPendingPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, historyPage]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && userId) {
        refreshPaymentHistory(historyPage);
        refreshPendingPayment();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, historyPage]);

  const resumePaymentByReference = async (reference: string) => {
    if (!userId) {
      return;
    }
    setResumingReference(reference);
    try {
      const res = await axios.post(`${API_URL}/payments/resume/${reference}`, {
        userId,
      });
      const payload = res.data?.data ?? res.data;
      const authUrl = payload?.authorization_url;
      if (authUrl) {
        window.location.href = authUrl;
        return;
      }
      if (payload?.alreadyPaid) {
        toast.success("Payment already completed. Credits are on your account.");
        refreshPaymentHistory();
        refreshPendingPayment();
        return;
      }
      toast.error(res.data?.message || "Could not resume payment.");
      refreshPaymentHistory();
      refreshPendingPayment();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Payment expired. Please start a new purchase.",
      );
      refreshPaymentHistory();
      refreshPendingPayment();
    } finally {
      setResumingReference(null);
    }
  };

  const handleResumePayment = async (payment: PaymentRecord) => {
    if (!payment.reference || payment.status !== "pending") {
      return;
    }
    await resumePaymentByReference(payment.reference);
  };

  const bannerPending = latestPending ?? pendingPayments[0] ?? null;

  const getQuantity = (planId: string) => quantityByPlanId[planId] ?? 1;
  const setQuantity = (planId: string, value: number) => {
    const q = Math.max(1, Math.min(MAX_CREDIT_QTY, Math.floor(value)));
    setQuantityByPlanId((prev) => ({ ...prev, [planId]: q }));
  };

  const handlePurchase = async (
    planId: string,
    unitPriceNaira: number,
    creditsPerUnit: number,
  ) => {
    if (!userId) return;
    const quantity = getQuantity(planId);
    const pricing = calculatePackPricing(quantity, unitPriceNaira);
    const amountNaira = pricing.totalNaira;
    if (quantity * creditsPerUnit < 1) {
      toast.error("Invalid plan configuration.");
      return;
    }
    setPurchasingPlanId(planId);
    try {
      const res = await axios.post(`${API_URL}/payments/initialize-pack`, {
        userId,
        planId,
        amountNaira,
        quantity,
      });
      const data = res.data?.data || res.data;
      const authUrl = data?.authorization_url;
      const reference = data?.reference;
      if (!authUrl) {
        throw new Error("Could not get Paystack authorization URL.");
      }
      if (reference) {
        sessionStorage.setItem("nrv-pending-payment-ref", reference);
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
    <ProtectedRoute>
      <LandLordLayout path="Buy verification credit" mainPath="Settings" subMainPath="Buy verification credit">
        <div className="max-w-4xl mx-auto px-4 py-5 sm:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              Verification credits
            </h1>
            <p className="text-gray-600">
              Choose Standard for a full tenant check, or Premium for the same plus affordability.
              Price is per verification; totals update when you change the number of verifications.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-[#03442C]/20 bg-[#03442C]/[0.06] px-4 py-3 text-sm text-gray-800">
              <span className="font-semibold text-[#03442C]">Your verification credits</span>
              <span className="text-gray-700">
                Standard{" "}
                <strong className="text-gray-900 tabular-nums">{creditBalances.standard}</strong>
                <span className="text-gray-400 mx-2">·</span>
                Premium{" "}
                <strong className="text-gray-900 tabular-nums">{creditBalances.premium}</strong>
              </span>
            </div>
            {insufficientCredits && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                You do not have enough{" "}
                {preferredTier === "premium" ? "Premium" : preferredTier === "standard" ? "Standard" : ""}{" "}
                verification credits for that request. Purchase credits below to continue.
              </div>
            )}
          </div>

          {bannerPending?.reference && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-950">
                  Incomplete payment
                </p>
                <p className="text-sm text-amber-900/80 mt-0.5">
                  {bannerPending.planName ?? "Verification credits"} · ₦
                  {(bannerPending.amountNaira ?? 0).toLocaleString()} — you can
                  continue checkout within 30 minutes.
                </p>
              </div>
              <button
                type="button"
                disabled={resumingReference === bannerPending.reference}
                onClick={() => resumePaymentByReference(bannerPending.reference!)}
                className="w-full sm:w-auto shrink-0 rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60"
              >
                {resumingReference === bannerPending.reference
                  ? "Opening…"
                  : "Continue payment"}
              </button>
            </div>
          )}

          {loading === "pending" ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-green-600"></div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {plans.map((plan: any) => {
                const isPremium = plan.slug === "premium";
                const stdAdd = plan.standardVerificationAdded ?? 0;
                const premAdd = plan.premiumVerificationAdded ?? 0;
                const creditsPerUnit = isPremium ? premAdd || 1 : stdAdd || 1;
                const unitPrice = fallbackUnitPrice(plan);
                const quantity = getQuantity(plan._id);
                const totalCredits = quantity * creditsPerUnit;
                const pricing = calculatePackPricing(quantity, unitPrice);

                return (
                  <div
                    key={plan._id}
                    className={`relative flex flex-col rounded-xl border p-6 bg-white ${
                      preferredTier === plan.slug
                        ? "border-green-500 ring-2 ring-green-200"
                        : isPremium
                          ? "border-green-300"
                          : "border-gray-200"
                    }`}
                  >
                    {isPremium && (
                      <span className="inline-block text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded mb-3">
                        Recommended
                      </span>
                    )}

                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      {friendlyPlanDescription(isPremium)}
                    </p>
                    <TierFeatureList
                      tier={isPremium ? "premium" : "standard"}
                      premiumAddonsOnly={isPremium}
                      className="mb-6"
                    />

                    <div className="mt-auto space-y-3">
                      <div className="rounded-xl border border-[#03442C]/20 bg-[#03442C]/[0.06] px-4 py-3 text-sm text-gray-800">
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-600">Price / verification</span>
                          <span className="font-semibold">
                            ₦{pricing.displayUnitPriceNaira.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2 mt-1">
                          <span className="text-gray-600">Verifications</span>
                          <span className="font-semibold">
                            {totalCredits.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2 mt-1">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-semibold">
                            ₦{pricing.displaySubtotalNaira.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2 mt-1">
                          <span className="text-gray-600">VAT (7.5%)</span>
                          <span className="font-semibold">
                            ₦{pricing.vatNaira.toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-[#03442C]/15 flex justify-between items-center">
                          <span className="font-medium text-[#03442C]">Total</span>
                          <span className="text-lg font-bold text-gray-900">
                            ₦{pricing.totalNaira.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm text-gray-600">Number of Verifications</span>
                        <div className="flex items-center gap-2 border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            disabled={purchasingPlanId === plan._id || quantity <= 1}
                            onClick={() => setQuantity(plan._id, quantity - 1)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
                            aria-label="Decrease number of verifications"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={MAX_CREDIT_QTY}
                            disabled={purchasingPlanId === plan._id}
                            value={quantity}
                            onChange={(e) =>
                              setQuantity(plan._id, Number(e.target.value) || 1)
                            }
                            aria-label="Number of verifications"
                            className="w-14 text-center font-medium border-0 focus:ring-0 bg-transparent py-1.5 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            disabled={
                              purchasingPlanId === plan._id || quantity >= MAX_CREDIT_QTY
                            }
                            onClick={() => setQuantity(plan._id, quantity + 1)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
                            aria-label="Increase number of verifications"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={purchasingPlanId === plan._id}
                        onClick={() =>
                          handlePurchase(plan._id, unitPrice, creditsPerUnit)
                        }
                        className="w-full py-2.5 px-4 rounded-lg font-medium bg-gray-900 hover:bg-gray-800 text-white text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {purchasingPlanId === plan._id
                          ? "Processing…"
                          : `Pay ₦${pricing.totalNaira.toLocaleString()}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Purchase history</h2>
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-green-600"></div>
              </div>
            ) : paymentHistory.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No purchases yet.</p>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <PaymentHistoryList
                  payments={paymentHistory}
                  resumingReference={resumingReference}
                  onResume={handleResumePayment}
                />
                {historyTotal > PAYMENT_HISTORY_PAGE_SIZE && (
                  <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-gray-600">
                      Showing{" "}
                      {(historyPage - 1) * PAYMENT_HISTORY_PAGE_SIZE + 1}–
                      {Math.min(historyPage * PAYMENT_HISTORY_PAGE_SIZE, historyTotal)}{" "}
                      of {historyTotal}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={historyPage <= 1 || historyLoading}
                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Previous page"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600 tabular-nums">
                        Page {historyPage} of {Math.max(1, historyTotalPages)}
                      </span>
                      <button
                        type="button"
                        disabled={historyPage >= historyTotalPages || historyLoading}
                        onClick={() =>
                          setHistoryPage((p) => Math.min(historyTotalPages, p + 1))
                        }
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Next page"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </LandLordLayout>
    </ProtectedRoute>
  );
};

export default PlansPage;
