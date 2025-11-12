import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useSpotifyAPI } from '../hooks/useSpotifyAPI';
import TrackCard from '../components/TrackCard';
import { motion } from 'framer-motion';
import { Music, TrendingUp, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { playTrack } = usePlayer();
  const { getTopItems, getRecommendations } = useSpotifyAPI();
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

const loadData = async () => {
    try {
      setLoading(true); // Make sure loading is true at the start

      // Step 1: Get top tracks and artists
      const [tracks, artists] = await Promise.all([
        getTopItems('tracks', 'medium_term', 5), // Get top 5 tracks
        getTopItems('artists', 'medium_term', 5), // Get top 5 artists
      ]);

      const topTracksData = tracks.items || [];
      const topArtistsData = artists.items || [];

      setTopTracks(topTracksData);
      setTopArtists(topArtistsData);

      // Step 2: Build seed options
      const seedOptions = { limit: 10 };
      
      if (topTracksData.length > 0) {
        // FIX: Send as a comma-separated string, not an array
        seedOptions.seed_tracks = topTracksData.map(t => t.id).slice(0, 2).join(',');
      } 
      
      if (topArtistsData.length > 0) {
        // FIX: Send as a comma-separated string, not an array
        seedOptions.seed_artists = topArtistsData.map(a => a.id).slice(0, 2).join(',');
      }

      // Step 3: Fallback for empty history
      if (topTracksData.length === 0 && topArtistsData.length === 0) {
        seedOptions.seed_genres = 'pop,afrobeats,hip-hop'; // Use genres if no history
      }
  
      // Step 4: Get recommendations
      const recs = await getRecommendations(seedOptions);
      setRecommendations(recs.tracks || []);

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Music className="w-24 h-24 mx-auto mb-6 text-spotify-green" />
          <h1 className="text-4xl font-bold mb-4">Welcome to Musicify</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Discover and stream music with collaborative listening rooms
          </p>
          <Link to="/search" className="btn-primary inline-block">
            Get Started
          </Link>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spotify-green mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your music...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.display_name || user?.id}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover new music and enjoy your favorites
        </p>
      </motion.div>

      {/* Top Tracks */}
      {topTracks.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-spotify-green" />
            <h2 className="text-2xl font-bold">Your Top Tracks</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {topTracks.filter(Boolean).map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-spotify-green" />
            <h2 className="text-2xl font-bold">Recommended for You</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {recommendations.filter(Boolean).map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </section>
      )}

      {/* Top Artists */}
      {topArtists.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Music className="w-6 h-6 text-spotify-green" />
            <h2 className="text-2xl font-bold">Your Top Artists</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {topArtists.filter(Boolean).map((artist) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="card text-center"
              >
                {artist.images?.[0]?.url ? (
                  <img
                    src={artist.images[0].url}
                    alt={artist.name}
                    className="w-full aspect-square object-cover rounded-full mb-3"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-300 dark:bg-gray-700 rounded-full mb-3"></div>
                )}
                <h3 className="font-semibold truncate">{artist.name}</h3>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

