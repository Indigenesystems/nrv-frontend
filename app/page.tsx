"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import HomePageLayout from "./components/layout/HomePageLayout";
// Previous marketing page kept for reference:
// import LandingPage from "./components/screens/landing-page/LandingPage";
import NewLanding from "./components/screens/landing-page/NewLanding";
import {
  hasSiteAccessCookie,
  isValidLandingAccessCode,
  setSiteAccessCookie,
} from "@/lib/landing-access-codes";

export default function Index() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [accessGranted, setAccessGranted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAccessGranted(hasSiteAccessCookie());
    setReady(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidLandingAccessCode(code)) {
      setSiteAccessCookie();
      setAccessGranted(true);
      const next = new URLSearchParams(window.location.search).get("next");
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        router.replace(next);
      }
    } else {
      alert("Incorrect code. Please try again.");
    }
  };

  if (!ready) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div>
      {!accessGranted ? (
        <div className="min-h-screen flex items-center justify-center px-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-4"
          >
            <div className="space-y-1 text-center">
              <h2 className="text-2xl font-bold">Enter Access Code</h2>
              <p className="text-sm text-gray-500">This page is restricted</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Access Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter code"
              />
            </div>
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        </div>
      ) : (
        <HomePageLayout showFooter={false}>
          <NewLanding />
        </HomePageLayout>
      )}
    </div>
  );
}
