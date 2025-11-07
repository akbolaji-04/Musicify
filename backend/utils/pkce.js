import crypto from 'crypto';
import { base64URLEncode } from './helpers.js';

/**
 * Generate a random code verifier for PKCE
 * @returns {string} A random 128-character string
 */
export function generateCodeVerifier() {
  return base64URLEncode(crypto.randomBytes(96));
}

/**
 * Generate code challenge from verifier using SHA256
 * @param {string} verifier - The code verifier
 * @returns {string} The base64 URL-encoded SHA256 hash
 */
export function generateCodeChallenge(verifier) {
  return base64URLEncode(
    crypto.createHash('sha256').update(verifier).digest()
  );
}

/**
 * Generate both verifier and challenge for PKCE flow
 * @returns {{verifier: string, challenge: string}}
 */
export function generatePKCEPair() {
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  return { verifier, challenge };
}

