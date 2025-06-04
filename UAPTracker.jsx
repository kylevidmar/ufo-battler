import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, LayerGroup, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const UAPTracker = () => {
  // State for UAP sightings data
  const [uapSightingsData, setUapSightingsData] = useState(null);
  // State for flight pings data
  const [flightPingsData, setFlightPingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uapLayerRef, setUapLayerRef] = useState(null);
  const [selectedUAP, setSelectedUAP] = useState(null);
  const [mapCenter, setMapCenter] = useState([30, -30]); // Mid-Atlantic
  const [zoomLevel, setZoomLevel] = useState(3);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [recentSightings, setRecentSightings] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef(null);

  // Color system from Home component
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

  // Initialize dark mode and mobile detection
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Function to parse structured data from description text
  const parseDescriptionData = (description) => {
    if (!description) return {};

    const parsed = {};

    // Find anything that looks like a time (12:34, 12:34pm, 12:34 AM, etc.)
    const timeMatch = description.match(/\b(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)\b/);
    if (timeMatch) {
      parsed.time = timeMatch[1];
    }

    // Find anything that looks like a date (various formats)
    const dateMatch = description.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+\w+\s+\d{2,4}|\w+\s+\d{1,2},?\s+\d{2,4})\b/);
    if (dateMatch) {
      parsed.date = dateMatch[1];
    }

    // Find "Location: X" specifically
    const locationMatch = description.match(/Location:\s*([^\n\r.]*)/i);
    if (locationMatch) {
      parsed.location = locationMatch[1].trim();
    }

    return parsed;
  };

  // Helper function to extract Reddit post ID from URL
  const extractRedditPostId = (url) => {
    if (!url || typeof url !== 'string') return null;

    // Check if it's a Reddit URL
    if (!url.includes('reddit.com') && !url.includes('redd.it')) return null;

    // Try to extract the post ID from various Reddit URL formats
    const patterns = [
      /reddit\.com\/r\/[^\/]+\/comments\/([a-z0-9]+)\//i,  // Standard format
      /redd\.it\/([a-z0-9]+)/i                            // Short URL format
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  };

  // Function to format relative time (e.g., "2 days ago")
  const getRelativeTime = (dateString) => {
    if (!dateString) return '';

    let date;
    try {
      // Try to parse the date string
      date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
    } catch (e) {
      return '';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffDays > 30) {
      return `${Math.floor(diffDays / 30)} months ago`;
    } else if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffHr > 0) {
      return `${diffHr} ${diffHr === 1 ? 'hr' : 'hrs'} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} ${diffMin === 1 ? 'min' : 'mins'} ago`;
    } else {
      return 'Just now';
    }
  };

  // Function to truncate text with ellipsis
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '…' : text;
  };

  // Function to extract coordinates as a readable string
  const formatCoordinates = (feature) => {
    if (!feature.geometry || !feature.geometry.coordinates) return '';
    const [lng, lat] = feature.geometry.coordinates;
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  };

  // Style function for UAP sightings
  const uapPointStyle = (feature) => {
    return {
      radius: 8,
      fillColor: colors.accent,
      color: darkMode ? "#ffffff" : "#000000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    };
  };

  // Style function for flight pings
  const flightPingStyle = (feature) => {
    return {
      radius: 4,
      fillColor: colors.success,
      color: darkMode ? "#ffffff" : "#000000",
      weight: 1,
      opacity: 0.8,
      fillOpacity: 0.6
    };
  };

  // Function to handle clicking on a UAP sighting
  const handleUAPClick = (feature, layer) => {
    layer.on({
      click: () => {
        console.log("UAP sighting clicked:", feature.properties);

        // Get the source URL
        const sourceUrl = feature.properties.Source || feature.properties.source || null;

        // Extract Reddit post ID if it's a Reddit URL
        const redditPostId = extractRedditPostId(sourceUrl);

        // Extract properties based on the actual structure from your GeoJSON file
        const rawDescription = feature.properties.Summary || feature.properties.Description || feature.properties.description || 'No description available';
        const parsedData = parseDescriptionData(rawDescription);

        const uapProperties = {
          title: feature.properties.Name || feature.properties.name || 'UAP Sighting',
          date: parsedData.date || feature.properties.Date || feature.properties.date || 'Unknown',
          time: parsedData.time || 'Unknown',
          location: parsedData.location || feature.properties.City || feature.properties.Location || feature.properties.location || 'Unknown',
          description: rawDescription,
          witnesses: feature.properties.Witnesses || feature.properties.witnesses || 'Unknown',
          mediaUrl: feature.properties.MediaURL || feature.properties.mediaUrl || null,
          source: sourceUrl,
          link: feature.properties.Link || feature.properties.link || null,
          isReddit: !!redditPostId,
          redditPostId: redditPostId
        };

        setSelectedUAP(uapProperties);

        if (feature.geometry && feature.geometry.coordinates) {
          // GeoJSON uses [longitude, latitude] format while Leaflet uses [latitude, longitude]
          setMapCenter([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);
          setZoomLevel(10);
        }
      }
    });
  };

  // Function to handle clicking on a recent sighting from the sidebar
  const handleRecentSightingClick = (sighting) => {
  const feature = sighting.feature;
  const sourceUrl = feature.properties.Source || feature.properties.source;
  const redditPostId = extractRedditPostId(sourceUrl);
  const rawDescription = feature.properties.Summary || feature.properties.Description || feature.properties.description || '';
  const parsedData = parseDescriptionData(rawDescription);

  setSelectedUAP({
    title: sighting.title,
    date: parsedData.date || sighting.date || 'Unknown',
    time: parsedData.time || sighting.time || 'Unknown',
    location: parsedData.location || sighting.location || 'Unknown',
    description: rawDescription,
    source: sourceUrl,
    redditPostId: redditPostId,
    isReddit: !!redditPostId,
    mediaUrl: feature.properties.MediaURL || feature.properties.mediaUrl,
    link: feature.properties.Link || feature.properties.link,
    witnesses: feature.properties.Witnesses || feature.properties.witnesses || 'Unknown'
  });

  if (feature.geometry && feature.geometry.coordinates) {
    const latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
    setMapCenter(latlng);
    setZoomLevel(10);

    // Show popup for clicked feature
    if (uapLayerRef) {
      const layers = uapLayerRef.getLayers();
      const matchedLayer = layers.find((layer) => {
        const [lng, lat] = layer.feature.geometry.coordinates;
        const [featLng, featLat] = feature.geometry.coordinates;
        return lng === featLng && lat === featLat;
      });

      if (matchedLayer && matchedLayer.openPopup) {
        matchedLayer.openPopup();
      }
    }
  }

  if (window.innerWidth < 768) {
    setMenuOpen(false);
  }
};

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target) &&
          !event.target.classList.contains('hamburger-button')) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // Load GeoJSON data
  useEffect(() => {
    // Function to load both GeoJSON files
    const loadGeoJSONData = async () => {
      try {
        // DIRECTLY REFERENCE the exact file names you specified
        const uapResponse = await fetch('/uap_sightings.geojson');
        const flightResponse = await fetch('/batch_flight_pings.geojson');

        if (!uapResponse.ok) {
          throw new Error('Failed to load UAP sightings data');
        }

        if (!flightResponse.ok) {
          throw new Error('Failed to load flight pings data');
        }

        const uapData = await uapResponse.json();
        const flightData = await flightResponse.json();

        console.log('UAP Sightings data loaded:', uapData.features.length, 'features');
        console.log('Flight Pings data loaded:', flightData.features.length, 'features');

        setUapSightingsData(uapData);
        setFlightPingsData(flightData);

        // Process recent sightings for the sidebar
        if (uapData && uapData.features && uapData.features.length > 0) {
          // Sort features by date if available
          const sortedFeatures = [...uapData.features].sort((a, b) => {
            const dateA = a.properties.Date || a.properties.date || '';
            const dateB = b.properties.Date || b.properties.date || '';

            // If dates are available, sort by them (most recent first)
            if (dateA && dateB) {
              return new Date(dateB) - new Date(dateA);
            }
            return 0;
          });

          // Take the first 10 for recent sightings
const recent = uapData.features
  .map(feature => {
    const eventDate = feature.properties.event_date;
    let isoDate = '';
    let displayTime = '';
    if (eventDate) {
      const parsed = new Date(eventDate);
      if (!isNaN(parsed)) {
        isoDate = parsed.toISOString();
        displayTime = parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }

    return {
      id: feature.id || Math.random().toString(36).substr(2, 9),
      title: feature.properties.Name || feature.properties.name || 'UAP Sighting',
      date: isoDate,
      time: displayTime,
      location: feature.properties.City || feature.properties.Location || feature.properties.location || '',
      description: feature.properties.Summary || feature.properties.Description || feature.properties.description || '',
      coordinates: formatCoordinates(feature),
      feature: feature
    };
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by newest
  .slice(0, 10); // Limit to 10

          setRecentSightings(recent);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading GeoJSON files:', error);
        setError(`Failed to load data: ${error.message}`);
        setLoading(false);
      }
    };

    loadGeoJSONData();
  }, []);

  if (loading) {
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
          <p>Loading UAP tracking data...</p>
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

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .leaflet-control-layers {
            background: ${colors.card} !important;
            color: ${colors.text} !important;
            border: 1px solid ${colors.border} !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px ${colors.shadow} !important;
          }

          .leaflet-control-layers-toggle {
            background-image: none !important;
            width: 36px !important;
            height: 36px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            color: ${colors.text} !important;
            font-size: 18px !important;
          }

          .leaflet-control-layers-toggle::before {
            content: '⚙️';
          }

          .leaflet-control-layers label {
            color: ${colors.text} !important;
            font-weight: 500 !important;
          }

          .leaflet-control-layers input {
            margin-right: 8px !important;
          }

          .leaflet-popup-content-wrapper {
            background: ${colors.card} !important;
            color: ${colors.text} !important;
            border-radius: 12px !important;
            box-shadow: 0 4px 12px ${colors.shadow} !important;
          }

          .leaflet-popup-tip {
            background: ${colors.card} !important;
          }

          .leaflet-container {
            background: ${darkMode ? '#1a1a1a' : '#f0f0f0'} !important;
          }

          .leaflet-control-zoom {
            position: absolute !important;
            bottom: 15px !important;
            right: 15px !important;
            top: auto !important; /* Override default top positioning */
            left: auto !important; /* Override default left positioning */
            z-index: 1500 !important; /* Higher than menu (1400) */
            background: ${darkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)'} !important;
            backdrop-filter: blur(10px) !important;
            border: 1px solid ${colors.border} !important;
            border-radius: 8px !important;
            box-shadow: 0 2px 8px ${colors.shadow} !important;
            padding: 5px !important;
          }

          .leaflet-control-zoom a {
            background-color: ${colors.card} !important;
            color: ${colors.text} !important;
            width: 34px !important;
            height: 34px !important;
            line-height: 34px !important;
            border-radius: 6px !important;
            transition: all 0.2s ease !important;
          }

          .leaflet-control-zoom a:hover {
            background-color: ${colors.accent} !important;
            color: white !important;
            transform: scale(1.05) !important;
          }
        `}
      </style>

      <div style={{
        backgroundColor: colors.bg,
        minHeight: '100vh',
        color: colors.text,
        transition: 'background-color 0.3s ease',
        position: 'relative'
      }}>
        {/* Header */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 1600,
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
            <h1 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: 700,
              color: colors.text,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ color: colors.accent }}>UAP</span>
              <span>Tracker</span>
            </h1>
            <nav style={{ display: 'flex', alignItems: 'center' }}>
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
                  color: colors.text,
                  fontSize: '18px',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.border;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </nav>
          </div>
        </header>

        {error && (
          <div style={{
            color: colors.error,
            padding: '15px 20px',
            background: darkMode ? 'rgba(244, 67, 54, 0.1)' : '#fff8f8',
            borderRadius: '8px',
            margin: '20px',
            border: `1px solid ${colors.error}`,
            animation: 'fadeIn 0.5s ease'
          }}>
            {error}
          </div>
        )}

        {/* Main content area */}
        <main style={{ position: 'relative', height: 'calc(100vh - 80px)' }}>
          {/* Hamburger Menu Button */}
          <button
            className="hamburger-button"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              position: 'absolute',
              top: '15px',
              left: '15px',
              zIndex: 1500,
              background: darkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              padding: '10px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: '44px',
              height: '44px',
              boxShadow: `0 4px 12px ${colors.shadow}`,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span style={{
              height: '2px',
              background: colors.text,
              width: '100%',
              borderRadius: '1px',
              transition: 'all 0.3s ease',
              transform: menuOpen ? 'rotate(45deg) translate(6px, 6px)' : 'rotate(0)'
            }}></span>
            <span style={{
              height: '2px',
              background: colors.text,
              width: '100%',
              borderRadius: '1px',
              transition: 'all 0.3s ease',
              opacity: menuOpen ? 0 : 1
            }}></span>
            <span style={{
              height: '2px',
              background: colors.text,
              width: '100%',
              borderRadius: '1px',
              transition: 'all 0.3s ease',
              transform: menuOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'rotate(0)'
            }}></span>
          </button>

          {/* Sidebar Menu */}
          <div
            ref={menuRef}
            style={{
              position: 'absolute',
              top: 0,
              left: menuOpen ? 0 : '-350px',
              width: '350px',
              height: '100%',
              background: darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(15px)',
              color: colors.text,
              zIndex: 1400,
              padding: '70px 20px 20px',
              boxSizing: 'border-box',
              overflowY: 'auto',
              transition: 'left 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
              borderRight: `1px solid ${colors.border}`,
              boxShadow: menuOpen ? `0 0 30px ${colors.shadow}` : 'none',
            }}
          >
            <h2 style={{
              borderBottom: `2px solid ${colors.accent}`,
              paddingBottom: '12px',
              marginTop: 0,
              marginBottom: '20px',
              fontSize: '20px',
              fontWeight: '600',
              color: colors.text
            }}>
              Recent Sightings
            </h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {recentSightings.map((sighting, index) => (
                <div
                  key={sighting.id}
                  style={{
                    cursor: 'pointer',
                    padding: '12px',
                    borderRadius: '12px',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'transparent',
                    border: `1px solid ${colors.border}`,
                    animation: `fadeIn 0.5s ease ${index * 0.1}s backwards`
                  }}
                  onClick={() => handleRecentSightingClick(sighting)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.border;
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                    gap: '8px'
                  }}>
                    <span style={{
                      color: colors.accent,
                      fontWeight: '600',
                      fontSize: '12px',
                      flexShrink: 0
                    }}>
                      {getRelativeTime(sighting.date)}
                    </span>
                    <span style={{
                      color: colors.textSecondary,
                      fontSize: '11px',
                      textAlign: 'right',
                      lineHeight: '1.2'
                    }}>
                      {sighting.coordinates}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: colors.text,
                    lineHeight: '1.4'
                  }}>
                    {truncateText(sighting.title || sighting.description, 45)}
                  </div>
                  {sighting.location && (
                    <div style={{
                      fontSize: '12px',
                      color: colors.textSecondary,
                      marginTop: '4px'
                    }}>
                      📍 {sighting.location}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Map Container */}
          <div style={{
            height: '100%',
            width: '100%',
            position: 'relative',
            borderRadius: menuOpen ? '0 12px 12px 0' : '0',
            overflow: 'hidden',
            transition: 'border-radius 0.3s ease'
          }}>
            <MapContainer
              center={mapCenter}
              zoom={zoomLevel}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true} // Keep zoom control enabled
            >
              <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url={darkMode
                  ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                }
              />

              <LayersControl position="topright">
                {/* UAP Sightings Layer */}
                <LayersControl.Overlay checked={true} name="UAP Sightings">
                  <LayerGroup>
                    {uapSightingsData && (
                      <GeoJSON
  data={uapSightingsData}
  onEachFeature={handleUAPClick}
  pointToLayer={(feature, latlng) => {
    return new L.CircleMarker(latlng, uapPointStyle(feature));
  }}
  ref={(ref) => {
    if (ref) setUapLayerRef(ref);
  }}
/>
                    )}
                  </LayerGroup>
                </LayersControl.Overlay>

                {/* Flight Pings Layer */}
                <LayersControl.Overlay checked={false} name="Flight Data">
                  <LayerGroup>
                    {flightPingsData && (
                      <GeoJSON
                        data={flightPingsData}
                        pointToLayer={(feature, latlng) => {
                          return new L.CircleMarker(latlng, flightPingStyle(feature));
                        }}
                      />
                    )}
                  </LayerGroup>
                </LayersControl.Overlay>
              </LayersControl>
            </MapContainer>

            {/* Map Stats */}
            <div style={{
              position: 'absolute',
              bottom: '15px',
              left: '15px',
              background: darkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              padding: '8px 12px',
              borderRadius: '8px',
              zIndex: 1300,
              color: colors.text,
              fontSize: '12px',
              fontWeight: '500',
              border: `1px solid ${colors.border}`,
              boxShadow: `0 2px 8px ${colors.shadow}`
            }}>
              {uapSightingsData && uapSightingsData.features &&
                `🛸 ${uapSightingsData.features.length} UAP Sightings`}
              {flightPingsData && flightPingsData.features &&
                ` • ✈️ ${flightPingsData.features.length} Flight Pings`}
            </div>
          </div>
        </main>

        {/* UAP Details Panel */}
        {selectedUAP && (
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
            zIndex: 2000,
            animation: 'fadeIn 0.3s ease'
          }}
          onClick={() => setSelectedUAP(null)}
          >
            <div style={{
              backgroundColor: colors.card,
              padding: '24px',
              borderRadius: '16px',
              textAlign: 'left',
              color: colors.text,
              width: '90%',
              maxWidth: isMobile ? '95%' : '600px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: `0 10px 30px ${colors.shadow}`,
              border: `1px solid ${colors.border}`,
              position: 'relative',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  backgroundColor: darkMode ? 'rgba(60, 60, 60, 0.8)' : 'rgba(240, 240, 240, 0.8)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.text,
                  fontSize: '20px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  zIndex: 2,
                  boxShadow: `0 2px 8px ${colors.shadow}`,
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setSelectedUAP(null)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.backgroundColor = colors.error;
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = darkMode ? 'rgba(60, 60, 60, 0.8)' : 'rgba(240, 240, 240, 0.8)';
                  e.currentTarget.style.color = colors.text;
                }}
              >
                ×
              </button>

              {/* Header */}
              <div style={{
                borderBottom: `2px solid ${colors.accent}`,
                paddingBottom: '16px',
                marginBottom: '20px',
                paddingRight: '50px'
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: '700',
                  color: colors.text,
                  lineHeight: '1.3'
                }}>
                  {selectedUAP.title}
                </h2>
                {selectedUAP.date && selectedUAP.date !== 'Unknown' && (
                  <div style={{
                    fontSize: '14px',
                    color: colors.accent,
                    fontWeight: '600',
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>🕐</span>
                    {getRelativeTime(selectedUAP.date)}
                    {selectedUAP.time && selectedUAP.time !== 'Unknown' && (
                      <span style={{ color: colors.textSecondary }}>
                        • {selectedUAP.time}
                      </span>
                    )}
                    <span style={{ color: colors.textSecondary }}>
                      ({selectedUAP.date})
                    </span>
                  </div>
                )}
                {selectedUAP.date === 'Unknown' && selectedUAP.time !== 'Unknown' && (
                  <div style={{
                    fontSize: '14px',
                    color: colors.accent,
                    fontWeight: '600',
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>🕐</span>
                    {selectedUAP.time}
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{
                  display: 'grid',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`
                  }}>
                    <strong style={{ color: colors.accent }}>📝 Description:</strong>
                    <div style={{
                      marginTop: '8px',
                      color: colors.text,
                      lineHeight: '1.5'
                    }}>
                      {selectedUAP.description}
                    </div>
                  </div>

                  {selectedUAP.witnesses && selectedUAP.witnesses !== 'Unknown' && (
                    <div style={{
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                      padding: '12px',
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`
                    }}>
                      <strong style={{ color: colors.accent }}>👥 Witnesses:</strong>
                      <div style={{ marginTop: '4px', color: colors.text }}>
                        {selectedUAP.witnesses}
                      </div>
                    </div>
                  )}
                </div>

                {/* Media content */}
                {selectedUAP.isReddit && selectedUAP.redditPostId ? (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{
                      color: colors.text,
                      fontSize: '18px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ color: '#ff4500' }}>🔗</span>
                      Reddit Post
                    </h3>
                    <div style={{
                      border: `2px solid ${colors.border}`,
                      borderRadius: '12px',
                      padding: '16px',
                      backgroundColor: darkMode ? 'rgba(255, 69, 0, 0.1)' : 'rgba(255, 69, 0, 0.05)',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '12px'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#ff4500',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px'
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="24" height="24" fill="#fff">
                            <path d="M10 1C4.477 1 0 5.477 0 11s4.477 10 10 10 10-4.477 10-10S15.523 1 10 1zm5.92 6.6c.44 0 .8.37.8.83 0 .66-.5 1.2-1.13 1.28-.07 1.25-.73 2.28-1.77 2.9 0 2.04-2.3 3.7-5.12 3.7-2.8 0-5.1-1.66-5.1-3.7-1.05-.62-1.7-1.65-1.78-2.9-.64-.08-1.12-.62-1.12-1.28 0-.46.35-.83.8-.83.3 0 .56.17.7.4.86-.86 2.44-1.44 4.3-1.5l.88-2.8c.07-.23.3-.37.55-.33l1.97.4c.18-.33.53-.56.93-.56.6 0 1.08.5 1.08 1.1 0 .62-.5 1.1-1.08 1.1-.58 0-1.05-.45-1.08-1.03l-1.78-.36-.78 2.5c1.84.07 3.4.65 4.24 1.5.15-.23.4-.4.7-.4z"/>
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', color: colors.text }}>r/UFOs</div>
                          <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                            Original Reddit Post
                          </div>
                        </div>
                      </div>

                      <div style={{
                        fontWeight: '600',
                        fontSize: '16px',
                        marginBottom: '12px',
                        color: colors.text,
                        lineHeight: '1.4'
                      }}>
                        {selectedUAP.title}
                      </div>

                      <div style={{
                        marginBottom: '16px',
                        color: colors.textSecondary,
                        lineHeight: '1.5'
                      }}>
                        {selectedUAP.description && selectedUAP.description.length > 150
                          ? `${selectedUAP.description.substring(0, 150)}...`
                          : selectedUAP.description}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <a
                          href={selectedUAP.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            backgroundColor: '#ff4500',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.2s ease',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 69, 0, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          View on Reddit →
                        </a>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          color: colors.textSecondary,
                          fontSize: '14px',
                          gap: '4px'
                        }}>
                          <span>💬</span>
                          See comments
                        </div>
                      </div>
                    </div>

                    <p style={{
                      fontSize: '12px',
                      color: colors.textSecondary,
                      fontStyle: 'italic',
                      textAlign: 'center',
                      margin: '8px 0'
                    }}>
                      Due to Reddit's content security policy, we can't embed the actual post.
                      Click "View on Reddit" to see the full post with videos and images.
                    </p>
                  </div>
                ) : (
                  selectedUAP.mediaUrl && (
                    <div style={{ marginBottom: '20px' }}>
                      <h3 style={{
                        color: colors.text,
                        fontSize: '18px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>🎬</span>
                        Media
                      </h3>
                      <div style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: `2px solid ${colors.border}`,
                        backgroundColor: '#000'
                      }}>
                        {selectedUAP.mediaUrl.toLowerCase().endsWith('.mp4') ||
                         selectedUAP.mediaUrl.toLowerCase().includes('youtube.com') ||
                         selectedUAP.mediaUrl.toLowerCase().includes('youtu.be') ? (
                          <video
                            controls
                            style={{
                              width: '100%',
                              height: 'auto',
                              display: 'block'
                            }}
                          >
                            <source src={selectedUAP.mediaUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <img
                            src={selectedUAP.mediaUrl}
                            alt="UAP sighting"
                            style={{
                              width: '100%',
                              height: 'auto',
                              display: 'block'
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )
                )}

                {/* Source section for non-Reddit posts */}
                {selectedUAP.source && !selectedUAP.isReddit && (
                  <div style={{
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    marginBottom: '16px'
                  }}>
                    <strong style={{ color: colors.accent }}>🔗 Source:</strong>
                    <div style={{ marginTop: '8px' }}>
                      <a
                        href={selectedUAP.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: colors.accent,
                          wordBreak: 'break-all',
                          textDecoration: 'none',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        {selectedUAP.source}
                      </a>
                    </div>
                  </div>
                )}

                {/* Additional link if different from source */}
                {selectedUAP.link && selectedUAP.link !== selectedUAP.source && (
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <a
                      href={selectedUAP.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        backgroundColor: colors.accent,
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 4px 12px ${colors.accent}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      More Details →
                    </a>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                borderTop: `1px solid ${colors.border}`,
                paddingTop: '16px',
                textAlign: 'center'
              }}>
                <button
                  onClick={() => setSelectedUAP(null)}
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent}, ${colors.success})`,
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxShadow: `0 4px 12px ${colors.shadow}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 20px ${colors.shadow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${colors.shadow}`;
                  }}
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UAPTracker;
