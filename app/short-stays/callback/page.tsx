"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RetiredShortStayCallbackPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/payments/callback");
  }, [router]);
  return null;
}
