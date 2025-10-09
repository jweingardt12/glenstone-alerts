import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Helper to generate 4-digit code
function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

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
      // Check if user already has alerts (skip verification for existing users)
      const existingAlerts = await db.alerts.getByEmail(email);
      if (existingAlerts.length > 0) {
        return NextResponse.json({
          needsVerification: false,
          message: "Email already verified"
        });
      }

      // Clean up any expired verifications for this email
      await db.emailVerifications.cleanupExpired();

      // Check for recent verification attempts (rate limiting)
      const recentVerifications = await db.emailVerifications.getRecentByEmail(email);
      if (recentVerifications.length > 0) {
        const lastVerification = recentVerifications[0];
        const timeSinceLastSend = Date.now() - new Date(lastVerification.createdAt).getTime();

        // Rate limit: minimum 60 seconds between requests
        if (timeSinceLastSend < 60000) {
          return NextResponse.json(
            { error: "Please wait before requesting another code" },
            { status: 429 }
          );
        }
      }

      // Generate new 4-digit code
      const verificationCode = generateCode();

      // Store verification in database
      await db.emailVerifications.create(email, verificationCode);

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
