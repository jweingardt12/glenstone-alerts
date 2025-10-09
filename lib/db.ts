// Supabase database implementation for alerts
import type { Alert, CreateAlertRequest, CronLog, EmailVerification } from "./types";
import { generateManagementToken } from "./token";
import { getSupabaseClient } from "./supabase";

const supabase = () => getSupabaseClient();

export const db = {
  cronLogs: {
    /**
     * Create a new cron log entry
     */
    start: async (): Promise<string> => {
      const { data, error } = await supabase()
        .from("cron_logs")
        .insert({
          status: "started",
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating cron log:", error);
        throw new Error(`Failed to create cron log: ${error.message}`);
      }

      return data.id;
    },

    /**
     * Complete a cron log entry
     */
    complete: async (
      logId: string,
      alertsChecked: number,
      notificationsSent: number,
      metadata?: Record<string, unknown>
    ): Promise<void> => {
      const { data: logData, error: fetchError } = await supabase()
        .from("cron_logs")
        .select("started_at")
        .eq("id", logId)
        .single();

      if (fetchError || !logData) {
        console.error("Error fetching cron log:", fetchError);
        return;
      }

      const startedAt = new Date(logData.started_at);
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      const { error } = await supabase()
        .from("cron_logs")
        .update({
          completed_at: completedAt.toISOString(),
          duration_ms: durationMs,
          status: "completed",
          alerts_checked: alertsChecked,
          notifications_sent: notificationsSent,
          metadata: metadata || null,
        })
        .eq("id", logId);

      if (error) {
        console.error("Error completing cron log:", error);
      }
    },

    /**
     * Fail a cron log entry
     */
    fail: async (logId: string, errorMessage: string): Promise<void> => {
      const { data: logData, error: fetchError } = await supabase()
        .from("cron_logs")
        .select("started_at")
        .eq("id", logId)
        .single();

      if (fetchError || !logData) {
        console.error("Error fetching cron log:", fetchError);
        return;
      }

      const startedAt = new Date(logData.started_at);
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      const { error } = await supabase()
        .from("cron_logs")
        .update({
          completed_at: completedAt.toISOString(),
          duration_ms: durationMs,
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", logId);

      if (error) {
        console.error("Error failing cron log:", error);
      }
    },

    /**
     * Get recent cron logs
     */
    getRecent: async (limit = 50): Promise<CronLog[]> => {
      const { data, error } = await supabase()
        .from("cron_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error getting cron logs:", error);
        throw new Error(`Failed to get cron logs: ${error.message}`);
      }

      return data || [];
    },
  },

  alerts: {
    /**
     * Create a new alert
     */
    create: async (request: CreateAlertRequest): Promise<Alert> => {
      const { data, error } = await supabase()
        .from("alerts")
        .insert({
          email: request.email,
          dates: request.dates,
          time_of_day: 'any', // Kept for backward compatibility
          preferred_times: request.preferredTimes || null,
          quantity: request.quantity,
          min_capacity: request.minCapacity,
          active: true,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating alert:", error);
        throw new Error(`Failed to create alert: ${error.message}`);
      }

      return {
        id: data.id,
        email: data.email,
        dates: data.dates,
        timeOfDay: data.time_of_day,
        preferredTimes: data.preferred_times,
        quantity: data.quantity,
        minCapacity: data.min_capacity,
        active: data.active,
        createdAt: data.created_at,
        lastChecked: data.last_checked,
        lastNotifiedAt: data.last_notified_at,
        managementToken: data.management_token,
      };
    },

    /**
     * Get alert by ID
     */
    get: async (id: string): Promise<Alert | undefined> => {
      const { data, error } = await supabase()
        .from("alerts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Not found
          return undefined;
        }
        console.error("Error getting alert:", error);
        throw new Error(`Failed to get alert: ${error.message}`);
      }

      if (!data) return undefined;

      return {
        id: data.id,
        email: data.email,
        dates: data.dates,
        timeOfDay: data.time_of_day,
        preferredTimes: data.preferred_times,
        quantity: data.quantity,
        minCapacity: data.min_capacity,
        active: data.active,
        createdAt: data.created_at,
        lastChecked: data.last_checked,
        lastNotifiedAt: data.last_notified_at,
        managementToken: data.management_token,
      };
    },

    /**
     * Get all alerts for an email
     */
    getByEmail: async (email: string): Promise<Alert[]> => {
      const { data, error } = await supabase()
        .from("alerts")
        .select("*")
        .eq("email", email)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error getting alerts by email:", error);
        throw new Error(`Failed to get alerts: ${error.message}`);
      }

      return (data || []).map((row) => ({
        id: row.id,
        email: row.email,
        dates: row.dates,
        timeOfDay: row.time_of_day,
        quantity: row.quantity,
        minCapacity: row.min_capacity,
        active: row.active,
        createdAt: row.created_at,
        lastChecked: row.last_checked,
        lastNotifiedAt: row.last_notified_at,
        managementToken: row.management_token,
      }));
    },

    /**
     * Get all active alerts
     */
    getAllActive: async (): Promise<Alert[]> => {
      const { data, error } = await supabase()
        .from("alerts")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error getting active alerts:", error);
        throw new Error(`Failed to get active alerts: ${error.message}`);
      }

      return (data || []).map((row) => ({
        id: row.id,
        email: row.email,
        dates: row.dates,
        timeOfDay: row.time_of_day,
        quantity: row.quantity,
        minCapacity: row.min_capacity,
        active: row.active,
        createdAt: row.created_at,
        lastChecked: row.last_checked,
        lastNotifiedAt: row.last_notified_at,
        managementToken: row.management_token,
      }));
    },

    /**
     * Update alert
     */
    update: async (
      id: string,
      updates: Partial<Alert>
    ): Promise<Alert | undefined> => {
      const updateData: Record<string, unknown> = {};

      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.dates !== undefined) updateData.dates = updates.dates;
      if (updates.timeOfDay !== undefined)
        updateData.time_of_day = updates.timeOfDay;
      if (updates.preferredTimes !== undefined)
        updateData.preferred_times = updates.preferredTimes;
      if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
      if (updates.minCapacity !== undefined)
        updateData.min_capacity = updates.minCapacity;
      if (updates.active !== undefined) updateData.active = updates.active;
      if (updates.lastChecked !== undefined)
        updateData.last_checked = updates.lastChecked;
      if (updates.lastNotifiedAt !== undefined)
        updateData.last_notified_at = updates.lastNotifiedAt;
      if (updates.managementToken !== undefined)
        updateData.management_token = updates.managementToken;

      const { data, error } = await supabase()
        .from("alerts")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Not found
          return undefined;
        }
        console.error("Error updating alert:", error);
        throw new Error(`Failed to update alert: ${error.message}`);
      }

      if (!data) return undefined;

      return {
        id: data.id,
        email: data.email,
        dates: data.dates,
        timeOfDay: data.time_of_day,
        preferredTimes: data.preferred_times,
        quantity: data.quantity,
        minCapacity: data.min_capacity,
        active: data.active,
        createdAt: data.created_at,
        lastChecked: data.last_checked,
        lastNotifiedAt: data.last_notified_at,
        managementToken: data.management_token,
      };
    },

    /**
     * Delete alert
     */
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase().from("alerts").delete().eq("id", id);

      if (error) {
        console.error("Error deleting alert:", error);
        return false;
      }

      return true;
    },

    /**
     * Get all alerts
     */
    getAll: async (): Promise<Alert[]> => {
      const { data, error } = await supabase()
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error getting all alerts:", error);
        throw new Error(`Failed to get alerts: ${error.message}`);
      }

      return (data || []).map((row) => ({
        id: row.id,
        email: row.email,
        dates: row.dates,
        timeOfDay: row.time_of_day,
        quantity: row.quantity,
        minCapacity: row.min_capacity,
        active: row.active,
        createdAt: row.created_at,
        lastChecked: row.last_checked,
        lastNotifiedAt: row.last_notified_at,
        managementToken: row.management_token,
      }));
    },

    /**
     * Update last checked time
     */
    updateLastChecked: async (id: string): Promise<void> => {
      const { error } = await supabase()
        .from("alerts")
        .update({ last_checked: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("Error updating last checked:", error);
      }
    },

    /**
     * Update last notified time (for 24-hour repeat logic)
     */
    updateLastNotified: async (id: string): Promise<void> => {
      const { error } = await supabase()
        .from("alerts")
        .update({ last_notified_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("Error updating last notified:", error);
      }
    },

    /**
     * Get all alerts for an email and generate/retrieve management token
     */
    getOrCreateManagementToken: async (email: string): Promise<string> => {
      // First, check if any alert for this email already has a token
      const { data: existingAlerts, error: fetchError } = await supabase()
        .from("alerts")
        .select("management_token")
        .eq("email", email)
        .not("management_token", "is", null)
        .limit(1);

      if (fetchError) {
        console.error("Error fetching alerts:", fetchError);
        throw new Error(`Failed to fetch alerts: ${fetchError.message}`);
      }

      // If an alert already has a token, return it
      if (existingAlerts && existingAlerts.length > 0 && existingAlerts[0].management_token) {
        return existingAlerts[0].management_token;
      }

      // Generate a new token
      const token = generateManagementToken();

      // Update all alerts for this email with the new token
      const { error: updateError } = await supabase()
        .from("alerts")
        .update({ management_token: token })
        .eq("email", email);

      if (updateError) {
        console.error("Error updating alerts with token:", updateError);
        throw new Error(`Failed to update alerts: ${updateError.message}`);
      }

      return token;
    },

    /**
     * Get all alerts by management token
     */
    getByToken: async (token: string): Promise<Alert[]> => {
      const { data, error } = await supabase()
        .from("alerts")
        .select("*")
        .eq("management_token", token)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error getting alerts by token:", error);
        throw new Error(`Failed to get alerts: ${error.message}`);
      }

      return (data || []).map((row) => ({
        id: row.id,
        email: row.email,
        dates: row.dates,
        timeOfDay: row.time_of_day,
        quantity: row.quantity,
        minCapacity: row.min_capacity,
        active: row.active,
        createdAt: row.created_at,
        lastChecked: row.last_checked,
        lastNotifiedAt: row.last_notified_at,
        managementToken: row.management_token,
      }));
    },

    /**
     * Deactivate all alerts by management token (unsubscribe)
     */
    deactivateAllByToken: async (token: string): Promise<number> => {
      console.log("Deactivating alerts for token:", token);

      const { data, error } = await supabase()
        .from("alerts")
        .update({ active: false })
        .eq("management_token", token)
        .select();

      if (error) {
        console.error("Error deactivating alerts by token:", error);
        throw new Error(`Failed to deactivate alerts: ${error.message}`);
      }

      console.log("Deactivated alerts:", data);
      return data?.length || 0;
    },

    /**
     * Delete all alerts by management token (unsubscribe)
     */
    deleteAllByToken: async (token: string): Promise<number> => {
      console.log("Deleting alerts for token:", token);

      const { data, error } = await supabase()
        .from("alerts")
        .delete()
        .eq("management_token", token)
        .select();

      if (error) {
        console.error("Error deleting alerts by token:", error);
        throw new Error(`Failed to delete alerts: ${error.message}`);
      }

      console.log("Deleted alerts:", data);
      return data?.length || 0;
    },
  },

  emailVerifications: {
    /**
     * Create a new email verification record
     */
    create: async (email: string, code: string): Promise<EmailVerification> => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

      const { data, error } = await supabase()
        .from("email_verifications")
        .insert({
          email,
          code,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating email verification:", error);
        throw new Error(`Failed to create email verification: ${error.message}`);
      }

      return {
        id: data.id,
        email: data.email,
        code: data.code,
        verified: data.verified,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
        attempts: data.attempts,
      };
    },

    /**
     * Get verification by email and code
     */
    getByEmailAndCode: async (email: string, code: string): Promise<EmailVerification | null> => {
      const { data, error } = await supabase()
        .from("email_verifications")
        .select("*")
        .eq("email", email)
        .eq("code", code)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null;
        }
        console.error("Error fetching email verification:", error);
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        code: data.code,
        verified: data.verified,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
        attempts: data.attempts,
      };
    },

    /**
     * Get recent verifications by email (for rate limiting)
     */
    getRecentByEmail: async (email: string): Promise<EmailVerification[]> => {
      const oneMinuteAgo = new Date(Date.now() - 60000);

      const { data, error } = await supabase()
        .from("email_verifications")
        .select("*")
        .eq("email", email)
        .gte("created_at", oneMinuteAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching recent verifications:", error);
        return [];
      }

      return (data || []).map((row) => ({
        id: row.id,
        email: row.email,
        code: row.code,
        verified: row.verified,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        attempts: row.attempts,
      }));
    },

    /**
     * Get verified records by email
     */
    getVerifiedByEmail: async (email: string): Promise<{ data: EmailVerification[] | null; error: Error | null }> => {
      try {
        const { data, error } = await supabase()
          .from("email_verifications")
          .select("*")
          .eq("email", email)
          .eq("verified", true)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching verified records:", error);
          return { data: null, error: new Error(error.message) };
        }

        const verifications = (data || []).map((row) => ({
          id: row.id,
          email: row.email,
          code: row.code,
          verified: row.verified,
          createdAt: row.created_at,
          expiresAt: row.expires_at,
          attempts: row.attempts,
        }));

        return { data: verifications, error: null };
      } catch (err) {
        console.error("Error in getVerifiedByEmail:", err);
        return { data: null, error: err instanceof Error ? err : new Error("Unknown error") };
      }
    },

    /**
     * Mark verification as verified
     */
    markAsVerified: async (id: string): Promise<void> => {
      const { error } = await supabase()
        .from("email_verifications")
        .update({ verified: true })
        .eq("id", id);

      if (error) {
        console.error("Error marking verification as verified:", error);
        throw new Error(`Failed to mark verification as verified: ${error.message}`);
      }
    },

    /**
     * Increment attempts counter
     */
    incrementAttempts: async (id: string): Promise<void> => {
      const { error } = await supabase()
        .rpc("increment_verification_attempts", { verification_id: id });

      if (error) {
        console.error("Error incrementing verification attempts:", error);
      }
    },

    /**
     * Clean up expired verifications
     */
    cleanupExpired: async (): Promise<void> => {
      const { error } = await supabase()
        .from("email_verifications")
        .delete()
        .lt("expires_at", new Date().toISOString());

      if (error) {
        console.error("Error cleaning up expired verifications:", error);
      }
    },
  },
};
