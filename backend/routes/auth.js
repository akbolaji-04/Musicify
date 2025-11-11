import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { generatePKCEPair } from '../utils/pkce.js';

const router = express.Router();

// Store PKCE verifiers temporarily (in production, use Redis or similar)
const codeVerifiers = new Map();

/**
 * GET /auth/login
 * Initiates Spotify OAuth flow with PKCE
 */
router.get('/login', (req, res) => {
  const { verifier, challenge } = generatePKCEPair();
  const state = crypto.randomUUID();

  // Store verifier with state for later verification
  codeVerifiers.set(state, verifier);

  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-read-recently-played',
    'user-top-read',
    'user-read-playback-state',
    'user-modify-playback-state',
    'streaming',
    'user-read-currently-playing',
  ].join(' ');

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', process.env.SPOTIFY_CLIENT_ID);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('redirect_uri', process.env.SPOTIFY_REDIRECT_URI);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('code_challenge', challenge);

  res.json({ authUrl: authUrl.toString(), state });
});

/**
 * GET /auth/callback
 * Handles Spotify OAuth callback and exchanges code for tokens
 */
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  // Use FRONTEND_URL for all redirects back to the client
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error) {
    return res.redirect(`${frontendUrl}/?error=${error}`);
  }

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/?error=missing_params`);
  }

  const codeVerifier = codeVerifiers.get(state);
  if (!codeVerifier) {
    return res.redirect(`${frontendUrl}/?error=invalid_state`);
  }

  // Clean up verifier
  codeVerifiers.delete(state);

  try {
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        code_verifier: codeVerifier,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Set refresh token as httpOnly cookie
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none', // This is correct for cross-domain
      maxAge: 60 * 60 * 24 * 365 * 1000, // 1 year
    });

    // FIX: Redirect to the FRONTEND_URL
    res.redirect(
      `${frontendUrl}/auth/callback?access_token=${access_token}&expires_in=${expires_in}`
    );
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    // Use FRONTEND_URL for error redirect
    res.redirect(
      `${frontendUrl}/?error=token_exchange_failed`
    );
  }
});

/**
 * POST /auth/refresh
 * Refreshes access token using refresh token from cookie
 */
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token found' });
  }

  try {
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.SPOTIFY_CLIENT_ID,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
      }
    );

    const { access_token, expires_in } = tokenResponse.data;

    res.json({
      access_token,
      expires_in,
    });
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    res.status(401).json({ error: 'Failed to refresh token' });
  }
});

/**
 * POST /auth/logout
 * Clears refresh token cookie
 */
router.post('/logout', (req, res) => {
  res.clearCookie('refresh_token');
  res.json({ message: 'Logged out successfully' });
});

export default router;