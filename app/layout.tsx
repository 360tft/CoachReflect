import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/app/components/service-worker-register";
import { Analytics } from "@/app/components/analytics";
import { ThemeProvider } from "@/app/components/theme-provider";
import {
  generateWebsiteSchema,
  generateOrganizationSchema,
  generateSoftwareApplicationSchema,
} from "@/lib/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Coach Reflection - AI-Powered Reflection for Sports Coaches",
    template: "%s | Coach Reflection",
  },
  description: "Transform your coaching with guided post-session reflections. Track patterns, identify athlete progress, and grow as a coach with AI-powered insights. For football, rugby, basketball, and more.",
  keywords: ["AI coaching journal", "AI coaching reflection", "AI coaching assistant", "AI sports coaching", "sports coaching", "coach reflection", "session review", "coaching development", "athlete tracking", "coaching journal", "coach app", "session planning", "football coaching", "rugby coaching", "basketball coaching", "AI coach reflection tool"],
  authors: [{ name: "360TFT" }],
  creator: "360TFT",
  publisher: "SVMS Consultancy Limited",
  metadataBase: new URL("https://coachreflection.com"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Coach Reflection",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "theme-color": "#E5A11C",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://coachreflection.com",
    siteName: "Coach Reflection",
    title: "Coach Reflection - AI-Powered Reflection for Sports Coaches",
    description: "Transform your coaching with guided post-session reflections. Track patterns, identify athlete progress, and grow as a coach with AI-powered insights. For football, rugby, basketball, and more.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Coach Reflection - AI-Powered Coaching Journal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Coach Reflection - AI-Powered Reflection for Sports Coaches",
    description: "Transform your coaching with guided post-session reflections. Track patterns, identify athlete progress, and grow as a coach with AI-powered insights.",
    images: ["/og-image.png"],
    creator: "@360_tft",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "uJXzoZZHmddLkc2yu6EQ8GyN9HYrlVfSlLWL1v0HRlo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme by setting class before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* WebSite Schema for Search Box */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateWebsiteSchema())
          }}
        />
        {/* Organization Schema for Brand Knowledge Panel */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateOrganizationSchema())
          }}
        />
        {/* SoftwareApplication Schema for Rich Snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateSoftwareApplicationSchema())
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <Analytics />
          <ServiceWorkerRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
