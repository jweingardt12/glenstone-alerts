import { notFound } from "next/navigation";
import { AlertsManager } from "@/components/alerts-manager";
import { isValidTokenFormat } from "@/lib/token";
import { db } from "@/lib/db";

interface PageProps {
  params: Promise<{ token: string }>;
}

async function getAlerts(token: string) {
  try {
    const alerts = await db.alerts.getByToken(token);
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
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light tracking-wide text-stone-900 mb-2">
            Manage Your Alerts
          </h1>
          <p className="text-stone-600 font-light">
            Viewing alerts for <strong className="font-normal">{email}</strong>
          </p>
        </div>

        {/* Alerts List */}
        <div className="bg-white border border-stone-200 rounded-sm p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-light text-stone-900">
              Your Alerts ({alerts.length})
            </h2>
          </div>
          <AlertsManager initialAlerts={alerts} />
        </div>

        {/* Info Section */}
        <div className="bg-stone-100 border border-stone-200 rounded-sm p-6">
          <h3 className="text-lg font-light text-stone-900 mb-4">
            How It Works
          </h3>
          <ul className="space-y-2 text-sm text-stone-600 font-light leading-relaxed">
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

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-stone-500 font-light">
          <p>
            Unofficial tool • Not affiliated with Glenstone Museum
          </p>
          <p className="mt-2">
            <a
              href="https://glenstone.org"
              className="text-stone-900 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit Glenstone.org
            </a>{" "}
            for official information
          </p>
        </div>
      </div>
    </div>
  );
}
