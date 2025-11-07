import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSpotifyAPI } from '../hooks/useSpotifyAPI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { motion } from 'framer-motion';
import { User, Music, Clock, TrendingUp } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const { getTopItems } = useSpotifyAPI();
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [timeRange, setTimeRange] = useState('medium_term');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadProfileData();
  }, [timeRange]);

  const loadProfileData = async () => {
    try {
      const [tracks, artists] = await Promise.all([
        getTopItems('tracks', timeRange, 50),
        getTopItems('artists', timeRange, 50),
      ]);

      setTopTracks(tracks.items || []);
      setTopArtists(artists.items || []);

      // Calculate stats
      const genreCount = {};
      const artistCount = {};
      
      artists.items?.forEach(artist => {
        artist.genres?.forEach(genre => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
        artistCount[artist.name] = (artistCount[artist.name] || 0) + 1;
      });

      const topGenres = Object.entries(genreCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      const topArtistsData = Object.entries(artistCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      setStats({
        topGenres,
        topArtists: topArtistsData,
        totalTracks: tracks.items?.length || 0,
        totalArtists: artists.items?.length || 0,
      });
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spotify-green mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-6 mb-6">
          {user?.images?.[0]?.url ? (
            <img
              src={user.images[0].url}
              alt={user.display_name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-spotify-green flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{user?.display_name || 'User'}</h1>
            <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
            {user?.followers && (
              <p className="text-sm text-gray-500 mt-1">
                {user.followers.total} followers
              </p>
            )}
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {['short_term', 'medium_term', 'long_term'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-spotify-green text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {range === 'short_term' ? 'Last 4 Weeks' : range === 'medium_term' ? 'Last 6 Months' : 'All Time'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-5 h-5 text-spotify-green" />
              <h3 className="font-semibold">Top Tracks</h3>
            </div>
            <p className="text-2xl font-bold">{stats.totalTracks}</p>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-spotify-green" />
              <h3 className="font-semibold">Top Artists</h3>
            </div>
            <p className="text-2xl font-bold">{stats.totalArtists}</p>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-spotify-green" />
              <h3 className="font-semibold">Genres</h3>
            </div>
            <p className="text-2xl font-bold">{stats.topGenres.length}</p>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-spotify-green" />
              <h3 className="font-semibold">Period</h3>
            </div>
            <p className="text-sm">
              {timeRange === 'short_term' ? '4 Weeks' : timeRange === 'medium_term' ? '6 Months' : 'All Time'}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      {stats && stats.topGenres.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Top Genres</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topGenres}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1DB954" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-4">Top Artists</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topArtists}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1ed760" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Tracks List */}
      {topTracks.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">Your Top Tracks</h2>
          <div className="space-y-2">
            {topTracks.slice(0, 20).map((track, index) => (
              <div
                key={track.id}
                className="flex items-center gap-4 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <span className="text-gray-500 w-8 text-center">{index + 1}</span>
                {track.album?.images?.[2]?.url && (
                  <img
                    src={track.album.images[2].url}
                    alt={track.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{track.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {track.artists?.map(a => a.name).join(', ')}
                  </p>
                </div>
                <a
                  href={track.external_urls?.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-spotify-green hover:text-spotify-light"
                >
                  Open in Spotify
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

