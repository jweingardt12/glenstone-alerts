import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] container mx-auto px-4 sm:px-6 py-16 flex items-center justify-center">
      <div className="text-center max-w-xl">
        <h1 className="text-3xl sm:text-4xl font-light mb-3">Page not found</h1>
        <p className="text-muted-foreground font-light">
          This link may be invalid, expired, or the content was removed. If you
          were trying to manage alerts, try the link from your latest email or
          create a new alert.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 border rounded-sm text-sm font-light hover:bg-muted transition-colors"
          >
            Go to homepage
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 border rounded-sm text-sm font-light text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Create a new alert
          </Link>
        </div>
      </div>
    </main>
  );
}

