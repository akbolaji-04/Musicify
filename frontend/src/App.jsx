import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PlayerProvider } from './contexts/PlayerContext';
import Home from './pages/Home';
import Search from './pages/Search';
import Room from './pages/Room';
import Profile from './pages/Profile';
import SmartMix from './pages/SmartMix';
import NowPlayingBar from './components/NowPlayingBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Search as SearchIcon, Users, User, Moon, Sun, LogOut, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });
  const location = useLocation();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold">
              <Music className="w-6 h-6 text-spotify-green" />
              <span>Musicify</span>
            </Link>

            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/"
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      location.pathname === '/'
                        ? 'bg-spotify-green text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Home
                  </Link>
                  <Link
                    to="/search"
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      location.pathname === '/search'
                        ? 'bg-spotify-green text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <SearchIcon className="w-4 h-4" />
                    Search
                  </Link>
                  <Link
                    to="/room"
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      location.pathname.startsWith('/room')
                        ? 'bg-spotify-green text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Rooms
                  </Link>
                  <Link
                    to="/mix"
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      location.pathname === '/mix'
                        ? 'bg-spotify-green text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Mix
                  </Link>
                  <Link
                    to="/profile"
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      location.pathname === '/profile'
                        ? 'bg-spotify-green text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    {user?.display_name || 'Profile'}
                  </Link>
                  <button
                    onClick={logout}
                    className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <button 
                  onClick={async () => {
                    try {
                      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`);
                      const data = await response.json();
                      window.location.href = data.authUrl;
                    } catch (error) {
                      console.error('Login error:', error);
                    }
                  }} 
                  className="btn-primary"
                >
                  Login with Spotify
                </button>
              )}

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="pb-24"
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/room" element={<Room />} />
            <Route path="/room/:roomId" element={<Room />} />
            <Route path="/mix" element={<SmartMix />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth/callback" element={<Home />} />
          </Routes>
        </motion.main>
      </AnimatePresence>

      {/* Now Playing Bar */}
      <NowPlayingBar />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--toast-bg, #333)',
            color: 'var(--toast-color, #fff)',
          },
          success: {
            iconTheme: {
              primary: '#1DB954',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <PlayerProvider>
          <AppContent />
        </PlayerProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

