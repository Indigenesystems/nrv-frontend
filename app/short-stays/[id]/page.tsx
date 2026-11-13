"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RetiredShortStayDetailPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/short-stays");
  }, [router]);
  return null;
}
