import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const VideoCard = memo(({ video, index, searchTerm, setVideoRef, toggleMute, enterFullscreen, getTweetId, formatMetadata, setPopupTweetUrl, navigate }) => {
  const [isHovered, setIsHovered] = useState(false);
  const tweetUrl = `https://twitter.com/i/status/${getTweetId(video.filename)}`;
  const location = video.location || 'Unknown Location';
  const tags = video.tags ? video.tags.split(',').map(tag => tag.trim()) : [];

  return (
    <div
      className="video-card"
      style={{
        backgroundColor: '#000',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: isHovered ? '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)' : '0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        transition: 'all 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
        position: 'relative',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
        }}
      >
        <span
          style={{
            color: '#fff',
            fontWeight: '700',
            fontSize: '14px',
          }}
        >
          {searchTerm ? '#Result' : `#${index + 1}`}
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 10,
          backgroundColor: 'rgba(29, 161, 242, 0.85)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          padding: '6px 12px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
        }}
      >
        <span
          style={{
            color: '#fff',
            fontWeight: '700',
            fontSize: '14px',
          }}
        >
          {Math.round(video.rating)}
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          aspectRatio: '16/9',
          backgroundColor: '#000',
          cursor: 'pointer',
          overflow: 'hidden',
        }}
        onClick={() => navigate(`/analyze?video_id=${video.id}`)}
      >
        <video
          data-src={`https://ufobattler.com/videos/${video.filename}`}
          loop
          muted
          playsInline
          preload="none"
          ref={(el) => setVideoRef(el, video)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            display: 'flex',
            gap: '12px',
            zIndex: 5,
            opacity: isHovered ? 1 : 0.8,
            transition: 'opacity 0.3s ease',
          }}
        >
          <button
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              transition: 'transform 0.2s ease, background-color 0.2s ease',
            }}
            onClick={(e) => {
              e.stopPropagation();
              toggleMute(video.id);
            }}
          >
            <span style={{ color: '#fff', fontSize: '18px' }}>🔊</span>
          </button>
          <button
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              transition: 'transform 0.2s ease, background-color 0.2s ease',
            }}
            onClick={(e) => enterFullscreen(video.id, e)}
          >
            <span style={{ color: '#fff', fontSize: '18px' }}>⛶</span>
          </button>
          <button
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              transition: 'transform 0.2s ease, background-color 0.2s ease',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setPopupTweetUrl(tweetUrl);
            }}
          >
            <span style={{ color: '#fff', fontSize: '18px' }}>𝕏</span>
          </button>
        </div>
      </div>
      <div
        style={{
          padding: '16px',
          background: 'linear-gradient(to bottom, #111, #1a1a1a)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: '600' }}>
            {location}
          </h3>
          <span style={{ fontSize: '14px', color: '#aaa' }}>
            {video.capture_date || 'Unknown date'}
          </span>
        </div>
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor: 'rgba(29, 161, 242, 0.15)',
                  color: '#1DA1F2',
                  borderRadius: '14px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span
                style={{
                  color: '#aaa',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: '4px',
                }}
              >
                +{tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 40%)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
});

