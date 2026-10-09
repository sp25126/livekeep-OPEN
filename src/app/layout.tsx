import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWAProvider from "@/components/PWAProvider";
import SecurityLayoutWrapper from "@/components/SecurityLayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Livekeeping Open - ERP & Accounting PWA",
  description: "Real-time cross-device accounting, GST billing, and maker-checker workforce platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#ecebe6] text-[#232528]">
        <PWAProvider>
          <SecurityLayoutWrapper>{children}</SecurityLayoutWrapper>
        </PWAProvider>
      </body>
    </html>
  );
}
