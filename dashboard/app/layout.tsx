import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { FeedlySidebar } from "@/components/layout/feedly-sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TMT Legal Intelligence",
  description: "Track and manage 738 legal intelligence sources across Technology, Media & Telecom",
};

function SidebarFallback() {
  return (
    <div className="flex h-screen w-72 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          TL
        </div>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex h-screen overflow-hidden">
          <Suspense fallback={<SidebarFallback />}>
            <FeedlySidebar />
          </Suspense>
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
