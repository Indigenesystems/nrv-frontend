"use client";

import React, { useEffect, useState } from "react";
import { Menu, X, ArrowRight, Home } from "lucide-react";
import NavLink from "./NavLink";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getDashboardHrefForAccount,
  getStoredSession,
} from "@/lib/authSession";

type NavItem =
  | { text: string; targetId: string }
  | { text: string; route: string };

const navItems: NavItem[] = [
  { text: "Home", targetId: "home" },
  { text: "How It Works", targetId: "how-it-works" },
  { text: "Features", targetId: "features" },
  { text: "Explore Homes", targetId: "explore" },
  { text: "Verify guests", route: "/short-stays" },
  { text: "Testimonials", targetId: "testimonials" },
];

const MobileNavBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dashboardHref, setDashboardHref] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const load = () => {
      try {
        const session = getStoredSession();
        if (session?.user) {
          setIsLoggedIn(true);
          setDashboardHref(
            getDashboardHrefForAccount(session.user.accountType) ?? "/sign-in",
          );
          return;
        }
      } catch {
        localStorage.removeItem("nrv-user");
      }
      setIsLoggedIn(false);
      setDashboardHref(null);
    };
    load();
    window.addEventListener("nrv-user-updated", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("nrv-user-updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const close = () => setIsOpen(false);

  const handleNavTo = (path: string) => {
    close();
    router.push(path);
  };

  return (
    <>
      <header className="flex items-center justify-between gap-2 h-[68px] px-3 sm:px-4 w-full min-w-0 max-w-full">
        <Link
          href="/"
          className="flex items-center gap-2 min-w-0 shrink overflow-hidden"
          onClick={close}
        >
          <Image
            src="/images/nrvlogo.jpg"
            alt="NaijaRentVerify"
            width={130}
            height={45}
            className="h-8 sm:h-9 w-auto max-h-9 max-w-[min(160px,42vw)] object-contain"
          />
          <span className="text-[10px] sm:text-xs font-bold tracking-wide text-[#03442C] whitespace-nowrap">
            NAIJARENTVERIFY
          </span>
        </Link>
        <div className="flex items-center gap-1.5 shrink-0">
          {isLoggedIn && dashboardHref ? (
            <Link
              href={dashboardHref}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-[#03442C] text-white text-xs font-semibold"
            >
              Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2.5 rounded-xl text-gray-600 hover:bg-[#03442C]/5 hover:text-[#03442C] transition-all duration-200"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X size={24} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Full-screen overlay menu */}
      {isOpen && (
        <div
          className="fixed inset-0 top-[68px] z-60 bg-white flex flex-col"
          role="dialog"
          aria-modal="true"
        >
          <nav className="flex-1 overflow-y-auto px-5 py-4">
            <ul className="space-y-1">
              {navItems.map((item, index) => (
                <li key={index}>
                  {"targetId" in item ? (
                    <NavLink
                      targetId={item.targetId}
                      onAfterNavigate={close}
                      className="flex items-center py-4 px-3 text-base font-medium text-gray-700 hover:text-[#03442C] hover:bg-[#03442C]/5 rounded-xl transition-all duration-200"
                    >
                      {item.text}
                    </NavLink>
                  ) : (
                    <Link
                      href={item.route}
                      onClick={close}
                      className={`flex items-center py-4 px-3 text-base font-medium rounded-xl transition-all duration-200 ${
                        pathname === item.route ||
                        pathname.startsWith(`${item.route}/`)
                          ? "text-[#03442C] bg-[#03442C]/5"
                          : "text-gray-700 hover:text-[#03442C] hover:bg-[#03442C]/5"
                      }`}
                    >
                      {item.text}
                    </Link>
                  )}
                </li>
              ))}
              {/* List a Home */}
              <li>
                <Link
                  href="/sign-up?role=landlord"
                  onClick={close}
                  className="flex items-center gap-2 py-4 px-3 text-base font-semibold text-[#03442C] hover:bg-[#03442C]/5 rounded-xl transition-all duration-200"
                >
                  <Home className="w-4 h-4" />
                  List a Home
                </Link>
              </li>
            </ul>

            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3">
              {isLoggedIn && dashboardHref ? (
                <Link
                  href={dashboardHref}
                  onClick={close}
                  className="w-full py-4 rounded-xl bg-[#03442C] text-white font-semibold hover:bg-[#022f21] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleNavTo("/sign-in")}
                    className="w-full py-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-[#03442C]/30 hover:text-[#03442C] transition-all duration-200"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavTo("/sign-up")}
                    className="w-full py-4 rounded-xl bg-[#03442C] text-white font-semibold hover:bg-[#022f21] shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export default MobileNavBar;
