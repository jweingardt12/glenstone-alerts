/**
 * Utility functions for generating and validating management tokens
 */

/**
 * Generate a secure random token for alert management
 * Uses crypto.randomBytes for cryptographically strong randomness
 */
export function generateManagementToken(): string {
  // Generate 32 random bytes and convert to base64url (URL-safe)
  const buffer = crypto.getRandomValues(new Uint8Array(32));
  const base64 = btoa(String.fromCharCode(...buffer));

  // Make it URL-safe by replacing +, /, and = characters
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Validate token format (basic check)
 */
export function isValidTokenFormat(token: string): boolean {
  // Token should be 43 characters (32 bytes in base64url)
  // and only contain URL-safe characters
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
