import React, { useState, useEffect } from 'react';

export const GeoPicker = ({ officeLat, officeLng, allowedRadius, onLocationChange }) => {
  const [coords, setCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simulated, setSimulated] = useState('office'); // 'office', 'far', 'real'

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371000; // meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  const getRealPosition = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation not supported by this browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const d = calculateDistance(officeLat, officeLng, latitude, longitude);
        setCoords({ latitude, longitude });
        setDistance(d);
        onLocationChange({ latitude, longitude, distance: d });
        setLoading(false);
      },
      (err) => {
        console.warn('Geolocation error. Activating mock location simulator.', err);
        setError('Location access denied. Simulator mode enabled.');
        setLoading(false);
        // Fallback to simulated office
        simulateLocation('office');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const simulateLocation = (type) => {
    setSimulated(type);
    let lat, lng;
    if (type === 'office') {
      // Very close to office (15 meters)
      lat = officeLat + 0.0001;
      lng = officeLng + 0.0001;
    } else {
      // Far away (approx 650 meters)
      lat = officeLat + 0.005;
      lng = officeLng + 0.005;
    }
    const d = calculateDistance(officeLat, officeLng, lat, lng);
    setCoords({ latitude: lat, longitude: lng });
    setDistance(d);
    onLocationChange({ latitude: lat, longitude: lng, distance: d });
  };

  useEffect(() => {
    if (simulated === 'real') {
      getRealPosition();
    } else {
      simulateLocation(simulated);
    }
  }, [simulated, officeLat, officeLng]);

  return (
    <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', width: '100%' }}>
      <div className="flex-between mb-2">
        <span className="form-label">Check-in Location Verification</span>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button 
            type="button"
            className={`btn btn-outline`}
            style={{ 
              padding: '0.25rem 0.5rem', 
              fontSize: '0.75rem', 
              background: simulated === 'office' ? 'var(--primary)' : 'transparent',
              borderColor: simulated === 'office' ? 'var(--primary)' : 'var(--border-card)'
            }}
            onClick={() => simulateLocation('office')}
          >
            In-Office (Mock)
          </button>
          <button 
            type="button"
            className={`btn btn-outline`}
            style={{ 
              padding: '0.25rem 0.5rem', 
              fontSize: '0.75rem', 
              background: simulated === 'far' ? 'var(--danger)' : 'transparent',
              borderColor: simulated === 'far' ? 'var(--danger)' : 'var(--border-card)'
            }}
            onClick={() => simulateLocation('far')}
          >
            Out-of-Office (Mock)
          </button>
          <button 
            type="button"
            className={`btn btn-outline`}
            style={{ 
              padding: '0.25rem 0.5rem', 
              fontSize: '0.75rem', 
              background: simulated === 'real' ? 'var(--secondary)' : 'transparent',
              borderColor: simulated === 'real' ? 'var(--secondary)' : 'var(--border-card)'
            }}
            onClick={() => setSimulated('real')}
          >
            GPS (Real)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-between">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Awaiting GPS fix...</p>
          <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
        </div>
      ) : coords ? (
        <div>
          <div className="flex-between mb-1" style={{ fontSize: '0.85rem' }}>
            <span>Coordinates:</span>
            <span style={{ fontFamily: 'monospace' }}>{coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</span>
          </div>
          <div className="flex-between" style={{ fontSize: '0.85rem' }}>
            <span>Distance to Office:</span>
            <span style={{ fontWeight: '600', color: distance <= allowedRadius ? '#34d399' : '#f87171' }}>
              {distance}m {distance <= allowedRadius ? '(Allowed)' : '(Out of Bounds)'}
            </span>
          </div>
        </div>
      ) : error ? (
        <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>
      ) : null}
    </div>
  );
};
