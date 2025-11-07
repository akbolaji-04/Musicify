import { generateCodeVerifier, generateCodeChallenge, generatePKCEPair } from '../pkce.js';

describe('PKCE Utilities', () => {
  describe('generateCodeVerifier', () => {
    it('should generate a random code verifier', () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toBeDefined();
      expect(typeof verifier).toBe('string');
      expect(verifier.length).toBeGreaterThan(0);
    });

    it('should generate different verifiers on each call', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      expect(verifier1).not.toBe(verifier2);
    });
  });

  describe('generateCodeChallenge', () => {
    it('should generate a challenge from a verifier', () => {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);
      expect(challenge).toBeDefined();
      expect(typeof challenge).toBe('string');
      expect(challenge.length).toBeGreaterThan(0);
    });

    it('should generate the same challenge for the same verifier', () => {
      const verifier = generateCodeVerifier();
      const challenge1 = generateCodeChallenge(verifier);
      const challenge2 = generateCodeChallenge(verifier);
      expect(challenge1).toBe(challenge2);
    });
  });

  describe('generatePKCEPair', () => {
    it('should generate both verifier and challenge', () => {
      const { verifier, challenge } = generatePKCEPair();
      expect(verifier).toBeDefined();
      expect(challenge).toBeDefined();
      expect(typeof verifier).toBe('string');
      expect(typeof challenge).toBe('string');
    });

    it('should generate matching verifier and challenge', () => {
      const { verifier, challenge } = generatePKCEPair();
      const expectedChallenge = generateCodeChallenge(verifier);
      expect(challenge).toBe(expectedChallenge);
    });
  });
});

