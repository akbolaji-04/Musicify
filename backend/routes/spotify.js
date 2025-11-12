import express from 'express';
import {
  searchSpotify,
  getRecommendations,
  getTopItems,
  getCurrentUser,
  getTrack,
  getArtist,
} from '../utils/spotifyAPI.js';

const router = express.Router();

/**
 * Middleware to extract access token from Authorization header
 */
const getAccessToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  req.accessToken = authHeader.replace('Bearer ', '');
  next();
};

/**
 * GET /spotify/search
 * Search for tracks, artists, albums, playlists
 */
router.get('/search', getAccessToken, async (req, res) => {
  try {
    const { q, type = 'track,artist,album,playlist', limit = 20, offset = 0 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const results = await searchSpotify(
      req.accessToken,
      q,
      type,
      parseInt(limit),
      parseInt(offset)
    );

    res.json(results);
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /spotify/recommendations
 * Get track recommendations based on seeds and audio features
 */
router.get('/recommendations', getAccessToken, async (req, res) => {
  try {
    const {
      seed_tracks,
      seed_artists,
      seed_genres,
      target_energy,
      target_valence,
      target_danceability,
      limit = 20,
    } = req.query;

    if (!seed_tracks && !seed_artists && !seed_genres) {
      return res.status(400).json({ error: 'At least one of seed_tracks, seed_artists, or seed_genres is required' });
    }

    const options = {
      limit: parseInt(limit),
    };

    if (seed_tracks) {
      options.seed_tracks = Array.isArray(seed_tracks) ? seed_tracks : [seed_tracks];
    }
    if (seed_artists) {
      options.seed_artists = Array.isArray(seed_artists) ? seed_artists : [seed_artists];
    }
    if (seed_genres) {
      options.seed_genres = Array.isArray(seed_genres) ? seed_genres : [seed_genres];
    }
    if (target_energy) {
      options.target_energy = parseFloat(target_energy);
    }
    if (target_valence) {
      options.target_valence = parseFloat(target_valence);
    }
    if (target_danceability) {
      options.target_danceability = parseFloat(target_danceability);
    }

    const recommendations = await getRecommendations(req.accessToken, options);
    res.json(recommendations);
  } catch (error) {
    console.error('Recommendations error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /spotify/me
 * Get current user profile
 */
router.get('/me', getAccessToken, async (req, res) => {
  try {
    const user = await getCurrentUser(req.accessToken);
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /spotify/me/top/:type
 * Get user's top tracks or artists
 */
router.get('/me/top/:type', getAccessToken, async (req, res) => {
  try {
    const { type } = req.params;
    const { time_range = 'medium_term', limit = 20 } = req.query;

    if (type !== 'tracks' && type !== 'artists') {
      return res.status(400).json({ error: 'Type must be "tracks" or "artists"' });
    }

    const topItems = await getTopItems(
      req.accessToken,
      type,
      time_range,
      parseInt(limit)
    );

    res.json(topItems);
  } catch (error) {
    console.error('Get top items error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /spotify/tracks/:id
 * Get track details
 */
router.get('/tracks/:id', getAccessToken, async (req, res) => {
  try {
    const { id } = req.params;
    const track = await getTrack(req.accessToken, id);
    res.json(track);
  } catch (error) {
    console.error('Get track error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /spotify/artists/:id
 * Get artist details
 */
router.get('/artists/:id', getAccessToken, async (req, res) => {
  try {
    const { id } = req.params;
    const artist = await getArtist(req.accessToken, id);
    res.json(artist);
  } catch (error) {
    console.error('Get artist error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /spotify/lyrics
 * Proxy for Genius API (requires Genius API key in production)
 */
router.get('/lyrics', getAccessToken, async (req, res) => {
  try {
    const { track, artist } = req.query;
    
    if (!track || !artist) {
      return res.status(400).json({ error: 'Track and artist parameters required' });
    }

    // In production, integrate with Genius API
    // For now, return a placeholder
    res.json({
      lyrics: null,
      message: 'Lyrics integration requires Genius API key',
    });
  } catch (error) {
    console.error('Lyrics error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;


