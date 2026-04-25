import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Image as ImageIcon, CameraOff, RotateCcw } from 'lucide-react';
import { usePurchaseWizard } from '../usePurchaseWizard';

interface Props {
  wizard: ReturnType<typeof usePurchaseWizard>;
}

export default function OcrCameraStep({ wizard }: Props) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [flash, setFlash] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isStarting, setIsStarting] = useState(true);

  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    setIsStarting(true);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(t('purchase.camera_denied', 'Camera access was denied. Please allow camera access in your browser settings.'));
      } else if (err.name === 'NotFoundError') {
        setCameraError(t('purchase.camera_not_found', 'No camera found on this device.'));
      } else {
        setCameraError(t('purchase.camera_error', 'Could not start camera. Try uploading a photo instead.'));
      }
    } finally {
      setIsStarting(false);
    }
  }, [t]);

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      // Cleanup: stop stream when step unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode, startCamera]);

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        wizard.updateData({ imageUrl: dataUrl });
      }
    }

    // Stop the camera stream before transitioning
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    wizard.goToStep('ocr_processing');
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      wizard.updateData({ imageUrl });
      
      // Stop the camera stream before transitioning
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      wizard.goToStep('ocr_processing');
    }
    e.target.value = ''; // Reset input so same file can be selected again
  };

  const flipCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#000', color: '#fff', margin: '-24px',
      position: 'relative', overflow: 'hidden'
    }}>

      {/* Live Camera Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          display: (cameraError || isStarting) ? 'none' : 'block',
        }}
      />

      {/* Loading State */}
      {isStarting && !cameraError && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{t('purchase.camera_starting', 'Starting camera...')}</span>
        </div>
      )}

      {/* Camera Error / Denied State */}
      {cameraError && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 32, textAlign: 'center' }}>
          <CameraOff size={56} color="rgba(255,255,255,0.4)" />
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.5 }}>{cameraError}</p>
          <button
            onClick={() => startCamera(facingMode)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#fff', color: '#000', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            <RotateCcw size={16} /> {t('common.retry', 'Try Again')}
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
            <ImageIcon size={16} /> {t('purchase.upload_instead', 'Upload from Gallery Instead')}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleGalleryUpload} />
          </label>
        </div>
      )}

      {/* Overlay UI (shown when camera is active) */}
      {!cameraError && !isStarting && (
        <>
          {/* Top Controls */}
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}>
            <button onClick={() => wizard.goToStep('entry_options')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>
              {t('common.cancel', 'Cancel')}
            </button>
            <button onClick={() => setFlash(!flash)} style={{ background: 'none', border: 'none', color: flash ? '#FBBF24' : 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
              <Zap size={24} fill={flash ? '#FBBF24' : 'none'} />
            </button>
          </div>

          {/* Scan Frame Overlay */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ width: '80%', height: '65%', position: 'relative' }}>
              {/* Corner brackets */}
              {[
                { top: 0, left: 0, borderTop: '3px solid #fff', borderLeft: '3px solid #fff', borderRadius: '4px 0 0 0' },
                { top: 0, right: 0, borderTop: '3px solid #fff', borderRight: '3px solid #fff', borderRadius: '0 4px 0 0' },
                { bottom: 0, left: 0, borderBottom: '3px solid #fff', borderLeft: '3px solid #fff', borderRadius: '0 0 0 4px' },
                { bottom: 0, right: 0, borderBottom: '3px solid #fff', borderRight: '3px solid #fff', borderRadius: '0 0 4px 0' },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: 28, height: 28, ...s }} />
              ))}
              {/* Scanning line animation */}
              <div style={{
                position: 'absolute', top: 0, left: 4, right: 4, height: 2,
                background: 'linear-gradient(90deg, transparent, #6C47FF, transparent)',
                animation: 'scanLine 2s ease-in-out infinite',
              }} />
            </div>
            <div style={{ position: 'absolute', bottom: 16, fontSize: 12, color: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.4)', padding: '4px 12px', borderRadius: 20 }}>
              {t('purchase.align_bill', 'Align bill within frame')}
            </div>
          </div>

          {/* Bottom Controls */}
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '24px 20px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>

            {/* Gallery Upload */}
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#fff', cursor: 'pointer' }}>
              <ImageIcon size={26} />
              <span style={{ fontSize: 10 }}>{t('purchase.gallery', 'Gallery')}</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleGalleryUpload} />
            </label>

            {/* Shutter Button */}
            <button
              onClick={captureImage}
              style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#fff', border: '5px solid rgba(255,255,255,0.35)',
                cursor: 'pointer', flexShrink: 0,
                boxShadow: '0 0 0 2px rgba(255,255,255,0.5)',
                transition: 'transform 0.1s',
              }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              aria-label="Capture"
            />

            {/* Flip Camera */}
            <button
              onClick={flipCamera}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <RotateCcw size={26} />
              <span style={{ fontSize: 10 }}>{t('purchase.flip', 'Flip')}</span>
            </button>
          </div>
        </>
      )}

      {/* Inject scan animation keyframes */}
      <style>{`
        @keyframes scanLine {
          0%   { top: 4px; opacity: 1; }
          50%  { top: calc(100% - 6px); opacity: 1; }
          100% { top: 4px; opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
