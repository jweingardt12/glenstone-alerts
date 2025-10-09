# Analytics Events Reference

This document lists all the analytics events tracked in the Glenstone Alerts application using OpenPanel.

## Event Types

### Alert Management Events

#### `alert_created`
Triggered when a user successfully creates a new availability alert.

**Properties:**
- `quantity` (number) - Number of tickets requested
- `dateCount` (number) - Number of dates selected
- `hasPreferredTimes` (boolean) - Whether user selected specific time slots

**Location:** `components/alert-form.tsx`

---

#### `alert_deleted`
Triggered when a user deletes an individual alert from their alert list.

**Properties:** None

**Location:** `components/alerts-manager.tsx`

---

#### `alerts_deleted_all`
Triggered when a user deletes all their alerts at once using the "Delete All Alerts" button.

**Properties:** None

**Location:** `components/unsubscribe-button.tsx`

---

### User Interaction Events

#### `booking_link_clicked`
Triggered when a user clicks to open the booking page on Glenstone.org.

**Properties:**
- `date` (string) - Selected date in YYYY-MM-DD format
- `quantity` (number) - Number of tickets

**Location:** `app/page.tsx`

---

#### `availability_refreshed`
Triggered when a user manually clicks the refresh button to update availability data.

**Properties:** None

**Location:** `app/page.tsx`

---

#### `time_slot_viewed`
Triggered when a user opens the time slot modal to view available times for a specific date.

**Properties:**
- `date` (string) - Selected date in YYYY-MM-DD format
- `availableSlots` (number) - Number of available time slots

**Location:** `app/page.tsx`

---

#### `alert_modal_opened`
Triggered when a user opens the alert creation form (either from the main button or from a date card).

**Properties:** None

**Location:** `components/alert-form.tsx`

---

#### `theme_toggled`
Triggered when a user changes the theme between light and dark mode.

**Properties:**
- `newTheme` (string) - The new theme ("dark" or "light")

**Location:** `components/ui/animated-theme-toggler.tsx`

---

## Automatic Tracking

In addition to custom events, OpenPanel automatically tracks:

- **Page Views** - All page navigation (enabled via `trackScreenViews`)
- **Outgoing Links** - External link clicks (enabled via `trackOutgoingLinks`)

## Privacy & Compliance

- **No User Identification:** All events are tracked anonymously
- **No Email Tracking:** User emails are never sent to analytics
- **No Personal Data:** Only interaction patterns are recorded
- **GDPR/CCPA Compliant:** Privacy-first analytics approach

## Event Naming Convention

Events follow a simple naming pattern:
- Lowercase with underscores
- Action-based naming (verb_noun format)
- Descriptive and self-documenting

Examples: `alert_created`, `booking_link_clicked`, `theme_toggled`

