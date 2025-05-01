import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Analyze() {
  const location = useLocation();
  const [video, setVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [similarPage, setSimilarPage] = useState(0);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [previewVideos, setPreviewVideos] = useState({});
  const videoRef = useRef(null);
  const tweetRef = useRef(null);
  const previewRefs = useRef({});
  const similarObservers = useRef({});

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Get video ID from URL query params
  const getVideoIdFromUrl = useCallback(() => {
    const params = new URLSearchParams(location.search);
    return params.get('video_id');
  }, [location.search]);

  const videoId = getVideoIdFromUrl();

  const getTweetId = useCallback((filename) => {
    if (!filename) return null;
    if (/^\d+$/.test(filename)) return filename;
    if (filename.includes('/')) {
      const parts = filename.split('/');
      const filenameOnly = parts[parts.length - 1];
      if (filenameOnly.includes('_')) return filenameOnly.split('_')[0];
    }
    if (filename.includes('_')) return filename.split('_')[0];
    const matches = filename.match(/twitter\.com\/\w+\/status\/(\d+)/);
    if (matches && matches[1]) return matches[1];
    const statusMatches = filename.match(/i\/status\/(\d+)/);
    if (statusMatches && statusMatches[1]) return statusMatches[1];
    return null;
  }, []);

  const selectVideo = useCallback((selectedVideo) => {
    setVideo(selectedVideo);
    const url = new URL(window.location);
    url.searchParams.set('video_id', selectedVideo.id);
    window.history.pushState({}, '', url);
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      if (!videoRef.current.muted && videoRef.current.paused) {
        videoRef.current.play().catch(err => console.warn('Unable to play on unmute:', err));
      }
    }
  }, []);

  const enterFullscreen = useCallback((e) => {
    e.preventDefault();
    if (videoRef.current) {
      const wasPlaying = !videoRef.current.paused;
      if (!wasPlaying) videoRef.current.play().catch(err => console.warn('Cannot play for fullscreen:', err));
      requestAnimationFrame(() => {
        try {
          if (videoRef.current.webkitEnterFullscreen) videoRef.current.webkitEnterFullscreen();
          else if (videoRef.current.requestFullscreen) videoRef.current.requestFullscreen().catch(err => console.error('Fullscreen error:', err));
          else if (videoRef.current.webkitRequestFullscreen) videoRef.current.webkitRequestFullscreen();
          else if (videoRef.current.mozRequestFullScreen) videoRef.current.mozRequestFullScreen();
          else if (videoRef.current.msRequestFullscreen) videoRef.current.msRequestFullscreen();
          if (!wasPlaying) {
            setTimeout(() => {
              if (videoRef.current && !videoRef.current.paused && !wasPlaying) videoRef.current.pause();
            }, 300);
          }
        } catch (error) {
          console.error('Fullscreen error:', error);
        }
      });
    }
  }, []);

  const shareVideo = useCallback(() => {
    if (!video) return;
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `UFO Sighting: ${video.location || 'Unknown Location'}`,
        text: `Check out this UFO sighting from ${video.location || 'Unknown Location'} ${video.capture_date ? `on ${video.capture_date}` : ''}`,
        url: shareUrl,
      }).catch((error) => console.log('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          const message = document.createElement('div');
          message.textContent = 'Link copied to clipboard!';
          message.style.position = 'fixed';
          message.style.bottom = '20px';
          message.style.left = '50%';
          message.style.transform = 'translateX(-50%)';
          message.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          message.style.color = 'white';
          message.style.padding = '10px 20px';
          message.style.borderRadius = '4px';
          message.style.zIndex = '9999';
          document.body.appendChild(message);
          setTimeout(() => document.body.removeChild(message), 2000);
        })
        .catch(err => console.error('Could not copy text: ', err));
    }
  }, [video]);

  // Autoplay setup for similar videos
  const setupSimilarVideoObserver = useCallback((videoEl, videoId) => {
    if (!videoEl) return;
    if (similarObservers.current[videoId]) {
      similarObservers.current[videoId].disconnect();
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoEl.play().catch(err => console.warn('Play error:', err));
          } else {
            videoEl.pause();
          }
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(videoEl);
    similarObservers.current[videoId] = observer;
  }, []);

  // Check if a specific observable is active based on video tags
  const isObservableActive = useCallback((observableId, tags) => {
    if (observableId === 'low-observability') return true;
    if (!tags) return false;
    const tagList = tags.toLowerCase().split(/[,;\s]+/).map(tag => tag.trim().replace(/^#/, '')).filter(tag => tag);
    switch (observableId) {
      case 'sudden-acceleration':
        return tagList.includes('acceleration') || tagList.includes('deceleration') || tagList.includes('hypersonic');
      case 'hypersonic':
        return tagList.includes('hypersonic');
      case 'trans-medium':
        return tagList.includes('transmedium') || tagList.includes('permeable');
      case 'positive-lift':
        return tagList.includes('drift') || tagList.includes('hover') || tagList.includes('acceleration') || tagList.includes('stationary');
      default:
        return false;
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const leaderboardResponse = await fetch('https://ufobattler.com/api/leaderboard');
        const leaderboardData = await leaderboardResponse.json();
        setVideos(leaderboardData);

        if (videoId) {
          const videoIdStr = videoId.toString();
          const matchedVideo = leaderboardData.find(v => v.id.toString() === videoIdStr);
          if (matchedVideo) {
            setVideo(matchedVideo);
          } else {
            try {
              const videoResponse = await fetch(`https://ufobattler.com/api/video/${videoId}`);
              const videoData = await videoResponse.json();
              if (videoData && videoData.id) {
                setVideo(videoData);
              } else {
                setVideo(leaderboardData[0]);
              }
            } catch (error) {
              console.error('Error fetching specific video:', error);
              setVideo(leaderboardData[0]);
            }
          }
        } else if (leaderboardData.length > 0) {
          setVideo(leaderboardData[0]);
          const url = new URL(window.location);
          url.searchParams.set('video_id', leaderboardData[0].id);
          window.history.pushState({}, '', url);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, [videoId]);

  useEffect(() => {
    if (!window.twttr) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      document.head.appendChild(script);
      window.twttr = { _e: [], ready: function(f) { window.twttr._e.push(f); } };
    }
  }, []);

  // FIXED TWEET EMBEDDING CODE
  useEffect(() => {
    if (!video || !tweetRef.current) return;

    // Clear any existing content
    while (tweetRef.current.firstChild) {
      tweetRef.current.removeChild(tweetRef.current.firstChild);
    }

    const tweetId = getTweetId(video.filename);
    if (!tweetId) {
      tweetRef.current.innerHTML = '<p style="color: ' + colors.textSecondary + '; font-size: 14px;">Tweet not available</p>';
      return;
    }

    // Track embedding state to prevent double embedding
    let isEmbedding = false;

    const embedTweet = () => {
      if (isEmbedding) return; // Prevent multiple embed attempts running simultaneously

      if (window.twttr && window.twttr.widgets) {
        isEmbedding = true;
        window.twttr.widgets.createTweet(tweetId, tweetRef.current, {
          theme: darkMode ? 'dark' : 'light',
          dnt: true,
          align: 'center'
        })
        .then(() => {
          isEmbedding = false;
        })
        .catch(error => {
          isEmbedding = false;
          tweetRef.current.innerHTML = '<p style="color: ' + colors.textSecondary + '; font-size: 14px;">Could not load tweet. Please try again later.</p>';
          console.error('Tweet embed error:', error);
        });
      } else {
        setTimeout(embedTweet, 500);
      }
    };

    embedTweet();

    // Cleanup function
    return () => {
      isEmbedding = false;
    };
  }, [video, darkMode, getTweetId]);

  useEffect(() => {
    let videoElement = null;
    if (videoRef.current && video) {
      videoElement = videoRef.current;
      const handleLoadStart = () => setIsVideoLoading(true);
      const handleCanPlay = () => setIsVideoLoading(false);
      videoElement.addEventListener('loadstart', handleLoadStart);
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.muted = true;
      videoElement.play().catch(err => console.warn('Autoplay issue:', err));
      return () => {
        if (videoElement) {
          videoElement.removeEventListener('loadstart', handleLoadStart);
          videoElement.removeEventListener('canplay', handleCanPlay);
        }
      };
    }
    return () => {};
  }, [video]);

  useEffect(() => {
    setSimilarPage(0);
  }, [video]);

  useEffect(() => {
    if (video && video.tags) {
      console.log('Video tags:', video.tags);
      observables.forEach(observable => {
        console.log(`Observable ${observable.id} active:`, isObservableActive(observable.id, video.tags));
      });
    }
  }, [video]);

  useEffect(() => {
    return () => {
      Object.values(similarObservers.current).forEach(observer => observer?.disconnect());
    };
  }, []);

  const colors = {
    bg: darkMode ? '#121212' : '#f5f5f7',
    card: darkMode ? '#1E1E1E' : '#ffffff',
    text: darkMode ? '#ffffff' : '#1d1d1f',
    textSecondary: darkMode ? '#aaaaaa' : '#6e6e73',
    accent: '#1DA1F2',
    border: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    shadow: darkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)',
    dimmed: darkMode ? 'rgba(170, 170, 170, 0.6)' : 'rgba(110, 110, 115, 0.6)',
  };

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const SimilarVideoCard = memo(({ video, onClick, setupObserver }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        className="similar-video-card"
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
        onClick={onClick}
      >
        <div
          style={{
            position: 'relative',
            aspectRatio: '16/9',
            backgroundColor: '#000',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
        >
          <video
            ref={(el) => {
              if (el) setupObserver(el, video.id);
            }}
            src={`https://ufobattler.com/videos/${video.filename}`}
            loop
            muted
            playsInline
            preload="metadata"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
        <div style={{ padding: '16px', background: 'linear-gradient(to bottom, #111, #1a1a1a)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: '600' }}>
              {video.location || 'Unknown Location'}
            </h3>
            <span style={{ fontSize: '14px', color: '#aaa' }}>
              {video.capture_date || 'Unknown date'}
            </span>
          </div>
          {video.tags && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {video.tags.split(',').map((tag, idx) => (
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
                  #{tag.trim()}
                </span>
              ))}
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

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: colors.bg }}>
        <style>{`body { margin: 0; padding: 0; background-color: ${colors.bg}; color: ${colors.text}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; transition: background-color 0.3s ease; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: 'center', padding: '60px 0', color: colors.textSecondary }}>
          <div style={{ borderRadius: '50%', width: '40px', height: '40px', margin: '0 auto 20px', border: `3px solid ${colors.accent}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
          <p>Loading UFO footage...</p>
        </div>
      </div>
    );
  }

  const filteredVideos = videos.filter(v => v.id !== video?.id);
  const totalPages = Math.ceil(filteredVideos.length / 3);
  const displayedVideos = filteredVideos.slice(similarPage * 3, (similarPage * 3) + 3);

  const observables = [
    {
      id: 'sudden-acceleration',
      title: 'Sudden and instantaneous acceleration',
      description: 'Objects moving in such a manner that they are capable of maneuvering suddenly, deliberately and sometimes in the opposite direction. These maneuvers involve a change in direction and acceleration well beyond the healthy limitations of any biological system to withstand.'
    },
    {
      id: 'hypersonic',
      title: 'Hypersonic velocities without signatures',
      description: 'Objects traveling well above supersonic speeds without obvious signatures like sonic booms, vapor contrails, or atmospheric ionization.'
    },
    {
      id: 'low-observability',
      title: 'Low observability',
      description: 'Objects that are difficult to detect or track clearly, whether viewed electro-optically, electromagnetically, or with the naked eye. They often appear opaque and semi-metallic in nature.'
    },
    {
      id: 'trans-medium',
      title: 'Trans-medium travel',
      description: 'Objects with the ability to travel easily in various environments (space, air, water) without any change in performance capabilities.'
    },
    {
      id: 'positive-lift',
      title: 'Positive lift',
      description: 'Objects that apparently resist Earth\'s gravity without normal aerodynamic means for lift and thrust. No obvious signs of propulsion or flight surfaces are visible.'
    }
  ];

  return (
    <>
      <style>{`
        body { margin: 0; padding: 0; background-color: ${colors.bg}; color: ${colors.text}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; transition: background-color 0.3s ease; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: ${darkMode ? '#1a1a1a' : '#f1f1f1'}; }
        ::-webkit-scrollbar-thumb { background: ${darkMode ? '#555' : '#c1c1c1'}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${darkMode ? '#777' : '#a1a1a1'}; }
        .nav-link { position: relative; text-decoration: none; color: ${colors.textSecondary}; font-weight: 500; padding: 5px 0; margin: 0 15px; transition: color 0.3s ease; }
        .nav-link:hover { color: ${colors.accent}; }
        .nav-link::after { content: ''; position: absolute; width: 0; height: 2px; bottom: 0; left: 0; background-color: ${colors.accent}; transition: width 0.3s ease; }
        .nav-link:hover::after { width: 100%; }
        .share-button { display: flex; align-items: center; justify-content: center; gap: 8px; background-color: ${colors.accent}; color: white; border: none; border-radius: 20px; padding: 8px 16px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .share-button:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .observable-item { padding: 10px 12px; border-radius: 8px; margin-bottom: 10px; transition: all 0.2s ease; }
        .observable-item.active { background-color: rgba(29, 161, 242, 0.1); border-left: 3px solid #1DA1F2; }
        .observable-title { font-weight: 600; margin-bottom: 4px; }
        .observable-description { font-size: 13px; line-height: 1.5; }
        .similar-video-card { width: calc(33.33% - 20px); margin-bottom: 30px; }
        @media (max-width: 1200px) { .similar-video-card { width: calc(50% - 20px); } }
        @media (max-width: 768px) { .similar-video-card { width: 100%; max-width: 500px; margin-left: auto; margin-right: auto; } }
      `}</style>
      <div style={{ minHeight: '100vh', backgroundColor: colors.bg, transition: 'background-color 0.3s ease' }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: darkMode ? 'rgba(18, 18, 18, 0.8)' : 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${colors.border}`, padding: '12px 0', transition: 'background-color 0.3s ease' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: colors.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: colors.accent }}>UFO</span><span>Battler</span>
              </h1>
            </div>
            <nav style={{ display: 'flex', alignItems: 'center' }}>
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
              <button onClick={toggleDarkMode} style={{ backgroundColor: 'transparent', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: '10px', color: colors.text, fontSize: '18px' }}>
                {darkMode ? '☀️' : '🌙'}
              </button>
            </nav>
          </div>
        </header>
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          {video ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '60px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '1000px', aspectRatio: '16/9', backgroundColor: '#000', borderRadius: '16px', overflow: 'hidden', boxShadow: `0 10px 30px ${colors.shadow}`, marginBottom: '24px' }}>
                <video
                  src={`https://ufobattler.com/videos/${video.filename}`}
                  ref={videoRef}
                  loop
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                {isVideoLoading && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 10
                  }}>
                    <div style={{
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      border: `3px solid ${colors.accent}`,
                      borderTopColor: 'transparent',
                      animation: 'spin 1s linear infinite'
                    }} />
                  </div>
                )}
                <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)' }}>
                  <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>#{video.id}</span>
                </div>
                <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, backgroundColor: 'rgba(29, 161, 242, 0.85)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '6px 12px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)' }}>
                  <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>{Math.round(video.rating)}</span>
                </div>
                <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', gap: '12px', zIndex: 5 }}>
                  <button style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)', transition: 'transform 0.2s ease, background-color 0.2s ease' }} onClick={toggleMute}>
                    <span style={{ color: '#fff', fontSize: '18px' }}>🔊</span>
                  </button>
                  <button style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)', transition: 'transform 0.2s ease, background-color 0.2s ease' }} onClick={enterFullscreen}>
                    <span style={{ color: '#fff', fontSize: '18px' }}>⛶</span>
                  </button>
                  <button className="share-button" onClick={shareVideo} style={{ backgroundColor: 'rgba(29, 161, 242, 0.8)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '20px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)', transition: 'all 0.2s ease' }}>
                    <span style={{ color: '#fff', fontSize: '14px' }}>Share</span>
                    <span style={{ color: '#fff', fontSize: '14px' }}>↗</span>
                  </button>
                </div>
              </div>
              <div style={{ width: '100%', maxWidth: '1000px', padding: '24px', backgroundColor: darkMode ? '#1a1a1a' : '#ffffff', borderRadius: '16px', boxShadow: `0 4px 20px ${colors.shadow}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ margin: 0, fontSize: '22px', color: colors.text, fontWeight: '700' }}>{video.location || 'Unknown Location'}</h2>
                  <div style={{ fontSize: '14px', color: colors.textSecondary }}>{video.capture_date || 'Unknown date'}</div>
                </div>
                {video.tags && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                    {video.tags.split(/[,;\s]+/).map((tag, idx) => (
                      <span key={idx} style={{ backgroundColor: 'rgba(29, 161, 242, 0.15)', color: '#1DA1F2', borderRadius: '14px', padding: '4px 10px', fontSize: '14px', fontWeight: '500' }}>#{tag.trim()}</span>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: '20px', padding: '20px', backgroundColor: darkMode ? '#222' : '#f8f8f8', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: colors.text, fontWeight: '600' }}>Analysis</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                    <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <div ref={tweetRef} style={{ minHeight: '200px' }}></div>
                      <div style={{ marginTop: '16px', textAlign: 'center' }}>
                        <a href={`https://twitter.com/i/status/${getTweetId(video.filename)}`} target="_blank" rel="noopener noreferrer" style={{ color: colors.accent, textDecoration: 'none', fontSize: '14px' }}>View on Twitter/X</a>
                      </div>
                    </div>
                    <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: colors.accent, fontWeight: '600' }}>UFO Observables</h4>
                      <p style={{ margin: '0 0 16px 0', fontSize: '15px', lineHeight: '1.6', color: colors.text }}>
                        This footage shows an unidentified flying object observed at {video.location || 'an unknown location'}{video.capture_date ? ` on ${video.capture_date}` : ''}. The following UAP observables are present:
                      </p>
                      <div style={{ marginTop: '16px' }}>
                        {observables.map(observable => {
                          const isActive = isObservableActive(observable.id, video.tags);
                          return (
                            <div
                              key={observable.id}
                              className={`observable-item ${isActive ? 'active' : ''}`}
                            >
                              <div
                                className="observable-title"
                                style={{
                                  color: isActive ? colors.text : colors.dimmed,
                                  fontSize: '15px',
                                }}
                              >
                                {observable.title}
                              </div>
                              <div
                                className="observable-description"
                                style={{
                                  color: isActive ? colors.text : colors.dimmed,
                                }}
                              >
                                {observable.description}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)', borderRadius: '16px', color: colors.textSecondary }}>
              <p style={{ fontSize: '18px', marginBottom: '15px' }}>No video selected</p>
              <p style={{ fontSize: '14px' }}>Please select a video from the leaderboard</p>
            </div>
          )}
          {video && displayedVideos.length > 0 && (
            <div style={{ marginTop: '60px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px', color: colors.text }}>Similar Sightings</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', margin: '0 -10px 40px', justifyContent: 'flex-start' }}>
                {displayedVideos.map((relatedVideo) => (
                  <SimilarVideoCard
                    key={relatedVideo.id}
                    video={relatedVideo}
                    onClick={() => selectVideo(relatedVideo)}
                    setupObserver={setupSimilarVideoObserver}
                  />
                ))}
              </div>
              {filteredVideos.length > 3 && (
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                  <button
                    onClick={() => setSimilarPage((prev) => (prev + 1) % totalPages)}
                    style={{
                      display: 'inline-block',
                      backgroundColor: 'transparent',
                      border: `1px solid ${colors.accent}`,
                      color: colors.accent,
                      borderRadius: '24px',
                      padding: '10px 24px',
                      fontSize: '16px',
                      fontWeight: '500',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.accent; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = colors.accent; }}
                  >
                    Other Similar Videos
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
        <footer style={{ backgroundColor: darkMode ? '#0a0a0a' : '#f2f2f2', padding: '40px 0', borderTop: `1px solid ${colors.border}`, marginTop: '60px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: colors.text }}><span style={{ color: colors.accent }}>UFO</span>Battler</span>
            </div>
            <p style={{ margin: '0', fontSize: '14px', color: colors.textSecondary, textAlign: 'center' }}><br /><span style={{ fontSize: '12px', opacity: 0.7 }}>© {new Date().getFullYear()} UFO Battler. All rights reserved.</span></p>
          </div>
        </footer>
      </div>
    </>
  );
}

export default Analyze;
