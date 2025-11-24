import { useCallback } from 'react';
import axios from 'axios';
import { getToken, refreshToken } from '../utils/token';

const API_BASE = import.meta.env.VITE_API_BASE_URL 

/**
 * Custom hook for making authenticated Spotify API requests
 * @returns {object} API methods
 */
export function useSpotifyAPI() {
  /**
   * Make an authenticated request to the backend
   * @param {string} endpoint - API endpoint
   * @param {object} options - Request options
   * @returns {Promise<any>} Response data
   */
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    let token = getToken();

    // Refresh token if expired
    if (!token || (await import('../utils/token.js')).isTokenExpired()) {
      token = await refreshToken();
      if (!token) {
        throw new Error('Authentication required');
      }
    }

    try {
      const response = await axios({
        url: `${API_BASE}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Try refreshing token once more
        token = await refreshToken();
        if (token) {
          const retryResponse = await axios({
            url: `${API_BASE}${endpoint}`,
            headers: {
              'Authorization': `Bearer ${token}`,
              ...options.headers,
            },
            ...options,
          });
          return retryResponse.data;
        }
      }
      throw error;
    }
  }, []);

  const search = useCallback(async (query, type = 'track,artist,album,playlist', limit = 20, offset = 0) => {
    return apiRequest('/spotify/search', {
      params: { q: query, type, limit, offset },
    });
  }, [apiRequest]);

  const getRecommendations = useCallback(async (options = {}) => {
    return apiRequest('/spotify/recommendations', {
      params: options,
    });
  }, [apiRequest]);

  const getTopItems = useCallback(async (type = 'tracks', timeRange = 'medium_term', limit = 20) => {
    return apiRequest(`/spotify/me/top/${type}`, {
      params: { time_range: timeRange, limit },
    });
  }, [apiRequest]);

  const getCurrentUser = useCallback(async () => {
    return apiRequest('/spotify/me');
  }, [apiRequest]);

  const getTrack = useCallback(async (trackId) => {
    return apiRequest(`/spotify/tracks/${trackId}`);
  }, [apiRequest]);

  const getArtist = useCallback(async (artistId) => {
    return apiRequest(`/spotify/artists/${artistId}`);
  }, [apiRequest]);

  return {
    search,
    getRecommendations,
    getTopItems,
    getCurrentUser,
    getTrack,
    getArtist,
    apiRequest,
  };
}

