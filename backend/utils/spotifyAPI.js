import axios from 'axios';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

/**
 * Make an authenticated request to Spotify API
 * @param {string} accessToken - Spotify access token
 * @param {string} endpoint - API endpoint (e.g., '/search')
 * @param {object} params - Query parameters
 * @returns {Promise<object>} API response data
 */
export async function spotifyRequest(accessToken, endpoint, params = {}) {
  try {
    const response = await axios.get(`${SPOTIFY_API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      params,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        `Spotify API error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`
      );
    }
    throw new Error(`Network error: ${error.message}`);
  }
}

/**
 * Search for tracks, artists, albums, or playlists
 * @param {string} accessToken - Spotify access token
 * @param {string} query - Search query
 * @param {string} type - Comma-separated types: track,artist,album,playlist
 * @param {number} limit - Number of results (default: 20)
 * @param {number} offset - Pagination offset (default: 0)
 * @returns {Promise<object>} Search results
 */
export async function searchSpotify(accessToken, query, type = 'track,artist,album,playlist', limit = 20, offset = 0) {
  return spotifyRequest(accessToken, '/search', {
    q: query,
    type,
    limit,
    offset,
  });
}

/**
 * Get track recommendations based on seeds and audio features
 * @param {string} accessToken - Spotify access token
 * @param {object} options - Recommendation options
 * @param {string[]} options.seed_tracks - Track IDs to seed
 * @param {string[]} options.seed_artists - Artist IDs to seed
 * @param {number} options.target_energy - Target energy (0-1)
 * @param {number} options.target_valence - Target valence (0-1)
 * @param {number} options.target_danceability - Target danceability (0-1)
 * @param {number} options.limit - Number of recommendations (default: 20)
 * @returns {Promise<object>} Recommendations
 */
export async function getRecommendations(accessToken, options = {}) {
  const {
    seed_tracks = [],
    seed_artists = [],
    target_energy,
    target_valence,
    target_danceability,
    limit = 20,
  } = options;

  const params = {
    limit,
  };

  if (seed_tracks.length > 0) {
    params.seed_tracks = seed_tracks.slice(0, 5).join(',');
  }
  if (seed_artists.length > 0) {
    params.seed_artists = seed_artists.slice(0, 5).join(',');
  }
  if (target_energy !== undefined) {
    params.target_energy = target_energy;
  }
  if (target_valence !== undefined) {
    params.target_valence = target_valence;
  }
  if (target_danceability !== undefined) {
    params.target_danceability = target_danceability;
  }

  return spotifyRequest(accessToken, '/recommendations', params);
}

/**
 * Get user's top tracks or artists
 * @param {string} accessToken - Spotify access token
 * @param {string} type - 'tracks' or 'artists'
 * @param {string} timeRange - 'short_term', 'medium_term', or 'long_term'
 * @param {number} limit - Number of results (default: 20)
 * @returns {Promise<object>} Top items
 */
export async function getTopItems(accessToken, type = 'tracks', timeRange = 'medium_term', limit = 20) {
  return spotifyRequest(accessToken, `/me/top/${type}`, {
    time_range: timeRange,
    limit,
  });
}

/**
 * Get current user's profile
 * @param {string} accessToken - Spotify access token
 * @returns {Promise<object>} User profile
 */
export async function getCurrentUser(accessToken) {
  return spotifyRequest(accessToken, '/me');
}

/**
 * Get track details
 * @param {string} accessToken - Spotify access token
 * @param {string} trackId - Spotify track ID
 * @returns {Promise<object>} Track details
 */
export async function getTrack(accessToken, trackId) {
  return spotifyRequest(accessToken, `/tracks/${trackId}`);
}

/**
 * Get artist details
 * @param {string} accessToken - Spotify access token
 * @param {string} artistId - Spotify artist ID
 * @returns {Promise<object>} Artist details
 */
export async function getArtist(accessToken, artistId) {
  return spotifyRequest(accessToken, `/artists/${artistId}`);
}


