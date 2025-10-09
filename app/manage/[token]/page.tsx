import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AlertsManager } from "@/components/alerts-manager";
import { UnsubscribeButton } from "@/components/unsubscribe-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { isValidTokenFormat } from "@/lib/token";
import { db } from "@/lib/db";

interface PageProps {
  params: Promise<{ token: string }>;
}

async function getAlerts(token: string) {
  try {
    const alerts = await db.alerts.getByToken(token);
    console.log("Fetched alerts for manage page:", alerts.map(a => ({ id: a.id, active: a.active })));
    return alerts;
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return null;
  }
}

export default async function ManageAlertsPage({ params }: PageProps) {
  const { token } = await params;

  // Validate token format
  if (!isValidTokenFormat(token)) {
    notFound();
  }

  // Fetch alerts
  const alerts = await getAlerts(token);

  if (!alerts || alerts.length === 0) {
    notFound();
  }

  const email = alerts[0].email;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="relative w-full h-[200px] sm:h-[250px] md:h-[300px] overflow-hidden">
        {/* Background Image */}
        <Image
          src="/glenstone.jpeg"
          alt="Glenstone Museum"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />

        {/* Gradient Overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60 dark:from-black/70 dark:via-black/50 dark:to-black/70 transition-colors duration-300" />

        {/* Content */}
        <div className="relative h-full container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-5xl mx-auto h-full">
            <div className="flex items-start justify-between h-full">
              <div className="flex items-end h-full pb-8 sm:pb-12">
                <div className="flex items-center gap-3">
                  <Link href="/" className="transition-transform hover:scale-105">
                    <Image
                      src="/logo.webp"
                      alt="Glenstone Alerts Logo"
                      width={80}
                      height={80}
                      className="rounded-lg"
                    />
                  </Link>
                  <div className="space-y-1">
                    <Link href="/">
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-wide text-white drop-shadow-lg hover:text-white/90 transition-colors">
                        Glenstone Alerts
                      </h1>
                    </Link>
                    <p className="text-sm sm:text-base md:text-lg text-white/90 font-light drop-shadow-md">
                      A simple tool to help reserve free timed entry passes for the <a href="https://glenstone.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors inline-flex items-center gap-1">Glenstone Museum<ExternalLink className="h-3 w-3" /></a>
                    </p>
                  </div>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-4 sm:space-y-6">
            {/* Page Header */}
            <div>
              <h2 className="text-xl sm:text-2xl font-light">
                Manage Your Alerts
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Viewing alerts for <strong className="font-normal">{email}</strong>
              </p>
            </div>

            {/* Alerts List */}
            <div className="bg-card border rounded-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <h3 className="text-2xl font-light">
                  Your Alerts ({alerts.length})
                </h3>
                <UnsubscribeButton token={token} />
              </div>
              <AlertsManager initialAlerts={alerts} />
            </div>

            {/* Info Section */}
            <div className="bg-muted/50 border rounded-sm p-6">
              <h3 className="text-lg font-light mb-4">
                How It Works
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground font-light leading-relaxed">
                <li>
                  • <strong className="font-normal">Active alerts</strong> will notify you when tickets
                  become available
                </li>
                <li>
                  • <strong className="font-normal">Deactivate</strong> an alert to pause notifications
                  without deleting it
                </li>
                <li>
                  • <strong className="font-normal">Delete</strong> an alert permanently if you no longer
                  need it
                </li>
                <li>
                  • We check availability regularly throughout the day
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-24">
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <a
                href="https://github.com/jweingardt12/glenstone-alerts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline text-muted-foreground font-light"
              >
                GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="hidden sm:inline text-muted-foreground">•</span>
              <a
                href="https://jwe.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline text-muted-foreground font-light"
              >
                jwe.in
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground font-light inline-flex items-center justify-center gap-1 flex-wrap">
                Weather from{""}
                <a
                  href="https://weather-data.apple.com/legal-attribution.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline inline-flex items-center"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                    aria-label="Apple"
                  >
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Weather
                </a>
              </p>
              <p className="text-sm text-muted-foreground font-light">
                Unofficial tool • Not affiliated with Glenstone Museum
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