const VideoListItem = memo(({ video, index, searchTerm, formatMetadata }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <li
      style={{
        backgroundColor: isHovered ? '#2a2a2a' : '#222',
        borderRadius: '12px',
        padding: '14px 16px',
        boxShadow: isHovered ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => window.open(`https://ufobattler.com/videos/${video.filename}`, '_blank')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{
            backgroundColor: '#1DA1F2',
            color: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
            fontSize: '12px',
            fontWeight: 'bold',
          }}>
            {index + 101}
          </span>
          <span style={{ color: '#fff', fontWeight: '500', fontSize: '14px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
            {video.filename}
          </span>
        </div>
        <span style={{
          backgroundColor: 'rgba(29, 161, 242, 0.15)',
          color: '#1DA1F2',
          borderRadius: '10px',
          padding: '4px 10px',
          fontSize: '13px',
          fontWeight: '700',
        }}>
          {Math.round(video.rating)}
        </span>
      </div>
      <div style={{
        fontSize: '12px',
        color: '#999',
        marginTop: '6px',
        marginLeft: '36px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {video.location || 'Unknown'}
        </span>
        <span style={{ fontSize: '4px', color: '#666' }}>●</span>
        <span>{video.capture_date || 'Unknown date'}</span>
      </div>
    </li>
  );
});

function Leaderboard() {
  const [videos, setVideos] = useState([]);
  const [videoCount, setVideoCount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [visibleCount, setVisibleCount] = useState(18);
  const [popupTweetUrl, setPopupTweetUrl] = useState(null);
  const videoRefs = useRef({});
  const observers = useRef({});
  const searchInputRef = useRef(null);
  const preloadObserver = useRef(null);
  const popupRef = useRef(null);
  const searchTags = ['orb', 'jellyfish', 'cigar', 'metallic', 'acceleration', 'tetra', 'beam', 'hypersonic', 'craft'];
  const navigate = useNavigate();

  const getTweetId = useCallback((filename) => {
    if (!filename) return null;
    if (/^\d+$/.test(filename)) return filename;
    if (filename.includes('/')) {
      const parts = filename.split('/');
      const filenameOnly = parts[parts.length - 1];
      if (filenameOnly.includes('_')) {
        return filenameOnly.split('_')[0];
      }
    }
    if (filename.includes('_')) {
      return filename.split('_')[0];
    }
    const matches = filename.match(/twitter\.com\/\w+\/status\/(\d+)/);
    if (matches && matches[1]) {
      return matches[1];
    }
    const statusMatches = filename.match(/i\/status\/(\d+)/);
    if (statusMatches && statusMatches[1]) {
      return matches[1];
    }
    return null;
  }, []);

  const formatMetadata = useCallback((video) => {
    const location = video.location || 'Unknown';
    const captureDate = video.capture_date || 'Unknown';
    const tags = video.tags ? video.tags.split(',').map(tag => `#${tag.trim()}`).join(' ') : '';
    return `${location} · ${captureDate}${tags ? ` · ${tags}` : ''}`;
  }, []);

  const handleTagClick = useCallback((tag) => {
    setSearchTerm(tag);
    setVisibleCount(18);
    window.scrollTo(0, 0);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const filteredVideos = useMemo(() => {
    if (!searchTerm.trim()) return videos;
    const search = searchTerm.toLowerCase();
    return videos.filter(video => {
      const filename = video.filename.toLowerCase();
      const location = (video.location || '').toLowerCase();
      const captureDate = (video.capture_date || '').toLowerCase();
      const tags = (video.tags || '').toLowerCase();
      return filename.includes(search) ||
             location.includes(search) ||
             captureDate.includes(search) ||
             tags.includes(search);
    });
  }, [videos, searchTerm]);

  const topVideos = useMemo(() =>
    filteredVideos.slice(0, visibleCount),
    [filteredVideos, visibleCount]
  );

  useEffect(() => {
    if (!window.twttr) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      document.head.appendChild(script);
      window.twitterWidgetsLoaded = false;
      window.twttrCallback = function() {
        window.twitterWidgetsLoaded = true;
      };
      window.twttr = {
        _e: [],
        ready: function(f) {
          window.twttr._e.push(f);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (popupTweetUrl && popupRef.current) {
      while (popupRef.current.firstChild) {
        popupRef.current.removeChild(popupRef.current.firstChild);
      }
      const tweetContainer = document.createElement('div');
      popupRef.current.appendChild(tweetContainer);
      const checkTwitterAndEmbed = () => {
        if (window.twttr && typeof window.twttr.widgets === 'object') {
          window.twttr.widgets.createTweet(
            getTweetId(popupTweetUrl),
            tweetContainer,
            {
              theme: darkMode ? 'dark' : 'light',
              dnt: true,
              align: 'center'
            }
          ).catch(error => {
            tweetContainer.innerHTML = '<p>Could not load tweet. Please try again later.</p>';
          });
        } else {
          setTimeout(checkTwitterAndEmbed, 500);
        }
      };
      checkTwitterAndEmbed();
    }
  }, [popupTweetUrl, darkMode, getTweetId]);

  const setupVideoObserver = useCallback((videoEl, videoId) => {
    if (!videoEl) return;
    if (observers.current[videoId]) {
      observers.current[videoId].disconnect();
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const playVideo = () => {
              videoEl.play().catch((error) => {
                if (error.name !== 'NotAllowedError') {
                  console.warn('Error playing video:', error);
                }
              });
            };
            playVideo();
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile) {
              setTimeout(playVideo, 100);
            }
          } else {
            videoEl.pause();
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px 100px 0px'
      }
    );
    observer.observe(videoEl);
    observers.current[videoId] = observer;
  }, []);

  const setVideoRef = useCallback((el, video) => {
    if (el) {
      videoRefs.current[video.id] = el;
      setupVideoObserver(el, video.id);
    }
  }, [setupVideoObserver]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [leaderboardResponse, countResponse] = await Promise.all([
        fetch('https://ufobattler.com/api/leaderboard'),
        fetch('https://ufobattler.com/api/videoCount')
      ]);
      const leaderboardData = await leaderboardResponse.json();
      const countData = await countResponse.json();
      setVideos(leaderboardData);
      setVideoCount(countData.count);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
    return () => {
      Object.values(observers.current).forEach(observer => observer?.disconnect());
      if (preloadObserver.current) {
        preloadObserver.current.disconnect();
      }
    };
  }, [fetchData]);

  useEffect(() => {
    preloadObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const videoEl = entry.target;
            if (videoEl.dataset.src) {
              videoEl.src = videoEl.dataset.src;
              delete videoEl.dataset.src;
            }
            preloadObserver.current.unobserve(videoEl);
          }
        });
      },
      { rootMargin: '200px 0px' }
    );
    return () => {
      preloadObserver.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (topVideos.length > 0) {
      const firstSix = topVideos.slice(0, 6);
      firstSix.forEach(video => {
        const videoEl = videoRefs.current[video.id];
        if (videoEl && videoEl.dataset.src) {
          videoEl.src = videoEl.dataset.src;
          delete videoEl.dataset.src;
        }
      });
    }
  }, [topVideos]);

  useEffect(() => {
    if (!preloadObserver.current) return;
    const currentIds = new Set(topVideos.map(v => v.id));
    Object.keys(videoRefs.current).forEach(id => {
      if (!currentIds.has(id)) {
        delete videoRefs.current[id];
      }
    });
    requestAnimationFrame(() => {
      topVideos.forEach(video => {
        const videoEl = videoRefs.current[video.id];
        if (videoEl && videoEl.dataset.src) {
          const rect = videoEl.getBoundingClientRect();
          const inView = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
          );
          if (inView) {
            videoEl.src = videoEl.dataset.src;
            delete videoEl.dataset.src;
            preloadObserver.current.unobserve(videoEl);
          } else {
            preloadObserver.current.observe(videoEl);
          }
        }
      });
    });
  }, [topVideos]);

  const toggleMute = useCallback((videoId) => {
    const videoRef = videoRefs.current[videoId];
    if (videoRef) {
      videoRef.muted = !videoRef.muted;
      if (!videoRef.muted && videoRef.paused) {
        videoRef.play().catch(err => console.warn('Unable to play on unmute:', err));
      }
    }
  }, []);

  const enterFullscreen = useCallback((videoId, e) => {
    e.stopPropagation();
    const videoRef = videoRefs.current[videoId];
    if (videoRef) {
      const wasPlaying = !videoRef.paused;
      if (!wasPlaying) {
        videoRef.play().catch(err => console.warn('Cannot play for fullscreen:', err));
      }
      requestAnimationFrame(() => {
        try {
          if (videoRef.webkitEnterFullscreen) {
            videoRef.webkitEnterFullscreen();
          } else if (videoRef.requestFullscreen) {
            videoRef.requestFullscreen().catch(err => console.error('Fullscreen error:', err));
          } else if (videoRef.webkitRequestFullscreen) {
            videoRef.webkitRequestFullscreen();
          } else if (videoRef.mozRequestFullScreen) {
            videoRef.mozRequestFullScreen();
          } else if (videoRef.msRequestFullscreen) {
            videoRef.msRequestFullscreen();
          }
          if (!wasPlaying) {
            setTimeout(() => {
              if (videoRef && !videoRef.paused && !wasPlaying) {
                videoRef.pause();
              }
            }, 300);
          }
        } catch (error) {
          console.error('Fullscreen error:', error);
        }
      });
    }
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setVisibleCount(18);
    window.scrollTo(0, 0);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const colors = {
    bg: darkMode ? '#121212' : '#f5f5f7',
    card: darkMode ? '#1E1E1E' : '#ffffff',
    text: darkMode ? '#ffffff' : '#1d1d1f',
    textSecondary: darkMode ? '#aaaaaa' : '#6e6e73',
    accent: '#1DA1F2',
    border: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    shadow: darkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)',
  };

  return (
    <>
      <style>
        {`
          body {
            margin: 0;
            padding: 0;
            background-color: ${colors.bg};
            color: ${colors.text};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            transition: background-color 0.3s ease;
          }
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: ${darkMode ? '#1a1a1a' : '#f1f1f1'};
          }
          ::-webkit-scrollbar-thumb {
            background: ${darkMode ? '#555' : '#c1c1c1'};
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${darkMode ? '#777' : '#a1a1a1'};
          }
          .video-card {
            width: calc(33.33% - 20px);
            margin-bottom: 30px;
          }
          @media (max-width: 1200px) {
            .video-card {
              width: calc(50% - 20px);
            }
          }
          @media (max-width: 768px) {
            .video-card {
              width: 100%;
              max-width: 500px;
              margin-left: auto;
              margin-right: auto;
            }
          }
          .search-input {
            transition: all 0.3s ease;
          }
          .search-input:focus {
            box-shadow: 0 0 0 3px ${colors.accent}40;
          }
          .button-hover:hover {
            transform: scale(1.05);
            background-color: ${colors.accent};
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fade-in {
            animation: fadeIn 0.5s ease forwards;
          }
          .nav-link {
            position: relative;
            text-decoration: none;
            color: ${colors.textSecondary};
            font-weight: 500;
            padding: 5px 0;
            margin: 0 15px;
            transition: color 0.3s ease;
          }
          .nav-link:hover {
            color: ${colors.accent};
          }
          .nav-link::after {
            content: '';
            position: absolute;
            width: 0;
            height: 2px;
            bottom: 0;
            left: 0;
            background-color: ${colors.accent};
            transition: width 0.3s ease;
          }
          .nav-link:hover::after {
            width: 100%;
          }
          .search-tag {
            display: inline-block;
            background-color: ${darkMode ? 'rgba(29, 161, 242, 0.1)' : 'rgba(29, 161, 242, 0.1)'};
            border-radius: 20px;
            padding: 6px 16px;
            margin: 0 8px 10px 0;
            color: ${colors.accent};
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .search-tag:hover {
            background-color: ${darkMode ? 'rgba(29, 161, 242, 0.2)' : 'rgba(29, 161, 242, 0.2)'};
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          .search-tag.active {
            background-color: ${colors.accent};
            color: white;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.bg,
        transition: 'background-color 0.3s ease',
      }}>
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: darkMode ? 'rgba(18, 18, 18, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${colors.border}`,
          padding: '12px 0',
          transition: 'background-color 0.3s ease',
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h1 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                color: colors.text,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ color: colors.accent }}>UFO</span>
                <span>Battler</span>
              </h1>
            </div>
            <nav style={{ display: 'flex', alignItems: 'center' }}>
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/leaderboard" className="nav-link" style={{ color: colors.accent }}>Leaderboard</Link>
              <button
                onClick={toggleDarkMode}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  marginLeft: '10px',
                  color: colors.text,
                  fontSize: '18px',
                }}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </nav>
          </div>
        </header>
        <main style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '40px 20px',
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '30px',
          }}>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '700',
              marginBottom: '16px',
              color: colors.text,
            }}>
              TOP <span style={{ color: colors.accent }}>UFO</span> VIDEOS
            </h1>
            <p style={{
              fontSize: '16px',
              color: colors.textSecondary,
              maxWidth: '600px',
              margin: '0 auto 20px',
              lineHeight: '1.6',
            }}>
              Use <span style={{ color: colors.accent, fontWeight: '600' }}>#ufobattle</span> to have your
              video join the fight! New footage added daily.
            </p>
            {videoCount !== null && (
              <div style={{
                display: 'inline-block',
                padding: '6px 16px',
                borderRadius: '20px',
                backgroundColor: darkMode ? 'rgba(29, 161, 242, 0.1)' : 'rgba(29, 161, 242, 0.1)',
                color: colors.accent,
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '30px',
              }}>
                {videoCount} videos and counting
              </div>
            )}
            <div style={{
              maxWidth: '600px',
              margin: '0 auto 40px',
              position: 'relative',
              transition: 'all 0.3s ease',
            }}>
              <div style={{
                position: 'relative',
                backgroundColor: darkMode ? '#2a2a2a' : '#f0f0f0',
                borderRadius: '24px',
                padding: '4px 8px 4px 16px',
                display: 'flex',
                alignItems: 'center',
                boxShadow: isSearchFocused ? `0 0 0 2px ${colors.accent}` : 'none',
                transition: 'all 0.3s ease',
              }}>
                <div style={{
                  fontSize: '16px',
                  marginRight: '10px',
                  color: isSearchFocused ? colors.accent : colors.textSecondary,
                  transition: 'color 0.3s ease',
                }}>
                  🔍
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by location, date, or tags..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="search-input"
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: colors.text,
                    padding: '12px 0',
                    fontSize: '16px',
                    width: '100%',
                    outline: 'none',
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    style={{
                      backgroundColor: darkMode ? '#444' : '#e1e1e1',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: colors.textSecondary,
                      padding: 0,
                      marginRight: '6px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = darkMode ? '#555' : '#d1d1d1';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = darkMode ? '#444' : '#e1e1e1';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              {searchTerm && (
                <div style={{
                  textAlign: 'center',
                  fontSize: '14px',
                  color: colors.textSecondary,
                  marginTop: '10px',
                  animation: 'fadeIn 0.3s ease',
                }}>
                  Found {filteredVideos.length} results for "{searchTerm}"
                </div>
              )}
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              margin: '0 auto 30px',
              maxWidth: '800px',
            }}>
              {searchTags.map((tag) => (
                <div
                  key={tag}
                  className={`search-tag ${searchTerm === tag ? 'active' : ''}`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
          {isLoading ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 0',
              color: colors.textSecondary,
            }}>
              <div style={{
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                margin: '0 auto 20px',
                border: `3px solid ${colors.accent}`,
                borderTopColor: 'transparent',
                animation: 'spin 1s linear infinite',
              }} />
              <p>Loading the best UFO sightings...</p>
            </div>
          ) : (
            <>
              {topVideos.length > 0 ? (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  margin: '0 -10px 40px',
                  justifyContent: 'flex-start',
                  gap: '20px',
                }}>
                  {topVideos.map((video, index) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      index={index}
                      searchTerm={searchTerm}
                      setVideoRef={setVideoRef}
                      toggleMute={toggleMute}
                      enterFullscreen={enterFullscreen}
                      getTweetId={getTweetId}
                      formatMetadata={formatMetadata}
                      setPopupTweetUrl={setPopupTweetUrl}
                      navigate={navigate}
                    />
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  borderRadius: '16px',
                  color: colors.textSecondary,
                }}>
                  <p style={{ fontSize: '18px', marginBottom: '15px' }}>No videos found</p>
                  <p style={{ fontSize: '14px' }}>Try a different search term or check back later</p>
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      style={{
                        backgroundColor: colors.accent,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '8px 20px',
                        marginTop: '20px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(29, 321, 242, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              )}
              {visibleCount < filteredVideos.length && (
                <div style={{ textAlign: 'center', margin: '20px 0 40px' }}>
                  <button
                    onClick={() => setVisibleCount(prev => Math.min(prev + 12, filteredVideos.length))}
                    style={{
                      backgroundColor: 'transparent',
                      border: `1px solid ${colors.accent}`,
                      color: colors.accent,
                      borderRadius: '24px',
                      padding: '12px 30px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.accent;
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = colors.accent;
                    }}
                  >
                    Load More Videos
                  </button>
                </div>
              )}
            </>
          )}
          <div style={{
            marginTop: '60px',
            marginBottom: '40px',
            padding: '30px',
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '24px',
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '20px',
              textAlign: 'center',
              color: colors.text,
            }}>
              Why UFO Battler?
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              margin: '30px 0',
            }}>
              <div style={{
                padding: '24px',
                backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                borderRadius: '16px',
                boxShadow: `0 4px 20px ${colors.shadow}`,
                transition: 'transform 0.3s ease',
              }} onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                <div style={{
                  fontSize: '30px',
                  marginBottom: '15px',
                }}>🛸</div>
                <h3 style={{
                  margin: '0 0 10px',
                  color: colors.text,
                  fontSize: '18px',
                  fontWeight: '600',
                }}>
                  Best Collection
                </h3>
                <p style={{
                  margin: 0,
                  color: colors.textSecondary,
                  fontSize: '14px',
                  lineHeight: '1.5',
                }}>
                  Curated collection of the most compelling UFO videos from around the world
                </p>
              </div>
              <div style={{
                padding: '24px',
                backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                borderRadius: '16px',
                boxShadow: `0 4px 20px ${colors.shadow}`,
                transition: 'transform 0.3s ease',
              }} onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                <div style={{
                  fontSize: '30px',
                  marginBottom: '15px',
                }}>⭐</div>
                <h3 style={{
                  margin: '0 0 10px',
                  color: colors.text,
                  fontSize: '18px',
                  fontWeight: '600',
                }}>
                  Community Ranked
                </h3>
                <p style={{
                  margin: 0,
                  color: colors.textSecondary,
                  fontSize: '14px',
                  lineHeight: '1.5',
                }}>
                  Videos are ranked by the community through ongoing battles and voting
                </p>
              </div>
              <div style={{
                padding: '24px',
                backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                borderRadius: '16px',
                boxShadow: `0 4px 20px ${colors.shadow}`,
                transition: 'transform 0.3s ease',
              }} onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                <div style={{
                  fontSize: '30px',
                  marginBottom: '15px',
                }}>🔍</div>
                <h3 style={{
                  margin: '0 0 10px',
                  color: colors.text,
                  fontSize: '18px',
                  fontWeight: '600',
                }}>
                  Detailed Metadata
                </h3>
                <p style={{
                  margin: 0,
                  color: colors.textSecondary,
                  fontSize: '14px',
                  lineHeight: '1.5',
                }}>
                  Search by location, date, and tags to find specific sightings
                </p>
              </div>
            </div>
          </div>
          <div style={{
            margin: '50px 0',
            padding: '30px',
            borderRadius: '24px',
            background: `linear-gradient(135deg, ${colors.accent}, #6658ea)`,
            color: '#ffffff',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(29, 161, 242, 0.3)',
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              marginBottom: '15px',
            }}>
              Got UFO footage?
            </h2>
            <p style={{
              fontSize: '16px',
              maxWidth: '600px',
              margin: '0 auto 25px',
              opacity: 0.9,
            }}>
              Share your UFO clips with the hashtag #ufobattle on X and join the leaderboard!
            </p>
          </div>
        </main>
        <footer style={{
          backgroundColor: darkMode ? '#0a0a0a' : '#f2f2f2',
          padding: '40px 0',
          borderTop: `1px solid ${colors.border}`,
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '25px',
            }}>
              <span style={{
                fontSize: '22px',
                fontWeight: '700',
                color: colors.text,
              }}>
                <span style={{ color: colors.accent }}>UFO</span>Battler
              </span>
            </div>
            <p style={{
              margin: '0',
              fontSize: '14px',
              color: colors.textSecondary,
              textAlign: 'center',
            }}>
              <br />
              <span style={{ fontSize: '12px', opacity: 0.7 }}>
                © {new Date().getFullYear()} UFO Battler. All rights reserved.
              </span>
            </p>
          </div>
        </footer>
        {topVideos.length > 8 && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              position: 'fixed',
              bottom: '30px',
              right: '30px',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease',
              opacity: 0.8,
              zIndex: 99,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = 1;
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = 0.8;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span style={{ fontSize: '20px' }}>↑</span>
          </button>
        )}
        {popupTweetUrl && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 30,
          }}
          onClick={() => setPopupTweetUrl(null)}
          >
            <div style={{
              backgroundColor: darkMode ? '#1E1E1E' : '#ffffff',
              padding: '16px',
              borderRadius: '24px',
              textAlign: 'center',
              color: colors.text,
              width: '90%',
              maxWidth: '500px',
              height: '80vh',
              maxHeight: '600px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              border: `1px solid ${colors.border}`,
              animation: 'fadeIn 0.5s ease',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
            >
              <button
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: darkMode ? 'rgba(60, 60, 60, 0.8)' : 'rgba(240, 240, 240, 0.8)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: darkMode ? '#ffffff' : '#333333',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  zIndex: 2,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }}
                onClick={() => setPopupTweetUrl(null)}
                aria-label="Close tweet"
              >
                ×
              </button>
              <div style={{
                borderBottom: `1px solid ${colors.border}`,
                padding: '8px 0 12px',
                marginBottom: '12px',
                fontSize: '16px',
                fontWeight: '500',
              }}>
                Original Tweet
              </div>
              <div
                ref={popupRef}
                style={{
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  flex: 1,
                  padding: '0 4px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: darkMode ? '#555 #1a1a1a' : '#c1c1c1 #f1f1f1',
                }}
              >
                <div className="tweet-loading" style={{
                  minHeight: '150px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <div style={{
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    margin: '0 auto',
                    border: `3px solid ${colors.accent}`,
                    borderTopColor: 'transparent',
                    animation: 'spin 1s linear infinite',
                  }} />
                </div>
              </div>
              <div style={{
                borderTop: `1px solid ${colors.border}`,
                paddingTop: '12px',
                marginTop: '12px',
                fontSize: '12px',
                color: colors.textSecondary,
              }}>
                View on <a href={popupTweetUrl} target="_blank" rel="noopener noreferrer"
                  style={{ color: colors.accent, textDecoration: 'none' }}
                  onClick={(e) => e.stopPropagation()}>
                  Twitter/X
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Leaderboard;
