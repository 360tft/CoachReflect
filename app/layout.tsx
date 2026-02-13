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
    default: "Coach Reflection - Become a Better Coach After Every Session",
    template: "%s | Coach Reflection",
  },
  description: "Become a better coach after every session. Reflect for 2 minutes and the AI shows you what's working and what isn't. For football, rugby, basketball, and 10+ sports. Free to start.",
  keywords: ["AI coaching journal", "AI coaching reflection", "coaching reflection app", "coaching reflection tool", "reflective journal for coaches", "coach CPD log", "coaching CPD tracker", "coaching self evaluation tool", "post session reflection football", "voice note coaching journal", "coaching journal app", "session review", "coaching development", "athlete tracking", "coach app", "football coaching", "cricket coaching", "basketball coaching", "tennis coaching", "digital CPD portfolio coaching", "soccer reflection", "football reflection", "soccer coaching journal", "football coaching journal", "soccer post-match reflection", "football training reflection"],
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
    title: "Coach Reflection - Become a Better Coach After Every Session",
    description: "Become a better coach after every session. Reflect for 2 minutes and the AI shows you what's working and what isn't. For football, rugby, basketball, and 10+ sports.",
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
    title: "Coach Reflection - Become a Better Coach After Every Session",
    description: "Become a better coach after every session. Reflect for 2 minutes and the AI shows you what's working and what isn't. For football, rugby, basketball, and 10+ sports.",
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
        {/* FirstPromoter affiliate tracking */}
        {process.env.NEXT_PUBLIC_FIRSTPROMOTER_ID && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `(function(w){w.fpr=w.fpr||function(){w.fpr.q=w.fpr.q||[];w.fpr.q[arguments[0]=='set'?'unshift':'push'](arguments);};})(window);fpr("init",{cid:"${process.env.NEXT_PUBLIC_FIRSTPROMOTER_ID}"});fpr("click");`,
              }}
            />
            <script async src="https://cdn.firstpromoter.com/fpr.js" />
          </>
        )}
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
