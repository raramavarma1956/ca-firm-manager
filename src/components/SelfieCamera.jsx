import React, { useRef, useState, useEffect } from 'react';

export const SelfieCamera = ({ onCapture, onClear }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraMode, setCameraMode] = useState('auto'); // 'stream', 'native', 'avatar'

  const isIOS = typeof navigator !== 'undefined' && 
    (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  const hasMediaDevices = typeof navigator !== 'undefined' && 
    !!navigator.mediaDevices && 
    typeof navigator.mediaDevices.getUserMedia === 'function';

  const startStreamCamera = async () => {
    setError(null);
    setLoading(true);

    if (!hasMediaDevices) {
      console.warn('getUserMedia not supported in this browser context (insecure HTTP or older browser).');
      setError('Live video streaming requires HTTPS or supported browser.');
      setCameraMode('native');
      setLoading(false);
      return;
    }

    try {
      const constraints = {
        video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: 'user' },
        audio: false
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraMode('stream');
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.warn('Video autoPlay prevented:', e));
      }
    } catch (err) {
      console.warn('Live webcam stream not accessible.', err);
      setError('Live camera stream unavailable on this network. Use the iPhone Camera button below.');
      setCameraMode('native');
    } finally {
      setLoading(false);
    }
  };

  // Start live stream if available and not on insecure iOS origin, otherwise default to native capture
  useEffect(() => {
    if (hasMediaDevices && (!isIOS || window.isSecureContext)) {
      startStreamCamera();
    } else {
      // Insecure HTTP or iOS Safari without WebRTC: default to native file capture mode
      setCameraMode('native');
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle native camera capture (works 100% on iOS iPhone over HTTP/HTTPS)
  const handleNativeCapture = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');

        // Center-crop image into 320x240
        const srcAspect = img.width / img.height;
        const targetAspect = 320 / 240;
        let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

        if (srcAspect > targetAspect) {
          sWidth = img.height * targetAspect;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width / targetAspect;
          sy = (img.height - sHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 320, 240);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setPhoto(dataUrl);
        onCapture(dataUrl);
        setLoading(false);

        // Stop any running stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      };
      img.onerror = () => {
        setError('Could not process photo. Please try again.');
        setLoading(false);
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      setError('Could not read image file.');
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const captureFromStream = () => {
    if (stream && videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = 320;
      canvasRef.current.height = 240;
      context.drawImage(videoRef.current, 0, 0, 320, 240);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.88);
      setPhoto(dataUrl);
      onCapture(dataUrl);
      
      // Stop webcam stream
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    } else {
      generateFallbackAvatar();
    }
  };

  const generateFallbackAvatar = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      canvas.width = 320;
      canvas.height = 240;
      
      // Gradient background
      const grad = context.createLinearGradient(0, 0, 320, 240);
      grad.addColorStop(0, '#1e3a8a');
      grad.addColorStop(1, '#059669');
      context.fillStyle = grad;
      context.fillRect(0, 0, 320, 240);
      
      // Draw avatar circle
      context.fillStyle = 'rgba(255, 255, 255, 0.9)';
      context.beginPath();
      context.arc(160, 95, 45, 0, Math.PI * 2);
      context.fill();
      
      // Shoulder
      context.beginPath();
      context.ellipse(160, 185, 65, 35, 0, 0, Math.PI, true);
      context.fill();
      
      // Overlay text
      context.fillStyle = '#ffffff';
      context.font = 'bold 15px sans-serif';
      context.textAlign = 'center';
      context.fillText('Security Verification Active', 160, 215);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setPhoto(dataUrl);
      onCapture(dataUrl);
    }
  };

  const triggerNativeCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const retake = () => {
    setPhoto(null);
    if (onClear) onClear();
    if (hasMediaDevices && (!isIOS || window.isSecureContext)) {
      startStreamCamera();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
      {/* Hidden file input for native camera capture */}
      <input 
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        style={{ display: 'none' }}
        onChange={handleNativeCapture}
      />

      {/* Camera Viewfinder */}
      <div 
        className="glass" 
        style={{ 
          width: '320px', 
          maxWidth: '100%',
          height: '240px', 
          position: 'relative', 
          overflow: 'hidden', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--border-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)'
        }}
      >
        {photo ? (
          <img src={photo} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : loading ? (
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Processing photo...</p>
          </div>
        ) : stream && cameraMode === 'stream' ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            webkit-playsinline="true"
            muted 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📸</div>
            <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '600', marginBottom: '0.25rem' }}>
              Selfie Verification
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '1rem' }}>
              {isIOS ? 'Tap below to snap a selfie using your iPhone camera.' : 'Capture verification portrait for attendance check-in.'}
            </p>
            <button 
              className="btn btn-primary" 
              type="button" 
              onClick={triggerNativeCamera}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              📷 Open iPhone Camera
            </button>
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Action buttons */}
      {!photo && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '320px' }}>
          {stream && cameraMode === 'stream' ? (
            <button className="btn btn-primary" type="button" onClick={captureFromStream} style={{ width: '100%' }}>
              📸 Snap Live Webcam
            </button>
          ) : null}

          <button 
            className="btn btn-secondary" 
            type="button" 
            onClick={triggerNativeCamera} 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <span>📱</span> Take Selfie with Camera
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {hasMediaDevices && cameraMode !== 'stream' && (
              <button 
                className="btn btn-outline" 
                type="button" 
                onClick={startStreamCamera} 
                style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
              >
                📹 Live Stream
              </button>
            )}
            <button 
              className="btn btn-outline" 
              type="button" 
              onClick={generateFallbackAvatar} 
              style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
            >
              🎨 Fallback Avatar
            </button>
          </div>
        </div>
      )}

      {photo && (
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '320px' }}>
          <button className="btn btn-outline" type="button" onClick={retake} style={{ flex: 1 }}>
            🔄 Retake Photo
          </button>
          <button className="btn btn-secondary" type="button" onClick={triggerNativeCamera} style={{ flex: 1 }}>
            📷 Take New Photo
          </button>
        </div>
      )}
    </div>
  );
};
