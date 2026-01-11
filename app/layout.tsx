import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/app/components/service-worker-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CoachReflect - AI-Powered Reflection for Football Coaches",
  description: "Transform your coaching with guided post-session reflections. Track patterns, identify player progress, and grow as a coach with AI-powered insights.",
  keywords: ["football coaching", "coach reflection", "session review", "coaching development", "player tracking"],
  manifest: "/manifest.json",
  themeColor: "#E5A11C",
  openGraph: {
    title: "CoachReflect - AI-Powered Reflection for Football Coaches",
    description: "Transform your coaching with guided post-session reflections. Track patterns and grow as a coach with AI-powered insights.",
    type: "website",
    locale: "en_GB",
    siteName: "CoachReflect",
  },
  twitter: {
    card: "summary_large_image",
    title: "CoachReflect - AI-Powered Reflection for Football Coaches",
    description: "Transform your coaching with guided post-session reflections. Track patterns and grow as a coach with AI-powered insights.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
