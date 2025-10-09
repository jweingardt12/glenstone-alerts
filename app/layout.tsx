import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Glenstone Ticket Alerts",
  title: {
    default: "Glenstone Ticket Alerts",
    template: "%s · Glenstone Ticket Alerts",
  },
  description:
    "Unofficial tool that monitors Glenstone Museum ticket availability and emails you when your selected dates open up.",
  keywords: [
    "Glenstone",
    "Glenstone tickets",
    "Glenstone Museum",
    "ticket alerts",
    "availability",
    "Potomac",
    "Maryland",
  ],
  authors: [{ name: "Glenstone Alerts" }],
  creator: "Glenstone Alerts",
  publisher: "Glenstone Alerts",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Glenstone Ticket Alerts",
    siteName: "Glenstone Ticket Alerts",
    description:
      "Monitor Glenstone ticket availability and get email notifications when dates open up.",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Glenstone Ticket Alerts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@",
    creator: "@",
    title: "Glenstone Ticket Alerts",
    description:
      "Monitor Glenstone ticket availability and get email notifications when dates open up.",
    images: ["/og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
  icons: {
    icon: "/logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
