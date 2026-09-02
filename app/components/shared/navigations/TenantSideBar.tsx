"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BiLogOut } from "react-icons/bi";
import {
  FiHome,
  FiClipboard,
  FiTool,
  FiMessageSquare,
  FiSettings,
  FiCheckCircle,
  FiHeadphones,
} from "react-icons/fi";
import { PiFileDocDuotone } from "react-icons/pi";
import Link from "next/link";
import UserAvatar from "@/app/components/shared/UserAvatar";
import { readStoredUserProfile } from "@/lib/userProfile";

interface User {
  name: string;
  role: string;
  avatarUrl?: string;
}

interface TenantSideBarProps {
  isOpen: boolean;
}

const links = [
  {
    name: "Dashboard",
    route: "/dashboard/tenant",
    icon: <FiClipboard />,
    exact: true,
  },
  {
    name: "Properties",
    route: "/dashboard/tenant/properties",
    icon: <FiHome />,
  },
  {
    name: "Applications",
    route: "/dashboard/tenant/properties/applications",
    icon: <PiFileDocDuotone />,
  },
  {
    name: "Rented Apartments",
    route: "/dashboard/tenant/rented-properties",
    icon: <FiHome />,
  },
  {
    name: "Maintenance",
    route: "/dashboard/tenant/properties/maintenance",
    icon: <FiTool />,
  },
  {
    name: "Messages",
    route: "/dashboard/tenant/messages",
    icon: <FiMessageSquare />,
  },
];

const TenantSideBar: React.FC<TenantSideBarProps> = ({ isOpen }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const activeLink = pathname ?? "";

  const isNavActive = (route: string, exact?: boolean) => {
    if (route === "/dashboard/tenant/properties") {
      return (
        activeLink === route ||
        (activeLink.startsWith(`${route}/`) &&
          !activeLink.startsWith("/dashboard/tenant/properties/applications") &&
          !activeLink.startsWith("/dashboard/tenant/properties/maintenance"))
      );
    }
    if (exact) {
      return activeLink === route;
    }
    return activeLink === route || activeLink.startsWith(`${route}/`);
  };

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

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col justify-between bg-nrvPrimaryGreen text-white">
      <div>
        {/* Logo */}
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

        {/* Navigation Links */}
        <nav className="mt-6">
          <ul className="font-lighter text-[12px] text-[#98A2B3]">
            {links.map(({ name, route, icon, exact }, index) => (
              <li
                key={index}
                onClick={() => router.push(route)}
                className={`flex items-center gap-4 px-6 py-3 mx-4 rounded-lg cursor-pointer font-lighter text-[12px] ${
                  isNavActive(route, exact)
                    ? "text-[#BBFF37] bg-white/10 ring-1 ring-[#BBFF37]/40 font-semibold"
                    : "text-[#98A2B3] hover:text-white/90"
                }`}
              >
                {icon} {name}
              </li>
            ))}
          </ul>

          {/* Verification Section */}
          <div className="mt-8 mb-2 px-6 text-xs text-[#BBFF37] font-semibold uppercase tracking-wider">Verification</div>
          <ul className="font-lighter text-[12px] text-[#98A2B3]">
            <li
              onClick={() => router.push("/dashboard/tenant/verification")}
              className={`flex items-center gap-4 px-6 py-3 mx-4 rounded-lg cursor-pointer font-lighter text-[12px] ${activeLink.startsWith("/dashboard/tenant/verification") ? "text-[#BBFF37]" : "text-[#98A2B3]"}`}
            >
              <FiCheckCircle /> My Verifications
            </li>
          </ul>
        </nav>
      </div>

      {/* Contact, settings and user */}
      <div className="px-6 py-4 border-t border-gray-600">
        <Link
          href="/contact-us/support"
          className="flex items-center gap-4 mb-4 cursor-pointer font-lighter text-[12px] text-[#98A2B3] hover:text-white/90 transition-colors"
        >
          <FiHeadphones className="font-lighter text-[12px]" />
          <span>Contact us</span>
        </Link>
        <div
          role="button"
          tabIndex={0}
          onClick={() => router.push("/dashboard/tenant/settings")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push("/dashboard/tenant/settings");
            }
          }}
          className={`flex items-center gap-4 mb-6 cursor-pointer font-lighter text-[12px] rounded-lg px-0 py-1 ${
            activeLink.startsWith("/dashboard/tenant/settings")
              ? "text-[#BBFF37]"
              : "text-[#98A2B3]"
          }`}
        >
          <FiSettings className="font-lighter text-[12px]" />
          <span>Settings</span>
        </div>
        {user && (
          <div className="flex items-center gap-4 justify-between pt-0 pb-0">
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
                <p className="truncate text-xs text-green-400 capitalize">{user.role}</p>
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

export default TenantSideBar;
