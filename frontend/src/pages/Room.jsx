import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { usePlayer } from '../contexts/PlayerContext';
import { useSpotifyAPI } from '../hooks/useSpotifyAPI';
import TrackCard from '../components/TrackCard';
import SearchBar from '../components/SearchBar';
import { motion } from 'framer-motion';
import { Users, SkipForward, ThumbsUp, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentTrack, playTrack, isPlaying, togglePlayPause } = usePlayer();
  const { search } = useSpotifyAPI();
  const socketRef = useRef(null);
  const [room, setRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [queue, setQueue] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [votes, setVotes] = useState(0);
  const [voteThreshold, setVoteThreshold] = useState(1);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(import.meta.env.VITE_API_BASE_URL, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    // Join room
    const username = localStorage.getItem('username') || `User ${Math.random().toString(36).substr(2, 6)}`;
    socket.emit('join_room', { roomId, username });

    // Listen for room events
    socket.on('room_state', (state) => {
      setUsers(state.users || []);
      setQueue(state.queue || []);
      if (state.currentTrack) {
        playTrack(state.currentTrack);
      }
    });

    socket.on('user_joined', (data) => {
      setUsers(data.users);
      toast.success(`${data.user.username} joined the room`);
    });

    socket.on('user_left', (data) => {
      setUsers(data.users);
    });

    socket.on('track_queued', (data) => {
      setQueue(data.queue);
      toast.success('Track added to queue');
    });

    socket.on('track_changed', (data) => {
      setQueue(data.queue);
      if (data.track) {
        playTrack(data.track);
      }
    });

    socket.on('track_skipped', (data) => {
      setQueue(data.queue);
      setVotes(0);
      if (data.currentTrack) {
        playTrack(data.currentTrack);
      } else {
        toast.info('Queue is empty');
      }
    });

    socket.on('vote_update', (data) => {
      setVotes(data.votes);
      setVoteThreshold(data.threshold);
    });

    socket.on('playback_sync', (data) => {
      // Sync playback with other users (optional)
    });

    socket.on('reaction_added', (data) => {
      toast.success(`${data.reaction} reaction added!`);
    });

    return () => {
      socket.emit('leave_room', { roomId });
      socket.disconnect();
    };
  }, [roomId]);

  const handleQueueTrack = (track) => {
    if (socketRef.current) {
      socketRef.current.emit('queue_track', { roomId, track });
      setShowSearch(false);
      setSearchResults([]);
    }
  };

  const handleVoteSkip = () => {
    if (socketRef.current) {
      socketRef.current.emit('vote_skip', { roomId });
      toast.success('Vote to skip submitted');
    }
  };

  const handleSearch = async (query) => {
    try {
      const data = await search(query, 'track', 10, 0);
      setSearchResults(data.tracks?.items || []);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search');
    }
  };

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substr(2, 9);
    navigate(`/room/${newRoomId}`);
  };

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold mb-4">Create or Join a Room</h1>
          <button onClick={handleCreateRoom} className="btn-primary">
            Create New Room
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Room: {roomId}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Collaborative listening room
          </p>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="btn-primary"
        >
          {showSearch ? 'Hide Search' : 'Add Track'}
        </button>
      </div>

      {/* Search */}
      {showSearch && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6"
        >
          <SearchBar onSearch={handleSearch} placeholder="Search tracks to add..." />
          {searchResults.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {searchResults.map((track) => (
                <div key={track.id} className="card">
                  <TrackCard track={track} showPlayButton={false} />
                  <button
                    onClick={() => handleQueueTrack(track)}
                    className="w-full mt-2 btn-primary text-sm"
                  >
                    Add to Queue
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Track */}
          {currentTrack && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card"
            >
              <h2 className="text-xl font-bold mb-4">Now Playing</h2>
              <div className="flex items-center gap-4">
                {currentTrack.album?.images?.[0]?.url && (
                  <img
                    src={currentTrack.album.images[0].url}
                    alt={currentTrack.name}
                    className="w-24 h-24 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{currentTrack.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {currentTrack.artists?.map(a => a.name).join(', ')}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={togglePlayPause}
                      className="btn-primary"
                    >
                      {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button
                      onClick={handleVoteSkip}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <SkipForward className="w-4 h-4" />
                      Vote Skip ({votes}/{voteThreshold})
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Queue */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Queue ({queue.length})</h2>
            {queue.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                Queue is empty. Add some tracks!
              </p>
            ) : (
              <div className="space-y-2">
                {queue.map((track, index) => (
                  <div
                    key={`${track.id}-${index}`}
                    className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <span className="text-gray-500 w-6">{index + 1}</span>
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Users */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5" />
              <h2 className="text-xl font-bold">Users ({users.length})</h2>
            </div>
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <div className="w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center text-white font-semibold">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="font-medium">{user.username}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

