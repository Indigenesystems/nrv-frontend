"use client";

import { useState, useEffect, useMemo } from "react";
import LandLordSideBar from "../shared/navigations/LandLordSideBar";
import { FiMenu, FiX } from "react-icons/fi";
import { usePathname } from "next/navigation";
import { NotificationBell } from "@/app/components/notifications/NotificationBell";
import { useSessionIdleTimeout } from "@/lib/hooks/useSessionIdleTimeout";
import UserAvatar from "@/app/components/shared/UserAvatar";
import DashboardBackButton from "@/app/components/shared/DashboardBackButton";
import { readStoredUserProfile } from "@/lib/userProfile";

interface LandLordLayoutProps {
  children: React.ReactNode;
  mainPath?: string;
  path?: string;
  subMainPath?: string;
  comingSoon?: boolean;
}

const LandLordLayout: React.FC<LandLordLayoutProps> = ({
  children,
  mainPath,
  path,
  subMainPath,
  comingSoon = false,
}) => {
  useSessionIdleTimeout(true);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const load = () => {
      const profile = readStoredUserProfile();
      if (!profile) {
        setUser(null);
        return;
      }
      setUser({
        name: profile.name,
        role: profile.role,
        avatarUrl: profile.avatarUrl,
      });
    };
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "nrv-user") {
        load();
      }
    };
    const onUserUpdated = () => load();
    window.addEventListener("storage", onStorage);
    window.addEventListener("nrv-user-updated", onUserUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("nrv-user-updated", onUserUpdated);
    };
  }, [pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  const showDashboardBack = useMemo(() => {
    const segments = (pathname ?? "").split("/").filter(Boolean);
    return segments.length > 3;
  }, [pathname]);

  return (
    <div className="relative flex h-screen min-h-0 min-w-0 max-w-full flex-col overflow-x-hidden">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[100] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(100%,300px)] max-w-full flex-col bg-nrvPrimaryGreen shadow-xl">
            <div className="absolute right-2 top-2 z-10">
              <button
                type="button"
                className="rounded-lg p-2 text-white hover:bg-white/10"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiX size={22} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <LandLordSideBar isOpen={true} />
            </div>
          </div>
        </div>
      )}

      {/* Layout Content */}
      <div className="flex min-h-0 h-full min-w-0 w-full max-w-full flex-1 bg-white overflow-hidden">
        {/* Sidebar - Desktop — full viewport column height */}
        <div className="hidden min-h-0 h-full w-64 shrink-0 self-stretch bg-nrvPrimaryGreen lg:flex lg:flex-col">
          <LandLordSideBar isOpen={true} />
        </div>

        {/* Main Content */}
        <div className="relative h-full min-w-0 w-full max-w-full flex-1 overflow-y-auto">
          {/* Header – responsive padding */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 bg-white shadow-sm sticky top-0 z-30">
            <div className="flex w-full min-w-0 items-center gap-2 sm:gap-3">
                {showDashboardBack && (
                  <DashboardBackButton fallbackHref="/dashboard/landlord" />
                )}
                <button
                  type="button"
                  className="shrink-0 rounded-lg p-2.5 text-nrvPrimaryGreen hover:bg-[#E9F4E7] touch-manipulation lg:hidden"
                  aria-label="Open navigation menu"
                  aria-expanded={mobileMenuOpen}
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <FiMenu size={22} />
                </button>
                {/* Breadcrumbs */}
                <nav
                  aria-label="Breadcrumb"
                  className="text-gray-500 flex min-w-0 flex-1 items-center gap-x-1 overflow-hidden text-xs sm:text-sm"
                >
                <svg
                  className="shrink-0 block"
                  width="22"
                  height="18"
                  viewBox="0 0 25 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12.0298 4.09045C11.1116 3.44772 9.88947 3.44771 8.97129 4.09045L4.38624 7.29998C3.61382 7.84067 3.18434 8.74905 3.25666 9.68913L3.72667 15.7993C3.81531 16.9517 4.85945 17.7892 6.00362 17.6258L8.1167 17.3239C9.10199 17.1832 9.83385 16.3393 9.83385 15.344V14.5004C9.83385 14.1322 10.1323 13.8338 10.5005 13.8338C10.8687 13.8338 11.1672 14.1322 11.1672 14.5004V15.344C11.1672 16.3393 11.899 17.1832 12.8843 17.3239L14.9974 17.6258C16.1416 17.7892 17.1857 16.9517 17.2744 15.7993L17.7444 9.68913C17.8167 8.74905 17.3872 7.84067 16.6148 7.29998L12.0298 4.09045ZM9.7359 5.18276C10.195 4.86139 10.806 4.86139 11.2651 5.18276L15.8502 8.39229C16.2364 8.66264 16.4511 9.11683 16.415 9.58686L15.945 15.697C15.9154 16.0812 15.5674 16.3603 15.186 16.3059L13.0729 16.004C12.7445 15.9571 12.5005 15.6758 12.5005 15.344V14.5004C12.5005 13.3959 11.6051 12.5004 10.5005 12.5004C9.39595 12.5004 8.50052 13.3959 8.50052 14.5004V15.344C8.50052 15.6758 8.25657 15.9571 7.92813 16.004L5.81506 16.3059C5.43367 16.3603 5.08562 16.0812 5.05607 15.697L4.58606 9.58686C4.5499 9.11683 4.76465 8.66264 5.15085 8.39229L9.7359 5.18276Z"
                    fill="#667185"
                  />
                </svg>

                <span className="min-w-0 truncate text-[#333333]">
                  <span className="text-gray-400">&gt; </span>
                  {path && <span>{path}</span>}
                  {subMainPath && <span className="text-gray-400"> / </span>}
                  {mainPath && (
                    <a
                      href="#"
                      className="hover:text-gray-900"
                      onClick={(e) => e.preventDefault()}
                    >
                      {mainPath}
                    </a>
                  )}
                  {subMainPath && (
                    <>
                      <span className="text-gray-400"> / </span>
                      <span>{subMainPath}</span>
                    </>
                  )}
                </span>
                </nav>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3 pl-1">
                <div className="flex min-w-0 max-w-[38vw] sm:max-w-[11rem] items-center gap-2">
                  <UserAvatar
                    src={user?.avatarUrl}
                    name={user?.name}
                    size="sm"
                  />
                  <span className="truncate text-sm text-gray-700">
                    {user?.name}
                  </span>
                </div>
                <NotificationBell />
              </div>
            </div>
          </div>

          {/* Main Content Body – consistent padding, extra bottom on mobile for nav */}
          <main className="min-h-[calc(100vh-80px)] min-w-0 w-full max-w-full bg-white px-2 py-3 pb-6 sm:px-4 sm:py-4 md:px-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default LandLordLayout;
