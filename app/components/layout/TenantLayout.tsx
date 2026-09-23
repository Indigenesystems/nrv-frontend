"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import { FaMessage } from "react-icons/fa6";
import { RxDashboard } from "react-icons/rx";
import { IoMdHome } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { useRouter, usePathname } from "next/navigation";
import TenantSideBar from "../shared/navigations/TenantSideBar";
import { FaBuilding } from "react-icons/fa";
import { PiFileDocDuotone } from "react-icons/pi";
import {
  FiTool,
  FiCheckCircle,
  FiMenu,
  FiX,
  FiLogOut,
  FiHeadphones,
} from "react-icons/fi";
import { NotificationBell } from "@/app/components/notifications/NotificationBell";
import { useSessionIdleTimeout } from "@/lib/hooks/useSessionIdleTimeout";
import { performLogout } from "@/lib/logout";
import UserAvatar from "@/app/components/shared/UserAvatar";
import DashboardBackButton from "@/app/components/shared/DashboardBackButton";
import { readStoredUserProfile } from "@/lib/userProfile";

const TENANT_MOBILE_LINKS: { name: string; route: string; icon: ReactNode }[] =
  [
    {
      name: "Home",
      route: "/dashboard/tenant",
      icon: <RxDashboard size={20} color="white" />,
    },
    {
      name: "Properties",
      route: "/dashboard/tenant/properties",
      icon: <FaBuilding size={20} color="white" />,
    },
    {
      name: "Applications",
      route: "/dashboard/tenant/properties/applications",
      icon: <PiFileDocDuotone size={20} color="white" />,
    },
    {
      name: "Rented Apartments",
      route: "/dashboard/tenant/rented-properties",
      icon: <IoMdHome size={20} color="white" />,
    },
    {
      name: "Maintenance",
      route: "/dashboard/tenant/properties/maintenance",
      icon: <FiTool size={20} color="white" />,
    },
    {
      name: "My Verifications",
      route: "/dashboard/tenant/verification",
      icon: <FiCheckCircle size={20} color="white" />,
    },
    {
      name: "Messages",
      route: "/dashboard/tenant/messages",
      icon: <FaMessage size={20} color="white" />,
    },
    {
      name: "Settings",
      route: "/dashboard/tenant/settings",
      icon: <IoSettings size={20} color="white" />,
    },
  ];

interface TenantLayoutProps {
  children: React.ReactNode;
  path?: string;
  mainPath?: string;
  subMainPath?: string;
}

const TenantLayout: React.FC<TenantLayoutProps> = ({ children, path, mainPath, subMainPath }) => {
  useSessionIdleTimeout(true);
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerUser, setHeaderUser] = useState<{ name: string; avatarUrl: string } | null>(null);

  useEffect(() => {
    const load = () => {
      const profile = readStoredUserProfile();
      if (!profile) {
        setHeaderUser(null);
        return;
      }
      setHeaderUser({ name: profile.name, avatarUrl: profile.avatarUrl });
    };
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "nrv-user") {
        load();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("nrv-user-updated", load);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("nrv-user-updated", load);
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

  const mobileNavActiveRoute = useMemo(() => {
    const matches = TENANT_MOBILE_LINKS.filter(
      (item) =>
        pathname === item.route || pathname.startsWith(`${item.route}/`)
    );
    if (matches.length === 0) return null;
    return matches.reduce((a, b) =>
      a.route.length >= b.route.length ? a : b
    ).route;
  }, [pathname]);

  return (
    <div className="relative flex h-screen min-h-0 min-w-0 max-w-full flex-col overflow-x-hidden">
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
            <div className="flex items-center justify-between border-b border-white/15 px-4 py-3">
              <span className="text-sm font-semibold text-white">NaijaRentVerify</span>
              <button
                type="button"
                className="rounded-lg p-2 text-white hover:bg-white/10"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiX size={22} />
              </button>
            </div>
            <nav className="flex flex-1 flex-col overflow-y-auto py-2">
              <ul className="space-y-0.5 px-2">
                {TENANT_MOBILE_LINKS.map((item) => {
                  const active = item.route === mobileNavActiveRoute;
                  return (
                    <li key={item.route}>
                      <button
                        type="button"
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm touch-manipulation ${
                          active
                            ? "bg-white/15 text-[#BBFF37]"
                            : "text-white/90 hover:bg-white/10"
                        }`}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          router.push(item.route);
                        }}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-auto border-t border-white/15 px-2 pt-2">
                <button
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm touch-manipulation ${
                    pathname.startsWith("/dashboard/tenant/support")
                      ? "bg-white/15 text-[#BBFF37]"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/dashboard/tenant/support");
                  }}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                    <FiHeadphones size={20} color="white" />
                  </span>
                  <span>Contact us</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm touch-manipulation text-white/90 hover:bg-white/10"
                  aria-label="Log out"
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await performLogout();
                    router.push("/sign-in");
                  }}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                    <FiLogOut size={20} color="white" />
                  </span>
                  <span>Log out</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      <div className="flex min-h-0 h-full min-w-0 w-full max-w-full flex-1 overflow-hidden">
        {/* Sidebar - Desktop — full viewport column height */}
        <div className="hidden min-h-0 h-full w-64 shrink-0 self-stretch bg-nrvPrimaryGreen lg:flex lg:flex-col">
          <TenantSideBar isOpen={true} />
        </div>

        {/* Main Content */}
        <div className="relative h-full min-w-0 w-full max-w-full flex-1 overflow-y-auto">
          {/* Header */}
          <div className="px-3 sm:p-4 py-3 bg-white shadow-sm sticky top-0 z-30">
            <div className="flex w-full min-w-0 items-center gap-2 sm:gap-3">
                {showDashboardBack && (
                  <DashboardBackButton fallbackHref="/dashboard/tenant" />
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
                <nav
                  aria-label="Breadcrumb"
                  className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden text-xs sm:text-sm text-gray-500"
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
                  {subMainPath && (
                    <span className="text-gray-400"> / </span>
                  )}
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
              <div className="flex shrink-0 items-center gap-2 pl-1">
                {headerUser && (
                  <div className="hidden min-w-0 max-w-[9rem] items-center gap-2 sm:flex">
                    <UserAvatar
                      src={headerUser.avatarUrl}
                      name={headerUser.name}
                      size="sm"
                    />
                    <span className="truncate text-sm text-gray-700">
                      {headerUser.name}
                    </span>
                  </div>
                )}
                <NotificationBell />
              </div>
            </div>
          </div>

          {/* Main Content Body */}
          <main className="min-h-[calc(100vh-80px)] min-w-0 w-full max-w-full overflow-x-hidden bg-white px-2 py-3 pb-4 sm:px-4 sm:py-4 md:px-5">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default TenantLayout;
