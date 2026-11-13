"use client";

import { useEffect, useState } from "react";
import NavLink from "./NavLink";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Home } from "lucide-react";
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
  { text: "Explore", targetId: "explore" },
  { text: "Verify guests", route: "/short-stays" },
  { text: "Testimonials", targetId: "testimonials" },
];

const DesktopNavBar: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [dashboardHref, setDashboardHref] = useState<string | null>(null);
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

  return (
    <header className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 min-w-0 max-w-[min(320px,50vw)] group"
          >
            <Image
              src="/images/nrvlogo.jpg"
              alt="NaijaRentVerify"
              width={150}
              height={52}
              className="h-9 sm:h-10 w-auto max-w-full object-contain group-hover:opacity-90 transition-opacity"
              priority
            />
            <span className="text-xs sm:text-sm font-bold tracking-wide text-[#03442C] whitespace-nowrap">
              NAIJARENTVERIFY
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center">
            <div className="flex items-center gap-8">
              {navItems.map((item, index) => (
                <div key={index}>
                  {"targetId" in item ? (
                    <NavLink
                      targetId={item.targetId}
                      className="text-sm font-medium text-gray-600 hover:text-[#03442C] transition-colors duration-200"
                    >
                      {item.text}
                    </NavLink>
                  ) : (
                    <Link
                      href={item.route}
                      className={`text-sm font-medium transition-colors duration-200 ${
                        pathname === item.route ||
                        pathname.startsWith(`${item.route}/`)
                          ? "text-[#03442C]"
                          : "text-gray-600 hover:text-[#03442C]"
                      }`}
                    >
                      {item.text}
                    </Link>
                  )}
                </div>
              ))}
            </div>
            {/* List a Home - special link */}
            <Link
              href="/sign-up?role=landlord"
              className="ml-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[#03442C] px-4 py-2 rounded-full border border-[#03442C]/30 hover:bg-[#03442C]/5 hover:border-[#03442C]/40 transition-all duration-200"
            >
              <Home className="w-4 h-4" />
              List a Home
            </Link>
          </nav>

          {/* Right: Auth / Dashboard */}
          <div className="flex items-center gap-2 shrink-0">
            {isLoggedIn && dashboardHref ? (
              <Link
                href={dashboardHref}
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#03442C] text-white text-sm font-semibold hover:bg-[#022f21] shadow-sm hover:shadow-md transition-all duration-200"
              >
                Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-gray-600 hover:text-[#03442C] px-4 py-2.5 rounded-full hover:bg-gray-50 transition-all duration-200 hidden sm:block"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="group inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#03442C] text-white text-sm font-semibold hover:bg-[#022f21] shadow-sm hover:shadow-md hover:shadow-[#03442C]/25 transition-all duration-200"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DesktopNavBar;
