import { useState } from 'react';
import { useSpotifyAPI } from '../hooks/useSpotifyAPI';
import { useDebounce } from '../hooks/useDebounce';
import TrackCard from '../components/TrackCard';
import SearchBar from '../components/SearchBar';
import { motion } from 'framer-motion';
import { Sparkles, Sliders } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SmartMix() {
  const { search, getRecommendations } = useSpotifyAPI();
  const [seedTrack, setSeedTrack] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState({
    energy: 0.5,
    valence: 0.5,
    danceability: 0.5,
  });
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Search for seed track
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const data = await search(query, 'track', 10, 0);
        setSearchResults(data.tracks?.items || []);
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Failed to search');
      }
    }
  };

  // Generate recommendations
  const generateMix = async () => {
    if (!seedTrack) {
      toast.error('Please select a seed track');
      return;
    }

    setLoading(true);
    try {
      const data = await getRecommendations({
        seed_tracks: [seedTrack.id],
        target_energy: mood.energy,
        target_valence: mood.valence,
        target_danceability: mood.danceability,
        limit: 20,
      });
      setRecommendations(data.tracks || []);
      toast.success('Mix generated!');
    } catch (error) {
      console.error('Recommendations error:', error);
      toast.error('Failed to generate mix');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-spotify-green" />
          <h1 className="text-3xl font-bold">Smart Mix Generator</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Create personalized playlists based on your mood and preferences
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Seed Track & Mood */}
        <div className="lg:col-span-1 space-y-6">
          {/* Seed Track Selection */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Seed Track</h2>
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search for a track..."
            />
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => {
                      setSeedTrack(track);
                      setSearchResults([]);
                      setSearchQuery('');
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      seedTrack?.id === track.id
                        ? 'bg-spotify-green text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <p className="font-semibold truncate">{track.name}</p>
                    <p className="text-sm truncate">
                      {track.artists?.map(a => a.name).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {seedTrack && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="font-semibold">{seedTrack.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {seedTrack.artists?.map(a => a.name).join(', ')}
                </p>
                <button
                  onClick={() => setSeedTrack(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-700"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Mood Sliders */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-5 h-5 text-spotify-green" />
              <h2 className="text-xl font-bold">Mood Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Energy: {Math.round(mood.energy * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mood.energy}
                  onChange={(e) => setMood({ ...mood, energy: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Valence (Positivity): {Math.round(mood.valence * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mood.valence}
                  onChange={(e) => setMood({ ...mood, valence: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Danceability: {Math.round(mood.danceability * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mood.danceability}
                  onChange={(e) => setMood({ ...mood, danceability: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
            <button
              onClick={generateMix}
              disabled={!seedTrack || loading}
              className="w-full mt-6 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Mix'}
            </button>
          </div>
        </div>

        {/* Right Column - Recommendations */}
        <div className="lg:col-span-2">
          {recommendations.length > 0 ? (
            <div>
              <h2 className="text-2xl font-bold mb-6">
                Recommended Tracks ({recommendations.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recommendations.map((track) => (
                  <TrackCard key={track.id} track={track} />
                ))}
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                Select a seed track and adjust mood settings to generate a mix
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

