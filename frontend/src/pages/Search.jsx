import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { useSpotifyAPI } from '../hooks/useSpotifyAPI';
import SearchBar from '../components/SearchBar';
import TrackCard from '../components/TrackCard';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tracks: [], artists: [], albums: [], playlists: [] });
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const { search } = useSpotifyAPI();

  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery, 0);
    } else {
      setResults({ tracks: [], artists: [], albums: [], playlists: [] });
      setOffset(0);
      setHasMore(false);
    }
  }, [debouncedQuery]);

  const performSearch = async (searchQuery, searchOffset = 0) => {
    setLoading(true);
    try {
      const data = await search(searchQuery, 'track,artist,album,playlist', 20, searchOffset);
      
      if (searchOffset === 0) {
        setResults({
          tracks: data.tracks?.items || [],
          artists: data.artists?.items || [],
          albums: data.albums?.items || [],
          playlists: data.playlists?.items || [],
        });
      } else {
        setResults(prev => ({
          tracks: [...prev.tracks, ...(data.tracks?.items || [])],
          artists: [...prev.artists, ...(data.artists?.items || [])],
          albums: [...prev.albums, ...(data.albums?.items || [])],
          playlists: [...prev.playlists, ...(data.playlists?.items || [])],
        }));
      }

      setHasMore(
        (data.tracks?.next || data.artists?.next || data.albums?.next || data.playlists?.next) !== null
      );
      setOffset(searchOffset + 20);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore && debouncedQuery.trim()) {
      performSearch(debouncedQuery, offset);
    }
  };

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
  };

  const hasResults = results.tracks.length > 0 || results.artists.length > 0 || 
                     results.albums.length > 0 || results.playlists.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-6">Search</h1>
        <SearchBar onSearch={handleSearch} />
      </motion.div>

      {loading && !hasResults && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spotify-green mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Searching...</p>
        </div>
      )}

      {!loading && !hasResults && debouncedQuery && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No results found</p>
        </div>
      )}

      {hasResults && (
        <div className="space-y-12">
          {/* Tracks */}
          {results.tracks.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Tracks</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {results.tracks.map((track) => (
                  <TrackCard key={track.id} track={track} />
                ))}
              </div>
            </section>
          )}

          {/* Artists */}
          {results.artists.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Artists</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {results.artists.map((artist) => (
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

          {/* Albums */}
          {results.albums.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Albums</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {results.albums.map((album) => (
                  <motion.div
                    key={album.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="card"
                  >
                    {album.images?.[0]?.url ? (
                      <img
                        src={album.images[0].url}
                        alt={album.name}
                        className="w-full aspect-square object-cover rounded-lg mb-3"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-gray-300 dark:bg-gray-700 rounded-lg mb-3"></div>
                    )}
                    <h3 className="font-semibold truncate">{album.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {album.artists?.map(a => a.name).join(', ')}
                    </p>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Playlists */}
          {results.playlists.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Playlists</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {results.playlists.map((playlist) => (
                  <motion.div
                    key={playlist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="card"
                  >
                    {playlist.images?.[0]?.url ? (
                      <img
                        src={playlist.images[0].url}
                        alt={playlist.name}
                        className="w-full aspect-square object-cover rounded-lg mb-3"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-gray-300 dark:bg-gray-700 rounded-lg mb-3"></div>
                    )}
                    <h3 className="font-semibold truncate">{playlist.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {playlist.tracks?.total || 0} tracks
                    </p>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

