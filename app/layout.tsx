import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import { AppHeader } from "@/src/client/components/AppHeader";
import { UrqlProvider } from "@/src/client/urql";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReadyOn · Workforce Management",
  description: "Attendance, requests and locations for a multi-location workforce.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <UrqlProvider>
          <Suspense fallback={<div className="h-16 border-b border-line bg-white" />}>
            <AppHeader />
          </Suspense>
          <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-10 sm:px-6">
            <Suspense>{children}</Suspense>
          </main>
        </UrqlProvider>
      </body>
    </html>
  );
}
