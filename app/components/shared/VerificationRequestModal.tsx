"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Mail, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { requestVerification } from "@/redux/slices/verificationSlice";
import { getVerificationCreditBalances } from "@/helpers/verificationCredits";
import TierFeatureList from "./TierFeatureList";

const BUY_CREDITS_PATH = "/dashboard/landlord/settings/plans";

export type VerificationRequestContext = {
  firstName?: string;
  lastName?: string;
  email?: string;
  landlordDisplayName?: string;
  applicationId?: string;
  roomId?: string;
  propertyId?: string;
  propertyLabel?: string;
};

type VerificationRequestModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: VerificationRequestContext;
  onSuccess?: () => void;
};

const VerificationRequestModal = ({
  open,
  onOpenChange,
  context,
  onSuccess,
}: VerificationRequestModalProps) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [tier, setTier] = useState<"standard" | "premium">("standard");
  const [landlordDisplayName, setLandlordDisplayName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const creditBalances = useMemo(
    () => getVerificationCreditBalances(user),
    [user],
  );
  const selectedCredits =
    tier === "premium" ? creditBalances.premium : creditBalances.standard;

  const tenantName =
    `${context.firstName ?? ""} ${context.lastName ?? ""}`.trim() || "Tenant";
  const tenantInitials =
    `${context.firstName?.[0] ?? ""}${context.lastName?.[0] ?? ""}`.toUpperCase() ||
    "?";

  useEffect(() => {
    if (!open) {
      return;
    }
    try {
      const stored = localStorage.getItem("nrv-user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed?.user ?? null);
        const fromUser =
          `${parsed?.user?.firstName ?? ""} ${parsed?.user?.lastName ?? ""}`.trim();
        setLandlordDisplayName(
          context.landlordDisplayName || fromUser || "",
        );
      } else {
        setUser(null);
        setLandlordDisplayName(context.landlordDisplayName || "");
      }
    } catch {
      setUser(null);
      setLandlordDisplayName(context.landlordDisplayName || "");
    }
    setTier("standard");
    setFieldErrors({});
  }, [open, context.landlordDisplayName]);

  const redirectToBuyCredits = (selectedTier: "standard" | "premium") => {
    toast.info(
      `You need ${selectedTier} verification credits to send this request. Redirecting to purchase…`,
    );
    onOpenChange(false);
    router.push(
      `${BUY_CREDITS_PATH}?tier=${selectedTier}&reason=insufficient_credits`,
    );
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!context.firstName?.trim()) {
      errors.firstName = "Tenant first name is required";
    }
    if (!context.lastName?.trim()) {
      errors.lastName = "Tenant last name is required";
    }
    if (!context.email?.trim()) {
      errors.email = "Tenant email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(context.email.trim())) {
      errors.email = "Enter a valid tenant email address";
    }
    if (!landlordDisplayName.trim()) {
      errors.landlordDisplayName = "Name shown to tenant is required";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstKey = ["firstName", "lastName", "email", "landlordDisplayName"].find(
        (key) => errors[key],
      );
      toast.error(firstKey ? errors[firstKey] : "Please fix the highlighted fields.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    if (selectedCredits < 1) {
      redirectToBuyCredits(tier);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        firstName: context.firstName,
        lastName: context.lastName,
        email: context.email,
        landlordDisplayName: landlordDisplayName.trim(),
        requestedBy: (user as { _id?: string } | null)?._id,
        verificationTier: tier,
        ...(context.applicationId
          ? { applicationId: context.applicationId }
          : {}),
        ...(context.roomId ? { roomId: context.roomId } : {}),
        ...(context.propertyId ? { propertyId: context.propertyId } : {}),
        ...(context.propertyLabel
          ? { propertyLabel: context.propertyLabel }
          : {}),
      };

      const res = await dispatch(requestVerification(payload) as any).unwrap();
      toast.success(res?.message || "Verification requested successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      const message =
        typeof error === "string"
          ? error
          : error?.message || "Something went wrong.";
      if (/credit/i.test(message)) {
        redirectToBuyCredits(tier);
        return;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-0 sm:rounded-2xl">
        <DialogHeader className="border-b border-gray-100 px-6 py-5 text-left">
          <DialogTitle className="flex items-center gap-2 text-xl text-[#03442C]">
            <ShieldCheck className="h-5 w-5" aria-hidden />
            Request verification
          </DialogTitle>
          <DialogDescription className="text-left text-sm text-gray-600">
            Send a screening invite to this applicant. Choose a tier, then send —
            you&apos;ll stay on this application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E9F4E7] text-sm font-bold text-[#03442C]">
              {tenantInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-gray-900">{tenantName}</p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-gray-600">
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {context.email || "—"}
              </p>
              {(fieldErrors.firstName || fieldErrors.lastName || fieldErrors.email) && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.firstName || fieldErrors.lastName || fieldErrors.email}
                </p>
              )}
            </div>
          </div>

          {context.propertyLabel && (
            <div className="rounded-xl border border-[#03442C]/15 bg-[#03442C]/[0.05] px-4 py-3 text-sm text-gray-800">
              <span className="font-semibold text-[#03442C]">Linked unit: </span>
              {context.propertyLabel}
            </div>
          )}

          <div>
            <label
              htmlFor="landlordDisplayName"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Name shown to tenant
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="landlordDisplayName"
                type="text"
                value={landlordDisplayName}
                onChange={(e) => {
                  setLandlordDisplayName(e.target.value);
                  if (fieldErrors.landlordDisplayName) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.landlordDisplayName;
                      return next;
                    });
                  }
                }}
                placeholder="e.g. Oladipo Michael"
                aria-invalid={Boolean(fieldErrors.landlordDisplayName)}
                className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm outline-none ring-offset-white focus:ring-2 focus:ring-[#03442C]/20 ${
                  fieldErrors.landlordDisplayName
                    ? "border-red-400 focus:border-red-500"
                    : "border-gray-200 focus:border-[#03442C]"
                }`}
              />
            </div>
            {fieldErrors.landlordDisplayName && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.landlordDisplayName}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
            <span className="text-gray-600">
              {tier === "premium" ? "Premium" : "Standard"} credits:{" "}
              <strong className="tabular-nums text-gray-900">
                {selectedCredits}
              </strong>
            </span>
            {selectedCredits < 1 && (
              <button
                type="button"
                onClick={() => redirectToBuyCredits(tier)}
                className="ml-auto text-sm font-medium text-[#03442C] hover:underline"
              >
                Buy credits
              </button>
            )}
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-gray-700">
              Verification tier
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    id: "standard" as const,
                    title: "Standard",
                    blurb:
                      "Identity and criminal/fraud checks before you rent.",
                  },
                  {
                    id: "premium" as const,
                    title: "Premium",
                    blurb:
                      "Everything in Standard, plus credit/affordability.",
                  },
                ] as const
              ).map((option) => {
                const selected = tier === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTier(option.id)}
                    aria-pressed={selected}
                    aria-label={`Select ${option.title} verification`}
                    className={`rounded-xl border-2 p-4 text-left transition ${
                      selected
                        ? "border-[#03442C] bg-[#E9F4E7]/60"
                        : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span
                        className={`text-sm font-bold ${
                          selected ? "text-[#03442C]" : "text-gray-900"
                        }`}
                      >
                        {option.title}
                      </span>
                      {selected && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#03442C]">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        </span>
                      )}
                    </div>
                    <p className="mb-3 text-xs leading-relaxed text-gray-500">
                      {option.blurb}
                    </p>
                    {selected && (
                      <TierFeatureList
                        tier={option.id}
                        premiumAddonsOnly={option.id === "premium"}
                        className="text-xs"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 gap-2 border-t border-gray-100 bg-white px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="text-gray-600"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="min-w-[140px] bg-[#03442C] text-white hover:bg-[#023522]"
          >
            {loading ? "Sending…" : "Send request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationRequestModal;
