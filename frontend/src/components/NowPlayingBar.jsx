import { usePlayer } from '../contexts/PlayerContext';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Visualizer from './Visualizer';

export default function NowPlayingBar() {
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    handleNext,
    handlePrevious,
    playbackPosition,
    duration,
    seek,
    volume,
    setVolume,
  } = usePlayer();

  if (!currentTrack) return null;

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (playbackPosition / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Track Info */}
            <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
              {currentTrack.album?.images?.[2]?.url && (
                <img
                  src={currentTrack.album.images[2].url}
                  alt={currentTrack.name}
                  className="w-14 h-14 rounded object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="font-semibold truncate">{currentTrack.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {currentTrack.artists?.map(a => a.name).join(', ')}
                </p>
              </div>
            </div>

            {/* Visualizer */}
            <div className="hidden md:block flex-1 h-16 mx-4">
              <Visualizer />
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevious}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label="Previous"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={togglePlayPause}
                  className="p-3 bg-spotify-green hover:bg-spotify-light text-white rounded-full transition-colors"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label="Next"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-2 w-full max-w-md">
                <span className="text-xs text-gray-500 w-10 text-right">
                  {formatTime(playbackPosition)}
                </span>
                <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer relative group">
                  <div
                    className="absolute inset-0 bg-spotify-green rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={playbackPosition}
                    onChange={(e) => seek(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <span className="text-xs text-gray-500 w-10">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Volume */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

