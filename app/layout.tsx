import type { Metadata, Viewport } from "next";
import "../globals.css";
import "react-toastify/dist/ReactToastify.css";
import { Providers } from "./providers";
import { ToastContainer } from "react-toastify";
import { RememberMeBootstrap } from "./components/auth/RememberMeBootstrap";
import DataUseNotice from "./components/shared/DataUseNotice";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Tenant verification and rental listings in Nigeria`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Verify tenants and manage rentals in Nigeria. Browse listings, screen applicants, and rent with more confidence.",
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_NG",
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "overlays-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <RememberMeBootstrap>
            <div className="min-h-screen">{children}</div>
            <DataUseNotice />
            <ToastContainer position="top-right" autoClose={4000} />
          </RememberMeBootstrap>
        </Providers>
      </body>
    </html>
  );
}
