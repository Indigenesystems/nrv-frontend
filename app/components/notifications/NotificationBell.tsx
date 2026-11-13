"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
} from "@/lib/notificationsApi";

function hrefForNotification(n: AppNotification): string | null {
  const m = n.metadata || {};
  const type = n.type;

  // Prefer verification list until admin approval unlocks the full report.
  if (
    type === "verification_documents_uploaded" ||
    type === "verification_complete"
  ) {
    return "/dashboard/landlord/properties/verification";
  }

  if (typeof m.actionUrl === "string" && m.actionUrl.trim()) {
    return m.actionUrl;
  }

  if (
    type === "verification_assigned" ||
    type === "verification_screening_complete" ||
    type === "verification_approved" ||
    type === "verification_rejected"
  ) {
    const reqId = m.verificationRequestId as string | undefined;
    if (reqId) {
      return `/dashboard/tenant/verification?verificationId=${encodeURIComponent(reqId)}`;
    }
  }

  if (
    type === "maintenance_created" ||
    type === "maintenance_scheduled" ||
    type === "maintenance_status_updated"
  ) {
    const maintenanceId = m.maintenanceId as string | undefined;
    if (maintenanceId) {
      return `/dashboard/landlord/properties/maintenance/${maintenanceId}`;
    }
    return "/dashboard/landlord/properties/maintenance";
  }

  if (type === "application_received") {
    const applicationId = m.applicationId as string | undefined;
    if (applicationId) {
      return `/dashboard/landlord/properties/renters/${applicationId}`;
    }
    return "/dashboard/landlord/properties/renters";
  }

  if (type === "lease_expired") {
    const applicationId = m.applicationId as string | undefined;
    if (applicationId) {
      return `/dashboard/landlord/tenants/${applicationId}`;
    }
    return "/dashboard/landlord/tenants?tab=ended";
  }

  if (
    type === "application_submitted" ||
    type === "application_status_updated"
  ) {
    return "/dashboard/tenant/properties/applications";
  }

  if (type === "message_received") {
    const senderId = m.senderId as string | undefined;
    if (senderId) {
      return `/dashboard/landlord/messages/${senderId}`;
    }
    return "/dashboard/landlord/messages";
  }

  if (type === "payment_success" || type === "payment_failed") {
    if (n.targetRole === "shortlet_manager") {
      return "/dashboard/manager/credits";
    }
    return "/dashboard/landlord/settings/plans";
  }

  return null;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);

  const loadUnread = useCallback(async () => {
    try {
      const count = await fetchUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const loadItems = useCallback(async () => {
    try {
      const data = await fetchNotifications({ limit: 20, unreadOnly: false });
      setItems(data);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    loadUnread();
    const t = setInterval(loadUnread, 60000);
    return () => clearInterval(t);
  }, [loadUnread]);

  useEffect(() => {
    if (open) loadItems();
  }, [open, loadItems]);

  const handleOpenNotification = async (n: AppNotification) => {
    try {
      await markNotificationAsRead(n._id);
      setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
    const path = hrefForNotification(n);
    if (path) router.push(path);
    setOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setUnreadCount(0);
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/10"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
              <div className="text-sm font-semibold text-gray-900">Notifications</div>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  className="text-xs text-nrvPrimaryGreen hover:underline"
                  onClick={handleMarkAllRead}
                >
                  Mark all read
                </button>
              ) : null}
            </div>
            <div className="max-h-[min(400px,55vh)] overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
              ) : (
                items.map((n) => (
                  <button
                    key={n._id}
                    type="button"
                    className={`w-full border-b border-gray-50 px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-gray-50 ${
                      !n.read ? "bg-emerald-50/50" : ""
                    }`}
                    onClick={() => handleOpenNotification(n)}
                  >
                    <div className="font-medium text-gray-900">{n.title}</div>
                    {n.body ? (
                      <div className="mt-0.5 line-clamp-3 text-xs text-gray-600">{n.body}</div>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
