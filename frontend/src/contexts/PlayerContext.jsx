import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { cachePreview, getCachedPreview } from '../utils/cache';
import toast from 'react-hot-toast';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [queue, setQueue] = useState([]);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);
  const visualizerRef = useRef(null);

  // Expose audio element for visualizer
  useEffect(() => {
    if (audioRef.current) {
      visualizerRef.current = audioRef.current;
    }
  }, [audioRef.current]);

  /**
   * Initialize audio element
   */
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;

      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current.duration);
      });

      audioRef.current.addEventListener('timeupdate', () => {
        setPlaybackPosition(audioRef.current.currentTime);
      });

      audioRef.current.addEventListener('ended', () => {
        handleNext();
      });

      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        toast.error('Failed to play track');
        setIsPlaying(false);
      });

      // Expose audio element for visualizer
      visualizerRef.current = audioRef.current;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      visualizerRef.current = null;
    };
  }, []);

  /**
   * Update volume
   */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  /**
   * Play a track
   */
  const playTrack = useCallback(async (track) => {
    if (!track) return;

    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    setCurrentTrack(track);
    setIsPlaying(false);

    // Try to get preview URL
    const previewUrl = track.preview_url;
    if (!previewUrl) {
      toast.error('Preview not available for this track');
      return;
    }

    try {
      // Check cache first
      let audioUrl = await getCachedPreview(track.id);
      
      if (!audioUrl) {
        audioUrl = previewUrl;
        // Cache in background
        cachePreview(track.id, previewUrl).catch(console.error);
      }

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Play error:', error);
      toast.error('Failed to play track');
    }
  }, []);

  /**
   * Toggle play/pause
   */
  const togglePlayPause = useCallback(async () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Play error:', error);
        toast.error('Failed to play');
      }
    }
  }, [isPlaying, currentTrack]);

  /**
   * Play next track in queue
   */
  const handleNext = useCallback(() => {
    if (queue.length > 0) {
      const nextTrack = queue[0];
      setQueue(queue.slice(1));
      playTrack(nextTrack);
    } else {
      setCurrentTrack(null);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    }
  }, [queue, playTrack]);

  /**
   * Play previous track (simplified - just restart current)
   */
  const handlePrevious = useCallback(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.currentTime = 0;
      if (!isPlaying) {
        togglePlayPause();
      }
    }
  }, [currentTrack, isPlaying, togglePlayPause]);

  /**
   * Seek to position
   */
  const seek = useCallback((position) => {
    if (audioRef.current) {
      audioRef.current.currentTime = position;
      setPlaybackPosition(position);
    }
  }, []);

  /**
   * Add track to queue
   */
  const addToQueue = useCallback((track) => {
    setQueue([...queue, track]);
    toast.success('Added to queue');
  }, [queue]);

  /**
   * Clear queue
   */
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayPause, handleNext, handlePrevious]);

  const value = {
    currentTrack,
    isPlaying,
    volume,
    queue,
    playbackPosition,
    duration,
    playTrack,
    togglePlayPause,
    handleNext,
    handlePrevious,
    seek,
    addToQueue,
    clearQueue,
    setVolume,
    visualizerRef,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
}

