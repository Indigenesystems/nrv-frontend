"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { getVerificationCreditBalances } from "@/helpers/verificationCredits";
import { BiLogOut } from "react-icons/bi";
import {
  FiHome,
  FiClipboard,
  FiDollarSign,
  FiHeadphones,
  FiHelpCircle,
  FiSettings,
} from "react-icons/fi";
import { MANAGER_NAV_ITEMS } from "@/app/config/managerNav";
import UserAvatar from "@/app/components/shared/UserAvatar";
import { readStoredUserProfile } from "@/lib/userProfile";

interface User {
  name: string;
  role: string;
  avatarUrl?: string;
}

const ICONS: Record<string, React.ReactNode> = {
  Dashboard: <FiHome />,
  "Guest verifications": <FiClipboard />,
  "Buy shortlet credits": <FiDollarSign />,
  Settings: <FiSettings />,
  "How it works": <FiHelpCircle />,
};

const links = MANAGER_NAV_ITEMS.map(({ name, route }) => ({
  name,
  route,
  icon: ICONS[name] ?? <FiSettings />,
}));

const ManagerSideBar: React.FC<{ isOpen: boolean }> = () => {
  const router = useRouter();
  const pathname = usePathname();
  const userFromRedux = useSelector((s: RootState) => s.user.data);
  const [user, setUser] = useState<User | null>(null);
  const [activeLink, setActiveLink] = useState<string>("");
  const [creditLine, setCreditLine] = useState<number | null>(null);

  const creditsFromRedux = useMemo(() => {
    const doc = userFromRedux?.user ?? null;
    if (!doc || !(doc as { _id?: string })._id) return null;
    return getVerificationCreditBalances(doc).shortlet;
  }, [userFromRedux]);

  const displayCredits = creditsFromRedux ?? creditLine;

  const readCreditsFromStorage = () => {
    try {
      const storedUser = localStorage.getItem("nrv-user");
      if (!storedUser) {
        setCreditLine(null);
        return;
      }
      const u = JSON.parse(storedUser)?.user;
      if (!u) {
        setCreditLine(null);
        return;
      }
      setCreditLine(getVerificationCreditBalances(u).shortlet);
    } catch {
      setCreditLine(null);
    }
  };

  const loadUserProfile = () => {
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

  useEffect(() => {
    setActiveLink(pathname || window.location.pathname);
    loadUserProfile();
    readCreditsFromStorage();
  }, [pathname]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "nrv-user") {
        readCreditsFromStorage();
        loadUserProfile();
      }
    };
    const onUserUpdated = () => {
      readCreditsFromStorage();
      loadUserProfile();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("nrv-user-updated", onUserUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("nrv-user-updated", onUserUpdated);
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col justify-between bg-nrvPrimaryGreen text-white">
      <div>
        <div
          className="text-start mt-8 lg:mt-10 px-4 w-full min-w-0 box-border flex cursor-pointer items-center"
          onClick={() => router.push("/")}
          role="button"
          tabIndex={0}
          aria-label="Go to home"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push("/");
            }
          }}
        >
          <span className="text-sm font-bold tracking-wide text-white whitespace-nowrap">
            NAIJARENTVERIFY
          </span>
        </div>

        {displayCredits != null && (
          <Link
            href="/dashboard/manager/credits"
            className="block mx-4 mt-5 px-3 py-2.5 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15 transition-colors"
          >
            <p className="text-[10px] uppercase tracking-wide text-white/60 mb-1">
              Shortlet identity credits
            </p>
            <p className="text-xs font-medium text-white leading-snug">
              {displayCredits} remaining
            </p>
          </Link>
        )}

        <nav className="mt-6">
          <ul className="font-lighter text-[12px] text-[#98A2B3]">
            {links.map(({ name, route, icon }, index) => (
              <li
                key={index}
                onClick={() => router.push(route)}
                className={`flex items-center gap-4 px-6 py-3 mx-4 rounded-lg cursor-pointer font-lighter text-[12px]  ${
                  activeLink === route ||
                  (route !== "/dashboard/manager" &&
                    activeLink.startsWith(`${route}/`))
                    ? "text-[#BBFF37]"
                    : "text-[#98A2B3]"
                }`}
              >
                {icon} {name}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="px-6 py-4 border-t border-gray-600">
        <Link
          href="/dashboard/manager/guide"
          className={`flex items-center gap-4 mb-4 cursor-pointer font-lighter text-[12px] transition-colors ${
            activeLink.startsWith("/dashboard/manager/guide")
              ? "text-[#BBFF37]"
              : "text-[#98A2B3] hover:text-white/90"
          }`}
        >
          <FiHeadphones className="font-lighter text-[12px]" />
          <span>How it works</span>
        </Link>
        {user && (
          <div className="flex items-center gap-4 justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <UserAvatar
                src={user.avatarUrl}
                name={user.name}
                size="sm"
                light
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[#FFFFFF]">
                  {user.name}
                </p>
                <p className="truncate text-xs text-green-400 capitalize">
                  Shortlet manager
                </p>
              </div>
            </div>
            <BiLogOut
              onClick={async () => {
                const { performLogout } = await import("@/lib/logout");
                await performLogout();
                router.push("/sign-in");
              }}
              className="text-xl cursor-pointer shrink-0"
              aria-label="Log out"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerSideBar;
