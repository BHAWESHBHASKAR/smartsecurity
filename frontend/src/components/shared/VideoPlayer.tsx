'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2, Maximize2, Minimize2, Play, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  streamUrl: string;
  cameraId: string;
  onError?: (error: Error) => void;
  onStatusChange?: (status: 'loading' | 'playing' | 'error') => void;
  className?: string;
}

export function VideoPlayer({
  streamUrl,
  cameraId,
  onError,
  onStatusChange,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const mjpegRef = useRef<HTMLImageElement>(null);
  const [status, setStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Improved stream detection - prioritize HLS for MediaMTX
  const isMjpegStream = useMemo(() => {
    const lowerUrl = streamUrl.toLowerCase();
    // MediaMTX primarily uses HLS, so only use MJPEG for specific endpoints
    return lowerUrl.includes('mjpeg') ||
           lowerUrl.includes('stream.mjpeg') ||
           streamUrl.includes(':8080/stream/') || // Legacy stream proxy URLs
           (lowerUrl.includes('/api/stream.mjpeg') && !lowerUrl.includes('.m3u8')); // go2rtc MJPEG endpoint but not HLS
  }, [streamUrl]);

  const updateStatus = useCallback(
    (newStatus: 'loading' | 'playing' | 'error') => {
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    },
    [onStatusChange]
  );

  const handleError = useCallback(
    (error: Error, message: string) => {
      console.error('Video player error:', error);
      setErrorMessage(message);
      updateStatus('error');
      onError?.(error);
    },
    [onError, updateStatus]
  );

  // Initialize MJPEG stream (continuous image updates)
  const initializeMjpegStream = useCallback(() => {
    const image = mjpegRef.current;
    if (!image) return;

    console.log('Initializing MJPEG stream:', streamUrl);
    updateStatus('loading');

    const handleImageLoad = () => {
      console.log('MJPEG image loaded');
      updateStatus('playing');
    };

    const handleImageError = () => {
      console.error('MJPEG image error');
      handleError(
        new Error('MJPEG stream error'),
        'Failed to load MJPEG stream. Reconnecting...'
      );
    };

    image.onload = handleImageLoad;
    image.onerror = handleImageError as OnErrorEventHandler;

    // Set source with cache-busting to get fresh frames
    image.src = `${streamUrl}?t=${Date.now()}`;
  }, [streamUrl, updateStatus, handleError]);

  const initializeHlsStream = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log('Initializing HLS stream:', streamUrl);
    updateStatus('loading');

    // Check if HLS is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 5,
        liveDurationInfinity: true,
        highBufferWatchdogPeriod: 2,
      });

      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed');
        video.play().catch((err) => {
          console.warn('Autoplay prevented:', err);
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              handleError(
                new Error('Network error'),
                'Network error. Attempting to recover...'
              );
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              handleError(
                new Error('Media error'),
                'Media error. Attempting to recover...'
              );
              hls.recoverMediaError();
              break;
            default:
              handleError(
                new Error('Fatal error'),
                'Unable to load video stream'
              );
              hls.destroy();
              break;
          }
        }
      });

      video.addEventListener('playing', () => {
        updateStatus('playing');
      });

      video.addEventListener('waiting', () => {
        updateStatus('loading');
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch((err) => {
          console.warn('Autoplay prevented:', err);
        });
      });

      video.addEventListener('playing', () => {
        updateStatus('playing');
      });

      video.addEventListener('error', () => {
        handleError(
          new Error('Video error'),
          'Unable to load video stream'
        );
      });
    } else {
      handleError(
        new Error('HLS not supported'),
        'Your browser does not support video streaming'
      );
    }
  }, [streamUrl, updateStatus, handleError]);

  const initializePlayer = useCallback(() => {
    console.log('Initializing player for:', streamUrl, 'MJPEG:', isMjpegStream);
    if (isMjpegStream) {
      initializeMjpegStream();
    } else {
      initializeHlsStream();
    }
  }, [initializeHlsStream, initializeMjpegStream, isMjpegStream, streamUrl]);

  const cleanup = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (mjpegRef.current) {
      mjpegRef.current.src = '';
    }
  }, []);

  const handleRetry = useCallback(() => {
    cleanup();
    setErrorMessage('');
    initializePlayer();
  }, [cleanup, initializePlayer]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  useEffect(() => {
    setErrorMessage('');
    updateStatus('loading');

    if (!isMjpegStream) {
      initializePlayer();
    } else {
      cleanup();
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      cleanup();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [cleanup, initializePlayer, isMjpegStream, streamUrl, updateStatus]);

  useEffect(() => {
    if (!isMjpegStream) {
      if (mjpegRef.current) {
        mjpegRef.current.src = '';
      }
      return;
    }

    const img = mjpegRef.current;
    if (!img) {
      return;
    }

    let isActive = true;
    let loadAttempts = 0;
    const maxAttempts = 3;

    const handleLoad = () => {
      if (!isActive) return;
      console.log('MJPEG stream loaded successfully');
      updateStatus('playing');
      loadAttempts = 0;
    };
    
    const handleImgError = () => {
      if (!isActive) return;
      loadAttempts++;
      console.error(`MJPEG stream error (attempt ${loadAttempts}/${maxAttempts})`);

      if (loadAttempts < maxAttempts) {
        const retryUrl = streamUrl.includes('?')
          ? `${streamUrl}&retry=${Date.now()}`
          : `${streamUrl}?retry=${Date.now()}`;

        retryTimeoutRef.current = setTimeout(() => {
          if (isActive && img) {
            console.log('Retrying MJPEG stream...');
            img.src = retryUrl;
          }
        }, 2000);
      } else {
        handleError(
          new Error('MJPEG stream error'),
          'Unable to load video stream. Please check if the camera is online.'
        );
      }
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleImgError);

    // Add timestamp to prevent caching issues
    const urlWithTimestamp = streamUrl.includes('?')
      ? `${streamUrl}&t=${Date.now()}`
      : `${streamUrl}?t=${Date.now()}`;
    
    console.log('Loading MJPEG stream from:', urlWithTimestamp);
    img.src = urlWithTimestamp;

    return () => {
      isActive = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleImgError);
      img.src = '';
    };
  }, [handleError, isMjpegStream, streamUrl, updateStatus]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full aspect-video bg-black rounded-lg overflow-hidden group',
        className
      )}
    >
      <video
        ref={videoRef}
        className={cn('w-full h-full object-contain', isMjpegStream && 'hidden')}
        playsInline
        muted
      />
      {/* MJPEG element requires direct img access for streaming */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={mjpegRef}
        className={cn('w-full h-full object-contain', !isMjpegStream && 'hidden')}
        alt={`Camera ${cameraId} live stream`}
      />

      {/* Loading Overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
            <p className="text-xs text-white">Loading stream...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-sm w-full space-y-3">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
            </Alert>
            <Button onClick={handleRetry} size="sm" className="w-full" variant="secondary">
              <Play className="w-4 h-4 mr-2" />
              Retry Connection
            </Button>
          </div>
        </div>
      )}

      {/* Fullscreen Button */}
      {status === 'playing' && (
        <Button
          size="icon"
          variant="secondary"
          onClick={toggleFullscreen}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </Button>
      )}

      {/* Connection Quality Indicator */}
      {status === 'playing' && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white">
            Live
          </div>
        </div>
      )}
    </div>
  );
}
