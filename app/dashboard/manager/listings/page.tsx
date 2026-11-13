"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RetiredManagerListingsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/manager");
  }, [router]);
  return null;
}
