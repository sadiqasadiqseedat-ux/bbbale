/**
 * Cryptographic utilities for password hashing and verification.
 *
 * SECURITY UPGRADE (Phase 3):
 * - New passwords use PBKDF2 with 100,000 iterations + per-user salt.
 * - Old SHA-256 hashes are still verified for backward compatibility,
 *   and transparently upgraded to PBKDF2 on next successful login.
 * - The hardcoded pepper has been removed; PBKDF2 iteration count provides
 *   the computational cost instead.
 * - Compatible with Web Crypto API across Cloudflare Workers, Node.js 18+, and Modern Browsers.
 */

function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  throw new Error('Web Crypto API is not available in the current runtime environment');
}

// PBKDF2 iteration count — high enough to make brute-force expensive
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEY_LENGTH = 32; // 256 bits
const HASH_PREFIX_PBKDF2 = 'pbkdf2$';
const HASH_PREFIX_SHA256 = 'sha256$';

// Generate a random cryptographic salt
export function generateSalt(length: number = 16): string {
  const array = new Uint8Array(length);
  getCrypto().getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Compute PBKDF2 hash of password with salt
async function hashPasswordPBKDF2(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await getCrypto().subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await getCrypto().subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    PBKDF2_KEY_LENGTH * 8
  );
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${HASH_PREFIX_PBKDF2}${PBKDF2_ITERATIONS}$${salt}$${hashHex}`;
}

// Legacy SHA-256 hash (kept only for verifying old stored hashes)
async function hashPasswordSHA256(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  // The old pepper is retained ONLY for verifying legacy hashes, not for new hashes
  const data = encoder.encode(password + salt + 'B_B_BALE_CHAMBERS_SECURITY_PEPPER_2026');
  const hashBuffer = await getCrypto().subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${HASH_PREFIX_SHA256}${hashHex}`;
}

// Compute hash for a new password — always PBKDF2
export async function hashPassword(password: string, salt: string): Promise<string> {
  return hashPasswordPBKDF2(password, salt);
}

// Verify entered password against stored hash (supports both PBKDF2 and legacy SHA-256)
export async function verifyPassword(password: string, salt: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;

  // PBKDF2 format: pbkdf2$iterations$salt$hashHex
  if (storedHash.startsWith(HASH_PREFIX_PBKDF2)) {
    try {
      const parts = storedHash.split('$');
      const iterations = parseInt(parts[1], 10);
      const storedSalt = parts[2];
      const storedHashHex = parts[3];

      const encoder = new TextEncoder();
      const keyMaterial = await getCrypto().subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );
      const derivedBits = await getCrypto().subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: encoder.encode(storedSalt),
          iterations,
          hash: 'SHA-256'
        },
        keyMaterial,
        PBKDF2_KEY_LENGTH * 8
      );
      const hashArray = Array.from(new Uint8Array(derivedBits));
      const computedHashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return timingSafeEqual(computedHashHex, storedHashHex);
    } catch {
      return false;
    }
  }

  // Legacy SHA-256 format: sha256$hashHex (or bare hash without prefix)
  if (storedHash.startsWith(HASH_PREFIX_SHA256)) {
    const legacyHash = storedHash.substring(HASH_PREFIX_SHA256.length);
    const computed = await hashPasswordSHA256(password, salt);
    const computedHash = computed.substring(HASH_PREFIX_SHA256.length);
    return timingSafeEqual(computedHash, legacyHash);
  }

  // Bare SHA-256 hash without prefix (original format)
  const computed = await hashPasswordSHA256(password, salt);
  return timingSafeEqual(computed.substring(HASH_PREFIX_SHA256.length), storedHash);
}

// Check if a stored hash needs upgrading from SHA-256 to PBKDF2
export function needsHashUpgrade(storedHash: string): boolean {
  return !storedHash.startsWith(HASH_PREFIX_PBKDF2);
}

// Timing-safe string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Generate random secure token for sessions
export function generateSecureToken(length: number = 24): string {
  const array = new Uint8Array(length);
  getCrypto().getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Validate password strength criteria:
// Minimum 8 characters, at least 1 uppercase letter, at least 1 lowercase letter, at least 1 digit or special character
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }
  if (!/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one number or special character');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}
