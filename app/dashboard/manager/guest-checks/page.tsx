"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RetiredGuestChecksPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/manager/requests");
  }, [router]);
  return null;
}
