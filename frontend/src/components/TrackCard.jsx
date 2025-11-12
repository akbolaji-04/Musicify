import { motion } from 'framer-motion';
import { usePlayer } from '../contexts/PlayerContext';
import { Play, Pause, Plus } from 'lucide-react';
import { useSpotifyAPI } from '../hooks/useSpotifyAPI'; // 1. IMPORT THE API HOOK
import toast from 'react-hot-toast'; // 2. IMPORT TOAST FOR ERRORS

export default function TrackCard({ track, showPlayButton = true }) {
  const { playTrack, currentTrack, isPlaying, addToQueue } = usePlayer();
  const { getTrack } = useSpotifyAPI(); // 3. USE THE HOOK
  const isCurrentTrack = currentTrack?.id === track.id;

  // 4. MAKE THE FUNCTION ASYNC
  const handlePlay = async (e) => {
    e.stopPropagation();
    if (isCurrentTrack && isPlaying) {
      return;
    }
    
    try {
      // 5. GET A FRESH TRACK OBJECT WITH A VALID PREVIEW_URL
      const freshTrack = await getTrack(track.id);
      
      if (!freshTrack || !freshTrack.preview_url) {
        toast.error('Preview not available for this track');
        return;
      }
      // 6. PLAY THE FRESH, VALID TRACK
      playTrack(freshTrack);

    } catch (error) {
      console.error("Failed to get fresh track", error);
      toast.error("Failed to play track");
    }
  };

  const handleAddToQueue = (e) => {
    e.stopPropagation();
    addToQueue(track);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="card group cursor-pointer"
    >
      <div className="relative">
        {track.album?.images?.[0]?.url ? (
          <img
            src={track.album.images[0].url}
            alt={track.name}
            className="w-full aspect-square object-cover rounded-lg mb-3"
          />
        ) : (
          <div className="w-full aspect-square bg-gray-300 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
            <span className="text-gray-500">No Image</span>
          </div>
        )}

        {showPlayButton && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <button
                onClick={handlePlay}
                className="bg-spotify-green hover:bg-spotify-light text-white p-3 rounded-full transition-colors"
                aria-label={isCurrentTrack && isPlaying ? 'Pause' : 'Pause'}
              >
                {isCurrentTrack && isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={handleAddToQueue}
                className="bg-white hover:bg-gray-100 text-gray-900 p-3 rounded-full transition-colors"
                aria-label="Add to queue"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <h3 className="font-semibold text-lg truncate" title={track.name}>
        {track.name}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm truncate">
        {track.artists?.map(a => a.name).join(', ') || 'Unknown Artist'}
      </p>
      {track.album && (
        <p className="text-gray-500 dark:text-gray-500 text-xs truncate mt-1">
          {track.album.name}
        </p>
      )}
    </motion.div>
  );
}