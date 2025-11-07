import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, storeToken, clearToken, isTokenExpired, refreshToken } from '../utils/token';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  /**
   * Initialize authentication state
   */
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (token && !isTokenExpired()) {
        try {
          // Verify token by fetching user profile
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/spotify/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            // Token invalid, try refresh
            const newToken = await refreshToken();
            if (newToken) {
              const retryResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/spotify/me`, {
                headers: {
                  'Authorization': `Bearer ${newToken}`,
                },
              });
              if (retryResponse.ok) {
                const userData = await retryResponse.json();
                setUser(userData);
                setIsAuthenticated(true);
              } else {
                clearToken();
              }
            } else {
              clearToken();
            }
          }
        } catch (error) {
          console.error('Auth init error:', error);
          clearToken();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Handle OAuth callback
   */
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const expiresIn = urlParams.get('expires_in');
      const error = urlParams.get('error');

      if (error) {
        toast.error(`Authentication failed: ${error}`);
        navigate('/');
        return;
      }

      if (accessToken && expiresIn) {
        storeToken(accessToken, parseInt(expiresIn));
        
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/spotify/me`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setIsAuthenticated(true);
            toast.success('Welcome to Musicify!');
            navigate('/');
          }
        } catch (error) {
          console.error('Failed to fetch user:', error);
          toast.error('Failed to load user profile');
        }

        // Clean URL
        window.history.replaceState({}, document.title, '/');
      }
    };

    if (window.location.pathname === '/auth/callback') {
      handleCallback();
    }
  }, [navigate]);

  /**
   * Login with Spotify
   */
  const login = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`);
      const data = await response.json();
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to initiate login');
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearToken();
      setUser(null);
      setIsAuthenticated(false);
      navigate('/');
      toast.success('Logged out successfully');
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

