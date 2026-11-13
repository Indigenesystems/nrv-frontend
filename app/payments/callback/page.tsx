"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import axios from "axios";
import { API_URL, LANDLORD_VERIFICATION_REQUEST_PATH } from "@/config/constant";
import { toast } from "react-toastify";
import { setUserFromPayment } from "@/redux/slices/userSlice";
import {
  getSessionAccountType,
  isShortletManagerAccount,
} from "@/lib/authSession";

const creditsHome = () =>
  isShortletManagerAccount(getSessionAccountType())
    ? "/dashboard/manager/credits"
    : "/dashboard/landlord/settings/plans";

type CallbackState = "verifying" | "success" | "incomplete" | "error";

const getStoredUserId = (): string | undefined => {
  try {
    const raw = localStorage.getItem("nrv-user");
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw);
    return parsed?.user?._id ?? parsed?._id;
  } catch {
    return undefined;
  }
};

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const [state, setState] = useState<CallbackState>("verifying");
  const [verificationUrl, setVerificationUrl] = useState<string>(
    LANDLORD_VERIFICATION_REQUEST_PATH,
  );
  const [reference, setReference] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);

  const handleContinuePayment = async () => {
    const userId = getStoredUserId();
    if (!reference || !userId) {
      router.push(creditsHome());
      return;
    }

    setResuming(true);
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
      toast.error(res.data?.message || "Could not resume payment.");
      router.push(creditsHome());
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Could not resume payment.",
      );
      router.push(creditsHome());
    } finally {
      setResuming(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      const paymentReference = searchParams.get("reference");
      if (!paymentReference) {
        toast.error("Missing payment reference.");
        setState("error");
        return;
      }
      setReference(paymentReference);

      try {
        const res = await axios.post(
          `${API_URL}/payments/verify/${paymentReference}`,
        );
        const payload = res.data?.data ?? res.data;
        const updatedUser = payload?.user ?? res.data?.user;
        const nextUrl =
          payload?.verificationRequestUrl ?? LANDLORD_VERIFICATION_REQUEST_PATH;
        setVerificationUrl(nextUrl);

        if (updatedUser) {
          const stored = localStorage.getItem("nrv-user");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              localStorage.setItem(
                "nrv-user",
                JSON.stringify({
                  ...parsed,
                  user: updatedUser,
                }),
              );
            } catch {
              // ignore
            }
          }
          dispatch(setUserFromPayment({ user: updatedUser }));
        }

        toast.success("Payment successful. Your credits have been updated.");
        setState("success");
      } catch (err: any) {
        const code = err?.response?.data?.code;
        if (code === "payment_incomplete") {
          setState("incomplete");
          return;
        }
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Could not verify payment.",
        );
        setState("error");
      }
    };

    run();
  }, [searchParams, dispatch]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow-md rounded-xl px-6 py-8 max-w-md w-full text-center">
        {state === "verifying" && (
          <>
            <h1 className="text-xl font-semibold mb-2">Verifying payment…</h1>
            <p className="text-gray-600 mb-4">
              Please wait while we confirm your transaction with Paystack.
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-green-600" />
            </div>
          </>
        )}

        {state === "success" && (
          <>
            <h1 className="text-xl font-semibold mb-2 text-[#03442C]">
              Payment successful
            </h1>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              {isShortletManagerAccount(getSessionAccountType())
                ? "Your shortlet identity credits are on your account."
                : "Your verification credits are on your account. You can start a tenant verification right away."}
            </p>
            <div className="flex flex-col gap-3">
              {isShortletManagerAccount(getSessionAccountType()) ? null : (
                <Link
                  href={verificationUrl}
                  className="inline-flex items-center justify-center rounded-xl bg-[#03442C] text-white font-semibold py-3 px-4 hover:bg-[#022f21] transition-colors"
                >
                  Start verification
                </Link>
              )}
              <Link
                href={creditsHome()}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 text-gray-800 font-medium py-3 px-4 hover:bg-gray-50 transition-colors text-sm"
              >
                Back to credits
              </Link>
            </div>
          </>
        )}

        {state === "incomplete" && (
          <>
            <h1 className="text-xl font-semibold mb-2">Payment not completed</h1>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              You closed checkout before paying. Your order is still saved — continue
              whenever you are ready (within 30 minutes).
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={resuming}
                onClick={handleContinuePayment}
                className="w-full rounded-xl bg-[#03442C] text-white font-semibold py-3 px-4 hover:bg-[#022f21] transition-colors disabled:opacity-60"
              >
                {resuming ? "Opening checkout…" : "Continue payment"}
              </button>
              <Link
                href={creditsHome()}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 text-gray-800 font-medium py-3 px-4 hover:bg-gray-50 transition-colors text-sm"
              >
                Back to credits
              </Link>
            </div>
          </>
        )}

        {state === "error" && (
          <>
            <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6 text-sm">
              We could not complete verification. Return to credits to continue an
              incomplete payment or start a new purchase.
            </p>
            <button
              type="button"
              onClick={() => router.push(creditsHome())}
              className="w-full rounded-xl bg-[#03442C] text-white font-semibold py-3 px-4 hover:bg-[#022f21] transition-colors"
            >
              Back to credits
            </button>
          </>
        )}
      </div>
    </div>
  );
}
