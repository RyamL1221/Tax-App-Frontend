import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import NoScriptFallback from "@/components/fallbacks/NoScriptFallback";
import Navbar from "@/components/Navbar";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: "Tax App - Streamlined IRS Form Preparation | Fast & Secure Tax Filing",
  description: "Simplify your tax preparation with our automated IRS form completion service. Save time with intelligent data collection, error prevention, and secure filing. Start your tax preparation today.",
  keywords: ["tax preparation", "IRS forms", "tax filing", "automated tax", "tax software", "form completion", "tax app"],
  authors: [{ name: "Tax App Team" }],
  creator: "Tax App",
  publisher: "Tax App",
  robots: "index, follow",
  metadataBase: new URL('https://taxapp.com'),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://taxapp.com",
    title: "Tax App - Streamlined IRS Form Preparation",
    description: "Simplify your tax preparation with our automated IRS form completion service. Save time with intelligent data collection and secure filing.",
    siteName: "Tax App",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Tax App - Streamlined Tax Preparation"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Tax App - Streamlined IRS Form Preparation",
    description: "Simplify your tax preparation with our automated IRS form completion service.",
    images: ["/og-image.jpg"]
  }
};

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#2563eb'
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <NoScriptFallback>
          <ErrorBoundary>
            <Navbar />
            <div id="root">
              {children}
            </div>
          </ErrorBoundary>
        </NoScriptFallback>
      </body>
    </html>
  );
}