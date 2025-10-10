import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Helper to generate 4-digit code
function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Helper to extract client IP from request headers
function getClientIp(request: NextRequest): string {
  // Check various headers that might contain the client IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Fallback to a placeholder (shouldn't happen in production with proper proxy setup)
  return 'unknown';
}

// Rate limit configuration
const RATE_LIMITS = {
  IP_PER_HOUR: 5,           // Max verification requests per IP per hour
  EMAIL_PER_DAY: 10,         // Max verification requests per email per 24 hours
  EMAIL_COOLDOWN_MS: 300000, // 5 minutes between requests for same email
};

// POST /api/verify-email - Send or verify code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, code } = body;

    if (!action || !email) {
      return NextResponse.json(
        { error: "Action and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!email.includes('@') || email.includes(' ')) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (action === "send") {
      // Get client IP for rate limiting
      const clientIp = getClientIp(request);

      // Check if user already has alerts (skip verification for existing users)
      const existingAlerts = await db.alerts.getByEmail(email);
      if (existingAlerts.length > 0) {
        return NextResponse.json({
          needsVerification: false,
          message: "Email already verified"
        });
      }

      // Clean up any expired verifications and old rate limits
      await db.emailVerifications.cleanupExpired();
      await db.verificationRateLimits.cleanup();

      // RATE LIMIT 1: Check IP-based rate limiting (5 requests per hour)
      const recentIpRequests = await db.verificationRateLimits.getRecentByIp(clientIp, 1);
      if (recentIpRequests.length >= RATE_LIMITS.IP_PER_HOUR) {
        return NextResponse.json(
          { error: `Too many verification requests from this location. Please try again later. (Limit: ${RATE_LIMITS.IP_PER_HOUR} per hour)` },
          { status: 429 }
        );
      }

      // RATE LIMIT 2: Check email-based daily limit (10 requests per 24 hours)
      const recentEmailRequests = await db.verificationRateLimits.getRecentByEmail(email, 24);
      if (recentEmailRequests.length >= RATE_LIMITS.EMAIL_PER_DAY) {
        return NextResponse.json(
          { error: `Too many verification requests for this email address. Please try again tomorrow. (Limit: ${RATE_LIMITS.EMAIL_PER_DAY} per day)` },
          { status: 429 }
        );
      }

      // RATE LIMIT 3: Check cooldown period for same email (5 minutes)
      const recentVerifications = await db.emailVerifications.getRecentByEmail(email);
      if (recentVerifications.length > 0) {
        const lastVerification = recentVerifications[0];
        const timeSinceLastSend = Date.now() - new Date(lastVerification.createdAt).getTime();

        if (timeSinceLastSend < RATE_LIMITS.EMAIL_COOLDOWN_MS) {
          const remainingSeconds = Math.ceil((RATE_LIMITS.EMAIL_COOLDOWN_MS - timeSinceLastSend) / 1000);
          return NextResponse.json(
            { error: `Please wait ${remainingSeconds} seconds before requesting another code` },
            { status: 429 }
          );
        }
      }

      // RATE LIMIT 4: Check if there's already a valid unexpired code for this email
      const existingVerification = recentVerifications.find(v => {
        const expiresAt = new Date(v.expiresAt);
        return expiresAt > new Date() && !v.verified;
      });

      if (existingVerification) {
        return NextResponse.json(
          { error: "A verification code was already sent to this email. Please check your inbox or wait for it to expire." },
          { status: 429 }
        );
      }

      // Generate new 4-digit code
      const verificationCode = generateCode();

      // Store verification in database
      await db.emailVerifications.create(email, verificationCode);

      // Record this request for rate limiting (after successful verification creation)
      try {
        await db.verificationRateLimits.record(clientIp, email);
      } catch (error) {
        // Log but don't fail the request if rate limit recording fails
        console.error("Error recording rate limit:", error);
      }

      // Send verification email via edge function
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-verification-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              email,
              code: verificationCode,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          console.error("Failed to send verification email:", error);
          return NextResponse.json(
            { error: "Failed to send verification email" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          needsVerification: true,
          message: "Verification code sent successfully"
        });
      } catch (error) {
        console.error("Error sending verification email:", error);
        return NextResponse.json(
          { error: "Failed to send verification email" },
          { status: 500 }
        );
      }
    }

    if (action === "verify") {
      if (!code) {
        return NextResponse.json(
          { error: "Verification code is required" },
          { status: 400 }
        );
      }

      // Validate code format
      if (!/^\d{4}$/.test(code)) {
        return NextResponse.json(
          { error: "Code must be 4 digits" },
          { status: 400 }
        );
      }

      // Get verification record
      const verification = await db.emailVerifications.getByEmailAndCode(email, code);

      if (!verification) {
        return NextResponse.json(
          { verified: false, error: "Invalid verification code" },
          { status: 400 }
        );
      }

      // Check if already verified
      if (verification.verified) {
        return NextResponse.json({
          verified: true,
          message: "Email already verified"
        });
      }

      // Check expiration
      const now = new Date();
      const expiresAt = new Date(verification.expiresAt);
      if (now > expiresAt) {
        return NextResponse.json(
          { verified: false, error: "Verification code has expired" },
          { status: 400 }
        );
      }

      // Check max attempts
      if (verification.attempts >= 3) {
        return NextResponse.json(
          { verified: false, error: "Too many failed attempts. Please request a new code." },
          { status: 400 }
        );
      }

      // Mark as verified
      await db.emailVerifications.markAsVerified(verification.id);

      return NextResponse.json({
        verified: true,
        message: "Email verified successfully"
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in verify-email endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
