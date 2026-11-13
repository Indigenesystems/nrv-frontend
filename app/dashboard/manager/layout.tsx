"use client";

import ManagerProtectedRoute from "@/app/components/guard/ManagerProtectedRoute";

export default function ManagerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ManagerProtectedRoute>{children}</ManagerProtectedRoute>;
}
