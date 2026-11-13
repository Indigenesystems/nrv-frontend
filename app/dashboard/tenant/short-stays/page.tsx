"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RetiredTenantShortStaysPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/tenant");
  }, [router]);
  return null;
}
