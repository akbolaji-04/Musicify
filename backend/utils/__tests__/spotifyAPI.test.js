import { spotifyRequest } from '../spotifyAPI.js';

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
}));

import axios from 'axios';

describe('Spotify API Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('spotifyRequest', () => {
    it('should make a request with correct headers', async () => {
      const mockData = { items: [] };
      axios.get.mockResolvedValue({ data: mockData });

      const result = await spotifyRequest('test-token', '/test', { param: 'value' });

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/test',
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          params: { param: 'value' },
        }
      );
      expect(result).toEqual(mockData);
    });

    it('should throw error on API error', async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: { error: { message: 'Invalid token' } },
        },
      };
      axios.get.mockRejectedValue(errorResponse);

      await expect(spotifyRequest('invalid-token', '/test')).rejects.toThrow('Spotify API error');
    });
  });
});

