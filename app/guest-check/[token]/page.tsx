"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DojahLivenessWidget from "@/app/components/guest-check/DojahLivenessWidget";
import GuestSelfieCapture from "@/app/components/guest-check/GuestSelfieCapture";
import {
  completeGuestInvite,
  consentGuestInvite,
  fetchGuestInvite,
} from "@/lib/guestVerificationApi";
import { DOJAH_APP_ID, DOJAH_PUBLIC_KEY } from "@/lib/dojahWidget";

type Invite = {
  guestName?: string;
  managerName?: string;
  checkInLabel?: string;
  consented?: boolean;
  completed?: boolean;
  status?: string;
  widget?: {
    configured?: boolean;
    appId?: string;
    publicKey?: string;
    widgetId?: string;
    type?: string;
    referenceId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
};

export default function GuestCheckPage() {
  const params = useParams();
  const token = String(params?.token || "");
  const [invite, setInvite] = useState<Invite | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [nin, setNin] = useState("");
  const [selfie, setSelfie] = useState("");
  const [busy, setBusy] = useState(false);
  const [livenessOpen, setLivenessOpen] = useState(false);

  const widgetReady = Boolean(
    invite?.widget?.configured ||
      invite?.widget?.appId ||
      (DOJAH_APP_ID && DOJAH_PUBLIC_KEY),
  );

  useEffect(() => {
    if (!token) {
      return;
    }
    fetchGuestInvite(token)
      .then((data) => {
        setInvite(data);
        if (data?.completed) {
          setStep(4);
        } else if (data?.consented) {
          setStep(2);
        }
      })
      .catch((err: any) => {
        setError(
          err?.response?.data?.message ||
            "This link is not valid or has expired.",
        );
      });
  }, [token]);

  const consent = async () => {
    setBusy(true);
    setError("");
    try {
      await consentGuestInvite(token);
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not record consent.");
    } finally {
      setBusy(false);
    }
  };

  const finish = useCallback(
    async (opts?: { usedWidget?: boolean; widgetReferenceId?: string }) => {
      const digits = nin.replace(/\D/g, "");
      if (!/^\d{11}$/.test(digits)) {
        setError("NIN must be 11 digits.");
        return;
      }
      setBusy(true);
      setError("");
      try {
        await completeGuestInvite(token, {
          nin: digits,
          usedWidget: opts?.usedWidget,
          widgetReferenceId: opts?.widgetReferenceId,
          selfieImageBase64: opts?.usedWidget ? undefined : selfie,
        });
        setStep(4);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            "We could not complete this identity check.",
        );
      } finally {
        setBusy(false);
        setLivenessOpen(false);
      }
    },
    [nin, selfie, token],
  );

  const submitStill = async () => {
    if (!selfie) {
      setError("Capture a live selfie to continue.");
      return;
    }
    await finish();
  };

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-4 py-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-5 sm:p-6">
        <p className="text-xs font-semibold tracking-wide text-[#03442C]">
          NAIJARENTVERIFY
        </p>
        <h1 className="mt-2 text-xl font-semibold text-[#101828]">
          Guest identity check
        </h1>
        {error ? (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        ) : null}
        {!invite && !error ? (
          <p className="mt-4 text-sm text-gray-500">Loading…</p>
        ) : null}

        {invite && step === 1 ? (
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <p>
              <strong>{invite.managerName}</strong> asked you to confirm your
              identity before check-in on {invite.checkInLabel}.
            </p>
            <p>
              NRV will collect your NIN and a live camera check (you may be
              asked to nod, blink, or turn your head). We send this to our
              identity provider and share only a result summary with the host.
              We do not give the host your NIN, selfie, or biometric images.
            </p>
            <p>
              Records are kept for audit and legal requirements, then removed
              according to NRV’s retention policy.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void consent()}
              className="w-full rounded-full bg-[#03442C] py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              I understand and agree
            </button>
          </div>
        ) : null}

        {invite && step === 2 ? (
          <div className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="font-medium text-gray-700">NIN (11 digits)</span>
              <input
                inputMode="numeric"
                maxLength={11}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5"
                value={nin}
                onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
              />
            </label>
            <button
              type="button"
              disabled={nin.replace(/\D/g, "").length !== 11}
              onClick={() => setStep(3)}
              className="w-full rounded-full bg-[#03442C] py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              Continue
            </button>
          </div>
        ) : null}

        {invite && step === 3 ? (
          <div className="mt-4 space-y-4">
            {widgetReady ? (
              <>
                {!livenessOpen ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setError("");
                      setLivenessOpen(true);
                    }}
                    className="w-full rounded-full bg-[#03442C] py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Start live camera check
                  </button>
                ) : (
                  <DojahLivenessWidget
                    widget={{ ...(invite.widget || {}), nin }}
                    onSuccess={(payload) => {
                      setError("");
                      void finish({
                        usedWidget: true,
                        widgetReferenceId: payload?.referenceId,
                      });
                    }}
                    onError={(message) => {
                      setLivenessOpen(false);
                      setError(message);
                    }}
                  />
                )}
                {busy ? (
                  <p className="text-sm text-gray-500">Checking result…</p>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Take a live selfie. Look at the camera in good light.
                </p>
                <GuestSelfieCapture value={selfie} onCapture={setSelfie} />
                <button
                  type="button"
                  disabled={busy || !selfie}
                  onClick={() => void submitStill()}
                  className="w-full rounded-full bg-[#03442C] py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Submit identity check
                </button>
              </>
            )}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <p>
              Your check has been submitted. The host will see the result and
              decide whether to host you. You can close this page.
            </p>
            <Link href="/" className="inline-block text-[#03442C] font-medium">
              Back to NaijaRentVerify
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
