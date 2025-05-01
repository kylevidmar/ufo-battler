import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const [videos, setVideos] = useState({ video1: null, video2: null });
  const [video1ScoreChange, setVideo1ScoreChange] = useState(null);
  const [video2ScoreChange, setVideo2ScoreChange] = useState(null);
  const video1Ref = useRef(null);
  const video2Ref = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Tweet popup state - now shared between mobile and web
  const [popupTweetUrl, setPopupTweetUrl] = useState(null);
  const popupRef = useRef(null);

  useEffect(() => {
    // Reset scroll position when component mounts
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    const hasVisitedBefore = localStorage.getItem('hasVisitedUFOBattler');
    if (!hasVisitedBefore && window.innerWidth <= 768) {
      setShowWelcomePopup(true);
      localStorage.setItem('hasVisitedUFOBattler', 'true');
    }

    return () => {
      window.removeEventListener('resize', checkIsMobile);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Load Twitter widgets.js once when component mounts
  useEffect(() => {
    if (!window.twttr) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      document.head.appendChild(script);

      // Define a global callback function for when Twitter script loads
      window.twitterWidgetsLoaded = false;
      window.twttrCallback = function() {
        window.twitterWidgetsLoaded = true;
      };

      // Attach the callback to window.twttr.ready
      window.twttr = {
        _e: [],
        ready: function(f) {
          window.twttr._e.push(f);
        }
      };
    }
  }, []);

  // Modified approach to handle tweet popup
  useEffect(() => {
    if (popupTweetUrl && popupRef.current) {
      // Clear previous content
      while (popupRef.current.firstChild) {
        popupRef.current.removeChild(popupRef.current.firstChild);
      }

      // Create a direct embed using Twitter's approach
      const tweetContainer = document.createElement('div');
      popupRef.current.appendChild(tweetContainer);

      const checkTwitterAndEmbed = () => {
        if (window.twttr && typeof window.twttr.widgets === 'object') {
          // Use Twitter's preferred embed method
          window.twttr.widgets.createTweet(
            getTweetId(popupTweetUrl),
            tweetContainer,
            {
              theme: darkMode ? 'dark' : 'light',
              dnt: true,
              align: 'center'
            }
          ).then(() => {
            // If the embed succeeded, we're good
            console.log("Tweet embedded successfully");
          }).catch(error => {
            // If embedding fails, show error message
            console.error("Tweet embed error:", error);
            tweetContainer.innerHTML = '<p>Could not load tweet. Please try again later.</p>';
          });
        } else {
          // Twitter JS not yet loaded, try again shortly
          setTimeout(checkTwitterAndEmbed, 500);
        }
      };

      checkTwitterAndEmbed();
    }
  }, [popupTweetUrl, darkMode]);

  const colors = {
    bg: darkMode ? '#121212' : '#f5f5f7',
    card: darkMode ? '#1E1E1E' : '#ffffff',
    text: darkMode ? '#ffffff' : '#1d1d1f',
    textSecondary: darkMode ? '#aaaaaa' : '#6e6e73',
    accent: '#1DA1F2',
    border: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    shadow: darkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)',
    success: '#4CAF50',
    error: '#F44336',
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const handleFullscreenChange = () => {
    const isFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    setIsFullscreenActive(isFullscreen);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('https://ufobattler.com/api/getVideos');
      const data = await response.json();
      setVideos(data);
      setVideo1ScoreChange(null);
      setVideo2ScoreChange(null);
      if (video1Ref.current) video1Ref.current.muted = true;
      if (video2Ref.current) video2Ref.current.muted = true;
      setIsTransitioning(false);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const chooseVideo = async (winnerId, loserId) => {
    if (isFullscreenActive || isTransitioning) return;

    setIsTransitioning(true);
    const isVideo1Winner = winnerId === videos.video1?.id;
    const isVideo2Winner = winnerId === videos.video2?.id;

    setSelectedVideo(isVideo1Winner ? 'video1' : 'video2');

    setTimeout(async () => {
      try {
        const response = await fetch('https://ufobattler.com/api/choose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ winnerId, loserId }),
        });
        const data = await response.json();
        if (data.success) {
          const winnerChange = `${Math.round(data.winner.oldRating)} → ${Math.round(data.winner.newRating)}`;
          const loserChange = `${Math.round(data.loser.oldRating)} → ${Math.round(data.loser.newRating)}`;

          if (!isMobile) {
            if (isVideo1Winner) {
              setVideo1ScoreChange({ text: winnerChange, color: 'green' });
              setVideo2ScoreChange({ text: loserChange, color: 'red' });
            } else {
              setVideo2ScoreChange({ text: winnerChange, color: 'green' });
              setVideo1ScoreChange({ text: loserChange, color: 'red' });
            }
          }

          setTimeout(() => {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(err => console.warn('Error exiting fullscreen:', err));
            } else if (document.webkitFullscreenElement) {
              document.webkitExitFullscreen();
            } else if (document.mozFullScreenElement) {
              document.mozCancelFullScreen();
            } else if (document.msFullscreenElement) {
              document.msExitFullscreen();
            }

            fetchVideos();
            setSelectedVideo(null);
          }, 1500);
        }
      } catch (error) {
        console.error('Choose error:', error);
        setIsTransitioning(false);
      }
    }, 300);
  };

  const toggleMute = (videoRef, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      if (!videoRef.current.muted && videoRef.current.paused) {
        videoRef.current.play().catch(err => console.warn('Cannot play after unmute:', err));
      }
    }
  };

  const enterFullscreen = (videoRef, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (videoRef.current) {
      const wasPlaying = !videoRef.current.paused;
      const wasMuted = videoRef.current.muted;

      if (!wasPlaying) {
        videoRef.current.play().catch(err => console.warn('Cannot play for fullscreen:', err));
      }

      setTimeout(() => {
        try {
          if (videoRef.current.webkitEnterFullscreen) {
            videoRef.current.webkitEnterFullscreen();
          } else if (videoRef.current.requestFullscreen) {
            videoRef.current.requestFullscreen().catch(err => console.error('Fullscreen error:', err));
          } else if (videoRef.current.webkitRequestFullscreen) {
            videoRef.current.webkitRequestFullscreen();
          } else if (videoRef.current.mozRequestFullScreen) {
            videoRef.current.mozRequestFullScreen();
          } else if (videoRef.current.msRequestFullscreen) {
            videoRef.current.msRequestFullscreen();
          }
          if (!wasPlaying) {
            setTimeout(() => {
              if (videoRef.current && !videoRef.current.paused && !wasPlaying) {
                videoRef.current.pause();
              }
            }, 300);
          }
        } catch (error) {
          console.error('Fullscreen error:', error);
        }
      }, 100);
    }
  };

  // Update the getTweetId function to handle both URL formats
  const getTweetId = (url) => {
    if (!url) return null;

    // First check if it's already just the ID
    if (/^\d+$/.test(url)) return url;

    // Handle format from videos where we extract from filename
    if (url.includes('/')) {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      if (filename.includes('_')) {
        return filename.split('_')[0];
      }
    }

    // Handle standard Twitter URLs
    const matches = url.match(/twitter\.com\/\w+\/status\/(\d+)/);
    if (matches && matches[1]) {
      return matches[1];
    }

    // Handle i/status format
    const statusMatches = url.match(/i\/status\/(\d+)/);
    if (statusMatches && statusMatches[1]) {
      return statusMatches[1];
    }

    console.error("Could not extract tweet ID from:", url);
    return null;
  };

  const attemptAutoplay = (videoRef) => {
  if (videoRef.current) {
    const playPromise = videoRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn('Autoplay issue:', error);
        if (videoRef.current && !videoRef.current.muted) {
          videoRef.current.muted = true;
          videoRef.current.play().catch((e) => console.error('Still cannot autoplay:', e));
        }
      });
    }
  }
};

  useEffect(() => {
    if (videos.video1 && videos.video2) {
      setTimeout(() => {
        attemptAutoplay(video1Ref);
        attemptAutoplay(video2Ref);
      }, 100);
    }
  }, [videos]);

  if (!videos.video1 || !videos.video2) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: colors.bg,
        }}
      >
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
          `}
        </style>
        <div style={{ textAlign: 'center', padding: '60px 0', color: colors.textSecondary }}>
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
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  const tweetUrl1 = `https://twitter.com/i/status/${getTweetId(videos.video1.url)}`;
  const tweetUrl2 = `https://twitter.com/i/status/${getTweetId(videos.video2.url)}`;

  if (isMobile) {
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
              overflow-x: hidden;
              overflow-y: hidden;
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

            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }

            @keyframes fadeOut {
              from { opacity: 1; transform: translateY(0); }
              to { opacity: 0; transform: translateY(-20px); }
            }

            .fade-in {
              animation: fadeIn 0.5s ease forwards;
            }

            .fade-out {
              animation: fadeOut 0.5s ease forwards;
            }

            .pulse-green {
              animation: pulseGreen 0.6s ease forwards;
              border: 3px solid ${colors.success};
            }

            .pulse-red {
              animation: pulseRed 0.6s ease forwards;
              border: 3px solid ${colors.error};
            }

            @keyframes pulseGreen {
              0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
              70% { box-shadow: 0 0 0 15px rgba(76, 175, 80, 0); }
              100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
            }

            @keyframes pulseRed {
              0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7); }
              70% { box-shadow: 0 0 0 15px rgba(244, 67, 54, 0); }
              100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
            }

            .vs-animation {
              animation: pulse 1.5s infinite ease-in-out;
            }

            @keyframes pulse {
              0% { transform: translate(-50%, -50%) scale(1); }
              50% { transform: translate(-50%, -50%) scale(1.1); }
              100% { transform: translate(-50%, -50%) scale(1); }
            }
          `}
        </style>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: colors.bg,
          color: colors.text,
          position: 'relative',
        }}>
          {/* Header */}
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
                <Link to="/" className="nav-link" style={{ color: colors.accent }}>Home</Link>
                <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
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

          {/* Video battle area */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '0',
            width: '100%',
            overflowY: 'auto',
            overflow: 'hidden',
            marginTop: '10px',
          }}>
            {/* Video 1 */}
            <div
              style={{
                width: '97%',
                maxWidth: '97%',
                position: 'relative',
                opacity: isTransitioning ? '0.8' : '1',
                transition: 'opacity 0.5s ease',
                margin: '0 1px',
              }}
              className={isTransitioning ? (selectedVideo === 'video1' ? 'fade-in' : 'fade-out') : ''}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/13',
                  backgroundColor: '#000',
                  borderRadius: '16px 16px 0 0',
                  overflow: 'hidden',
                }}
                className={selectedVideo === 'video1' ? 'pulse-green' : (selectedVideo === 'video2' ? 'pulse-red' : '')}
                onClick={() => chooseVideo(videos.video1.id, videos.video2.id)}
              >
                <video
                  src={videos.video1.url}
                  autoPlay
                  playsInline
                  loop
                  muted
                  ref={video1Ref}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                  controls={false}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  display: 'flex',
                  gap: '10px',
                  zIndex: 1,
                }}>
                  <button style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    transition: 'transform 0.2s ease, background-color 0.2s ease',
                    color: '#ffffff',
                    fontSize: '16px',
                  }}
                    onClick={(e) => toggleMute(video1Ref, e)}
                  >
                    🔊
                  </button>
                  <button style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    transition: 'transform 0.2s ease, background-color 0.2s ease',
                    color: '#ffffff',
                    fontSize: '16px',
                  }}
                    onClick={(e) => enterFullscreen(video1Ref, e)}
                  >
                    ⛶
                  </button>
                  <button
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(10px)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                      transition: 'transform 0.2s ease, background-color 0.2s ease',
                      color: '#ffffff',
                      fontSize: '16px',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPopupTweetUrl(tweetUrl1);
                    }}
                  >
                    𝕏
                  </button>
                </div>
              </div>
            </div>

            {/* VS indicator */}
            <div style={{
              position: 'relative',
              margin: '0',
              color: '#fff',
              fontSize: '24px',
              fontWeight: 'bold',
              padding: '8px 16px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(5px)',
              borderRadius: '12px',
              className: 'vs-animation',
              zIndex: 20,
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              margin: '-20px 0',
            }}>
              VS
            </div>

            {/* Video 2 */}
            <div
              style={{
                width: '97%',
                maxWidth: '97%',
                position: 'relative',
                opacity: isTransitioning ? '0.8' : '1',
                transition: 'opacity 0.5s ease',
                margin: '0 1px',
              }}
              className={isTransitioning ? (selectedVideo === 'video2' ? 'fade-in' : 'fade-out') : ''}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/13',
                  backgroundColor: '#000',
                  borderRadius: '0 0 16px 16px',
                  overflow: 'hidden',
                }}
                className={selectedVideo === 'video2' ? 'pulse-green' : (selectedVideo === 'video1' ? 'pulse-red' : '')}
                onClick={() => chooseVideo(videos.video2.id, videos.video1.id)}
              >
                <video
                  src={videos.video2.url}
                  autoPlay
                  playsInline
                  loop
                  muted
                  ref={video2Ref}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                  controls={false}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  display: 'flex',
                  gap: '10px',
                  zIndex: 1,
                }}>
                  <button style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    transition: 'transform 0.2s ease, background-color 0.2s ease',
                    color: '#ffffff',
                    fontSize: '16px',
                  }}
                    onClick={(e) => toggleMute(video2Ref, e)}
                  >
                    🔊
                  </button>
                  <button style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    transition: 'transform 0.2s ease, background-color 0.2s ease',
                    color: '#ffffff',
                    fontSize: '16px',
                  }}
                    onClick={(e) => enterFullscreen(video2Ref, e)}
                  >
                    ⛶
                  </button>
                  <button
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(10px)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
transition: 'transform 0.2s ease, background-color 0.2s ease',
                      color: '#ffffff',
                      fontSize: '16px',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPopupTweetUrl(tweetUrl2);
                    }}
                  >
                    𝕏
                  </button>
                </div>
              </div>
            </div>
          </div>

{/* Footer */}
          <footer style={{
            backgroundColor: darkMode ? '#0a0a0a' : '#f2f2f2',
            padding: '10px 0 20px',
            borderTop: `1px solid ${colors.border}`,
            width: '100%',
            marginTop: 'auto',
          }}>
            <div style={{
              maxWidth: '100%',
              margin: '0 auto',
              padding: '0 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
                  <div style={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: '20px',
      marginTop: '0',
      paddingTop: '0',
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
                paddingBottom: '10px',
              }}>
                <span style={{ opacity: 0.7 }}>
                  © {new Date().getFullYear()} UFO Battler. All rights reserved.
                </span>
              </p>
            </div>
          </footer>
        </div>

        {/* Welcome popup */}
        {showWelcomePopup && (
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
          }}>
            <div style={{
              backgroundColor: darkMode ? '#1E1E1E' : '#ffffff',
              padding: '28px',
              borderRadius: '24px',
              textAlign: 'center',
              color: colors.text,
              maxWidth: '85%',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              border: `1px solid ${colors.border}`,
              animation: 'fadeIn 0.5s ease',
            }}>
              <h2 style={{
                margin: '0 0 16px 0',
                fontSize: '24px',
                fontWeight: 'bold',
                color: colors.text,
              }}>
                Welcome to <span style={{ color: colors.accent }}>UFO</span> Battler!
              </h2>
              <p style={{
                margin: '0 0 24px 0',
                fontSize: '16px',
                lineHeight: '1.6',
                color: colors.textSecondary,
              }}>
                Tap the better UFO video to vote. Use <span style={{ color: colors.accent, fontWeight: 600 }}>#ufobattle</span> on Twitter/X to have your video join the leaderboard.
              </p>
              <button style={{
                backgroundColor: colors.accent,
                color: '#fff',
                border: 'none',
                borderRadius: '24px',
                padding: '12px 28px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '20px',
                boxShadow: '0 4px 12px rgba(29, 161, 242, 0.3)',
                transition: 'all 0.2s ease',
              }}
                onClick={() => setShowWelcomePopup(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Start Fighting!
              </button>
              <div>
                <Link to="/leaderboard" style={{
                  color: colors.accent,
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'inline-block',
                }}
                  onClick={() => setShowWelcomePopup(false)}
                >
                  View Leaderboard
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tweet popup - IMPROVED VERSION */}
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
              maxWidth: '500px',  /* Fixed max width */
              height: '80vh',     /* Fixed height relative to viewport */
              maxHeight: '600px', /* Maximum fixed height */
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              border: `1px solid ${colors.border}`,
              animation: 'fadeIn 0.5s ease',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
            >
              {/* Close button - more prominent in top right */}
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

              {/* Added a label/header */}
              <div style={{
                borderBottom: `1px solid ${colors.border}`,
                padding: '8px 0 12px',
                marginBottom: '12px',
                fontSize: '16px',
                fontWeight: '500',
              }}>
                Original Tweet
              </div>

              {/* Container with scroll */}
              <div
                ref={popupRef}
                style={{
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  flex: 1,
                  padding: '0 4px',
                  /* Custom scrollbar styling */
                  scrollbarWidth: 'thin',
                  scrollbarColor: darkMode ? '#555 #1a1a1a' : '#c1c1c1 #f1f1f1',
                }}
              >
                {/* Loading indicator */}
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

              {/* Added a footer with attribution */}
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
      </>
    );
  } else {
    return (
      <>
        <style>
          {`
            html {
              overflow-y: scroll;
            }

            ::-webkit-scrollbar {
              width: 8px;
            }

            ::-webkit-scrollbar-thumb {
              background-color: ${darkMode ? '#555' : 'rgba(0, 0, 0, 0.3)'};
              border-radius: 10px;
            }

            ::-webkit-scrollbar-track {
              background: ${darkMode ? '#1a1a1a' : 'transparent'};
            }

            .nav-link {
              position: relative;
              text-decoration: none;
              color: ${colors.textSecondary};
              font-weight: 500;
              font-size: 16px;
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

            /* Add shared animations for both desktop and mobile */
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }

            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }

            @keyframes pulse {
              0% { transform: translate(-50%, -50%) scale(1); }
              50% { transform: translate(-50%, -50%) scale(1.1); }
              100% { transform: translate(-50%, -50%) scale(1); }
            }
          `}
        </style>
        <div
          style={{
            backgroundColor: colors.bg,
            minHeight: '100vh',
            color: colors.text,
            transition: 'background-color 0.3s ease',
          }}
        >
          <style>
            {`
              body {
                margin: 0;
                padding: 0;
                background-color: ${colors.bg};
                color: ${colors.text};
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              }
            `}
          </style>
          <header
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 100,
              backgroundColor: darkMode ? 'rgba(18, 18, 18, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              borderBottom: `1px solid ${colors.border}`,
              padding: '12px 0',
              transition: 'background-color 0.3s ease',
            }}
          >
            <div
              style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '0 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 700,
                  color: colors.text,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ color: colors.accent }}>UFO</span>
                <span>Battler</span>
              </h1>
              <nav style={{ display: 'flex', alignItems: 'center' }}>
                <Link to="/" className="nav-link" style={{ color: colors.accent }}>Home</Link>
                <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
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

          <main
            style={{
              maxWidth: '1600px',
              margin: '0 auto',
              padding: '40px 20px',
            }}
          >
            <h1
              style={{
                fontSize: '36px',
                fontWeight: '700',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              FIGHT<span style={{ color: colors.accent }}>!</span>
            </h1>
            <p style={{
              fontSize: '16px',
              color: colors.textSecondary,
              maxWidth: '600px',
              margin: '0 auto 20px',
              lineHeight: '1.6',
              textAlign: 'center',
            }}>
              Use <span style={{ color: colors.accent, fontWeight: '600' }}>#ufobattle</span> to have your
              video join the fight! New footage added daily.
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  backgroundColor: darkMode ? 'rgba(29, 161, 242, 0.1)' : 'rgba(29, 161, 242, 0.1)',
                  color: colors.accent,
                  fontSize: '14px',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                Each video is assigned a ranking. Pick the better video.
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: '20px',
                position: 'relative',
              }}
            >
              <div style={{ flex: 1, maxWidth: '754px' }}>
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    position: 'relative',
                    backgroundColor: '#000',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: `0 4px 12px ${colors.shadow}`,
                    transition: 'all 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
                    cursor: 'pointer',
                  }}
                  onClick={() => chooseVideo(videos.video1.id, videos.video2.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                    e.currentTarget.style.boxShadow = `0 10px 30px ${colors.shadow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${colors.shadow}`;
                  }}
                >
                  <video
                    src={videos.video1.url}
                    autoPlay
                    loop
                    muted
                    ref={video1Ref}
                    playsInline
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '0',
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                    onCanPlay={() => attemptAutoplay(video1Ref)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '12px',
                      display: 'flex',
                      gap: '10px',
                      zIndex: 1,
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
                        color: '#ffffff',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMute(video1Ref, e);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.backgroundColor = 'rgba(50, 50, 50, 1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                      }}
                    >
                      🔊
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
                        color: '#ffffff',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        enterFullscreen(video1Ref, e);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.backgroundColor = 'rgba(50, 50, 50, 1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                      }}
                    >
                      ⛶
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
                        color: '#ffffff',
                        textDecoration: 'none',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPopupTweetUrl(tweetUrl1);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.backgroundColor = 'rgba(50, 50, 50, 1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                      }}
                    >
                      𝕏
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
                  {video1ScoreChange && (
                    <p
                      style={{
                        fontSize: '12px',
                        color: video1ScoreChange.color === 'green' ? '#90ee90' : '#ff6347',
                        margin: 0,
                        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                        padding: '4px 10px',
                        borderRadius: '12px',
                      }}
                    >
                      {video1ScoreChange.text}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, maxWidth: '754px' }}>
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    position: 'relative',
                    backgroundColor: '#000',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: `0 4px 12px ${colors.shadow}`,
                    transition: 'all 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
                    cursor: 'pointer',
                  }}
                  onClick={() => chooseVideo(videos.video2.id, videos.video1.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                    e.currentTarget.style.boxShadow = `0 10px 30px ${colors.shadow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${colors.shadow}`;
                  }}
                >
                  <video
                    src={videos.video2.url}
                    autoPlay
                    loop
                    muted
                    ref={video2Ref}
                    playsInline
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                    onCanPlay={() => attemptAutoplay(video2Ref)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '12px',
                      display: 'flex',
                      gap: '10px',
                      zIndex: 1,
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
                        color: '#ffffff',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMute(video2Ref, e);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.backgroundColor = 'rgba(50, 50, 50, 1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                      }}
                    >
                      🔊
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
                        color: '#ffffff',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        enterFullscreen(video2Ref, e);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.backgroundColor = 'rgba(50, 50, 50, 1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                      }}
                    >
                      ⛶
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
                        color: '#ffffff',
                        textDecoration: 'none',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPopupTweetUrl(tweetUrl2);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.backgroundColor = 'rgba(50, 50, 50, 1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                      }}
                    >
                      𝕏
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
                  {video2ScoreChange && (
                    <p
                      style={{
                        fontSize: '12px',
                        color: video2ScoreChange.color === 'green' ? '#90ee90' : '#ff6347',
                        margin: 0,
                        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                        padding: '4px 10px',
                        borderRadius: '12px',
                      }}
                    >
                      {video2ScoreChange.text}
                    </p>
                  )}
                </div>
              </div>

              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: colors.text,
                  fontSize: '28px',
                  fontWeight: 'bold',
                  padding: '10px 20px',
                  backgroundColor: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(5px)',
                  borderRadius: '16px',
                  zIndex: 20,
                  pointerEvents: 'none',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              >
                VS
              </div>
            </div>
          </main>
          <footer
            style={{
              backgroundColor: darkMode ? '#0a0a0a' : '#f2f2f2',
              padding: '20px 0',
              borderTop: `1px solid ${colors.border}`,
              position: 'relative',
              bottom: 0,
              width: '100%',
              paddingBottom: '105px',
            }}
          >
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
        </div>

        {/* Tweet popup for desktop - Add this new section */}
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
              maxWidth: '550px',  /* Slightly larger for desktop */
              height: '80vh',
              maxHeight: '700px', /* Slightly larger for desktop */
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              border: `1px solid ${colors.border}`,
              animation: 'fadeIn 0.5s ease',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
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

              {/* Header */}
              <div style={{
                borderBottom: `1px solid ${colors.border}`,
                padding: '8px 0 12px',
                marginBottom: '12px',
                fontSize: '18px',
                fontWeight: '500',
              }}>
                Original Tweet
              </div>

              {/* Container with scroll */}
              <div
                ref={popupRef}
                style={{
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  flex: 1,
                  padding: '0 4px',
                  /* Custom scrollbar styling */
                  scrollbarWidth: 'thin',
                  scrollbarColor: darkMode ? '#555 #1a1a1a' : '#c1c1c1 #f1f1f1',
                }}
              >
                {/* Loading indicator */}
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

              {/* Footer with attribution */}
              <div style={{
                borderTop: `1px solid ${colors.border}`,
                paddingTop: '12px',
                marginTop: '12px',
                fontSize: '14px',
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
      </>
    );
  }
}

export default Home;
