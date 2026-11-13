"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";

const STORAGE_KEY = "nrv-data-use-notice-seen";

const DATA_USES = [
  "Create and manage your account",
  "Verify tenant identity and generate screening reports",
  "List properties and support rental applications",
  "Process payments and keep financial records",
  "Enable messages between landlords and tenants",
  "Send service notifications and security alerts",
  "Improve the platform and meet legal requirements",
];

const isPolicyRoute = (pathname: string | null) => {
  if (!pathname) {
    return false;
  }
  return (
    pathname === "/privacy" ||
    pathname.startsWith("/legal") ||
    pathname.startsWith("/guest-check")
  );
};

const DataUseNotice = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (isPolicyRoute(pathname)) {
      return;
    }
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      return;
    }
    setIsOpen(true);
  }, [pathname]);

  const handleAcknowledge = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="data-use-notice-title"
      aria-describedby="data-use-notice-description"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E9F4E7]">
            <Shield className="h-5 w-5 text-[#03442C]" aria-hidden />
          </div>
          <div>
            <h2
              id="data-use-notice-title"
              className="text-lg font-semibold text-[#03442C]"
            >
              How we use your data
            </h2>
            <p
              id="data-use-notice-description"
              className="mt-2 text-sm leading-relaxed text-gray-600"
            >
              NaijaRentVerify collects and uses personal data only to provide
              rental verification and property services. We do not sell your data.
            </p>
          </div>
        </div>

        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          {DATA_USES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <p className="mt-4 text-xs leading-relaxed text-gray-500">
          You can read the full{" "}
          <Link
            href="/legal/privacy"
            className="font-medium text-[#03442C] underline underline-offset-2"
          >
            Privacy Notice
          </Link>{" "}
          and{" "}
          <Link
            href="/legal/data-processing"
            className="font-medium text-[#03442C] underline underline-offset-2"
          >
            Data Processing Policy
          </Link>
          .
        </p>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleAcknowledge}
            className="min-h-[44px] rounded-full bg-[#03442C] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#022f21]"
            aria-label="I understand how my data is used"
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataUseNotice;
