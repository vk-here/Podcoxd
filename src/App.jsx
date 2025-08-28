import React, { useState, useEffect } from 'react';
import { Search, Play, Heart, Clock, Star, ExternalLink, User, LogOut, Menu, X, Calendar, TrendingUp, BookOpen } from 'lucide-react';

const PodcastTracker = () => {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [podcasts, setPodcasts] = useState([]);
  const [userLogs, setUserLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState('trending');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [trendingPodcasts, setTrendingPodcasts] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(false);

  // API configuration
  const API_CONFIG = {
    KEY: import.meta.env.VITE_LISTEN_API_KEY,
    BASE_URL: 'https://listen-api.listennotes.com/api/v2'
};
  // Mock podcast data
  const mockPodcasts = [
    {
      id: 1,
      title: "The Joe Rogan Experience",
      description: "The Joe Rogan Experience podcast is a long form conversation hosted by comedian Joe Rogan with friends and guests.",
      image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop&crop=center",
      category: "Comedy",
      rating: 4.5,
      episodes: 2000,
      links: {
        spotify: "https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk",
        apple: "https://podcasts.apple.com/us/podcast/the-joe-rogan-experience/id360084272"
      }
    },
    // ... other mock podcasts
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem('podcastUser');
    const savedLogs = localStorage.getItem('podcastLogs');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedLogs) {
      setUserLogs(JSON.parse(savedLogs));
    }
    
    fetchTrendingPodcasts();

    return () => {
      if (window.searchTimeout) {
        clearTimeout(window.searchTimeout);
      }
    };
  }, []);

  const getGenreName = (genreId) => {
    const genres = {
      68: 'TV & Film',
      77: 'Health & Fitness',
      88: 'Technology',
      93: 'Business',
      99: 'News',
      111: 'Education',
      117: 'Government',
      122: 'Society & Culture',
      125: 'History',
      127: 'Religion & Spirituality',
      133: 'Comedy',
      135: 'Kids & Family',
      144: 'Personal Journals',
      151: 'Locally Focused',
      157: 'Philosophy',
      160: 'Science',
      168: 'Fiction',
      82: 'Leisure'
    };
    return genres[genreId] || 'General';
  };

  const fetchTrendingPodcasts = async () => {
    setApiLoading(true);
    setApiError(null);
    
    try {
      // REMOVE THE STRING CHECK - just check if it exists
      if (!API_CONFIG.KEY) {
        setPodcasts(mockPodcasts);
        setTrendingPodcasts(mockPodcasts.slice(0, 6));
        setApiError('API key not configured. Showing sample data.');
        return;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/best_podcasts`,
        {
          headers: {
            'X-ListenAPI-Key': API_CONFIG.KEY,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const formattedPodcasts = data.podcasts.map(podcast => ({
          id: podcast.id,
          title: podcast.title,
          description: podcast.description,
          image: podcast.image,
          category: podcast.genre_ids?.[0] ? getGenreName(podcast.genre_ids[0]) : 'General',
          rating: (podcast.listennotes_url ? 4.5 : 4.0),
          episodes: podcast.total_episodes || 0,
          links: {
            spotify: podcast.extra?.spotify_url || null,
            apple: podcast.extra?.apple_podcasts_url || null,
            google: podcast.extra?.google_podcasts_url || null,
            website: podcast.website || null,
            listennotes: podcast.listennotes_url
          }
        }));
        
        setTrendingPodcasts(formattedPodcasts);
        setPodcasts(formattedPodcasts);
      } else {
        // Handle API errors gracefully
        console.warn('API returned non-OK status:', response.status);
        setPodcasts(mockPodcasts);
        setTrendingPodcasts(mockPodcasts.slice(0, 6));
        setApiError('API returned an error. Showing sample data.');
      }
    } catch (error) {
      console.error('API Error:', error);
      setApiError('Failed to load trending podcasts. Showing sample data.');
      setPodcasts(mockPodcasts);
      setTrendingPodcasts(mockPodcasts.slice(0, 6));
    } finally {
      setApiLoading(false);
    }
  };

  const searchPodcasts = async (query, page = 1) => {
    setApiLoading(true);
    setApiError(null);
    
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/search?q=${encodeURIComponent(query)}&type=podcast&page=${page}`,
        {
          headers: {
            'X-ListenAPI-Key': API_CONFIG.KEY,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
          setPodcasts([]);
          setHasMoreResults(false);
          setApiError('No podcasts found');
          return;
        }
        
        const formattedResults = data.results.map(podcast => ({
          id: podcast.id,
          title: podcast.title_original,
          description: podcast.description_original,
          image: podcast.image,
          category: podcast.genre_ids?.[0] ? getGenreName(podcast.genre_ids[0]) : 'General',
          rating: 4.2,
          episodes: podcast.total_episodes || 0,
          links: {
            spotify: podcast.extra?.spotify_url || null,
            apple: podcast.extra?.apple_podcasts_url || null,
            google: podcast.extra?.google_podcasts_url || null,
            website: podcast.website || null,
            listennotes: podcast.listennotes_url
          }
        }));
        
        if (page === 1) {
          setPodcasts(formattedResults);
        } else {
          setPodcasts(prev => [...prev, ...formattedResults]);
        }
        
        setHasMoreResults(data.next_page_number !== null);
        setSearchPage(page);
      } else {
        setApiError('Failed to search podcasts');
      }
    } catch (error) {
      console.error('Search Error:', error);
      setApiError('Failed to search podcasts');
    } finally {
      setApiLoading(false);
    }
  };

  const handleLogin = (email, password) => {
    const userData = { id: Date.now(), email, name: email.split('@')[0] };
    setUser(userData);
    localStorage.setItem('podcastUser', JSON.stringify(userData));
    setShowLogin(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('podcastUser');
  };

  const logPodcastListen = (podcastId, rating = null, notes = '') => {
    if (!user) return;
    
    const logEntry = {
      id: Date.now(),
      userId: user.id,
      podcastId,
      timestamp: new Date().toISOString(),
      rating,
      notes
    };
    
    const newLogs = [...userLogs, logEntry];
    setUserLogs(newLogs);
    localStorage.setItem('podcastLogs', JSON.stringify(newLogs));
  };

  const filteredPodcasts = podcasts.filter(podcast =>
    podcast.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    podcast.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    podcast.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userListenedPodcasts = userLogs.filter(log => log.userId === user?.id);
  const recentLogs = userListenedPodcasts.slice(-5).reverse();

  const PlatformIcon = ({ platform, url }) => {
    if (!url) return null;
    
    const icons = {
      spotify: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1DB954">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.48.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.32 11.28-1.08 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      ),
      apple: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#000000">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      ),
      google: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#4285f4">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
      website: <ExternalLink size={20} className="text-gray-600" />,
      listennotes: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#c4302b">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none"/>
        </svg>
      )
    };
    
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-110 transition-transform"
        title={`Listen on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`}
      >
        {icons[platform]}
      </a>
    );
  };

  const PodcastCard = ({ podcast }) => {
    const hasListened = user && userLogs.some(log => 
      log.userId === user.id && log.podcastId === podcast.id
    );
    
    return (
      <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
        <div className="aspect-square bg-gray-100 rounded-t-xl overflow-hidden">
          <img 
            src={podcast.image} 
            alt={podcast.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2">{podcast.title}</h3>
            {hasListened && (
              <Heart size={16} className="text-red-500 fill-current flex-shrink-0 ml-2" />
            )}
          </div>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{podcast.description}</p>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              {podcast.category}
            </span>
            <div className="flex items-center text-sm text-gray-500">
              <Star size={14} className="text-yellow-400 fill-current mr-1" />
              {podcast.rating}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {podcast.links.spotify && <PlatformIcon platform="spotify" url={podcast.links.spotify} />}
              {podcast.links.apple && <PlatformIcon platform="apple" url={podcast.links.apple} />}
              {podcast.links.google && <PlatformIcon platform="google" url={podcast.links.google} />}
              {podcast.links.website && <PlatformIcon platform="website" url={podcast.links.website} />}
              {podcast.links.listennotes && <PlatformIcon platform="listennotes" url={podcast.links.listennotes} />}
            </div>
            
            {user && (
              <button
                onClick={() => logPodcastListen(podcast.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  hasListened
                    ? 'bg-green-100 text-green-700'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                {hasListened ? 'Listened' : 'Log Listen'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
            <button 
              onClick={() => setShowLogin(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={() => handleLogin(email, password)}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              Sign In
            </button>
            <p className="text-sm text-gray-600 text-center">
              Demo: Enter any email and password to sign in
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <Play className="h-8 w-8 text-purple-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Podcoxd</span>
              </div>
              
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                <button
                  onClick={() => setActiveTab('trending')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'trending'
                      ? 'text-purple-600 bg-purple-100'
                      : 'text-gray-700 hover:text-purple-600'
                  }`}
                >
                  Trending
                </button>
                <button
                  onClick={() => setActiveTab('discover')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'discover'
                      ? 'text-purple-600 bg-purple-100'
                      : 'text-gray-700 hover:text-purple-600'
                  }`}
                >
                  Discover
                </button>
                {user && (
                  <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'logs'
                        ? 'text-purple-600 bg-purple-100'
                        : 'text-gray-700 hover:text-purple-600'
                    }`}
                  >
                    My Logs
                  </button>
                )}
              </div>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden ml-4"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* User section */}
            <div className="flex items-center">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="hidden sm:block text-sm text-gray-700">Hi, {user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-sm text-gray-700 hover:text-purple-600"
                  >
                    <LogOut size={18} className="mr-1" />
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="flex items-center text-sm text-gray-700 hover:text-purple-600"
                >
                  <User size={18} className="mr-1" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={() => {setActiveTab('trending'); setMobileMenuOpen(false);}}
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                  activeTab === 'trending'
                    ? 'text-purple-600 bg-purple-100'
                    : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                Trending
              </button>
              <button
                onClick={() => {setActiveTab('discover'); setMobileMenuOpen(false);}}
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                  activeTab === 'discover'
                    ? 'text-purple-600 bg-purple-100'
                    : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                Discover
              </button>
              {user && (
                <button
                  onClick={() => {setActiveTab('logs'); setMobileMenuOpen(false);}}
                  className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                    activeTab === 'logs'
                      ? 'text-purple-600 bg-purple-100'
                      : 'text-gray-700 hover:text-purple-600'
                  }`}
                >
                  My Logs
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {apiError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{apiError}</span>
            <button 
              onClick={() => setApiError(null)} 
              className="absolute top-0 right-0 p-2"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Trending Tab */}
        {activeTab === 'trending' && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                🔥 Trending Podcasts
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Discover what everyone's listening to right now
              </p>
            </div>

            {apiLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {trendingPodcasts.map((podcast) => (
                  <PodcastCard key={podcast.id} podcast={podcast} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Discover Podcasts
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Search and explore millions of podcasts
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search podcasts..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchPage(1);
                    clearTimeout(window.searchTimeout);
                    window.searchTimeout = setTimeout(() => {
                      if (e.target.value.trim()) {
                        searchPodcasts(e.target.value, 1);
                      } else {
                        setPodcasts(trendingPodcasts);
                        setHasMoreResults(false);
                      }
                    }, 500);
                  }}
                  className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
                />
              </div>
            </div>

            {/* User Stats - only show if logged in */}
            {user && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex items-center">
                    <BookOpen className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-2xl font-semibold text-gray-900">
                        {userListenedPodcasts.length}
                      </p>
                      <p className="text-gray-600">Podcasts Logged</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-2xl font-semibold text-gray-900">
                        {recentLogs.length}
                      </p>
                      <p className="text-gray-600">Recent Listens</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-2xl font-semibold text-gray-900">
                        {Math.floor(Math.random() * 50) + 10}
                      </p>
                      <p className="text-gray-600">Hours Listened</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {apiLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {podcasts.map((podcast) => (
                    <PodcastCard key={podcast.id} podcast={podcast} />
                  ))}
                </div>
                
                {hasMoreResults && (
                  <div className="flex justify-center mt-8">
                    <button 
                      onClick={() => searchPodcasts(searchQuery, searchPage + 1)}
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      disabled={apiLoading}
                    >
                      {apiLoading ? 'Loading...' : 'Load More Results'}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'logs' && user && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">My Podcast Logs</h2>
            
            {userListenedPodcasts.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No podcasts logged yet. Start discovering!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLogs.map((log) => {
                  const podcast = podcasts.find(p => p.id === log.podcastId) || mockPodcasts.find(p => p.id === log.podcastId);
                  return (
                    <div key={log.id} className="bg-white p-6 rounded-xl shadow-sm border">
                      <div className="flex items-center space-x-4">
                        <img 
                          src={podcast?.image} 
                          alt={podcast?.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{podcast?.title}</h3>
                          <p className="text-gray-600 text-sm">
                            Logged on {new Date(log.timestamp).toLocaleDateString()}
                          </p>
                          <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                            {podcast?.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {showLogin && <LoginForm />}
    </div>
  );
};

export default PodcastTracker;