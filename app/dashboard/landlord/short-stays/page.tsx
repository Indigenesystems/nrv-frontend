"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RetiredLandlordShortStaysPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/landlord");
  }, [router]);
  return null;
}
