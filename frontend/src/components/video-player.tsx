"use client"

import { useEffect, useRef, useState } from "react"
import Hls from "hls.js"

interface VideoPlayerProps {
  src: string
  isActive: boolean
  onError?: (error: string) => void
  onLoad?: () => void
  className?: string
}

export function VideoPlayer({ src, isActive, onError, onLoad, className = "" }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if (!isActive || !src) {
      video.src = ""
      setIsLoading(false)
      setHasError(false)
      return
    }

    setIsLoading(true)
    setHasError(false)

    if (Hls.isSupported()) {
      // Use HLS.js for browsers that support it
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
      })

      hlsRef.current = hls

      hls.loadSource(src)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("HLS manifest parsed successfully")
        setIsLoading(false)
        onLoad?.()
        // Add a small delay before playing to ensure segments are available
        setTimeout(() => {
          video.play().catch((error) => {
            console.error("Video play error:", error)
            setHasError(true)
            onError?.("Failed to start video playback")
          })
        }, 500)
      })

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS error:", data)
        setIsLoading(false)
        setHasError(true)
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              onError?.("Network error: Unable to load stream")
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              onError?.("Media error: Invalid stream format")
              break
            default:
              onError?.("Fatal error occurred during playback")
              break
          }
        }
      })

    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = src
      
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false)
        onLoad?.()
      })

      video.addEventListener("error", () => {
        setIsLoading(false)
        setHasError(true)
        onError?.("Video playback error")
      })

      video.play().catch((error) => {
        console.error("Video play error:", error)
        setHasError(true)
        onError?.("Failed to start video playback")
      })
    } else {
      setIsLoading(false)
      setHasError(true)
      onError?.("HLS is not supported in this browser")
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [src, isActive, onError, onLoad])

  return (
    <div className={`relative w-full h-full bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        playsInline
        muted
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center space-y-2 text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="text-sm">Loading stream...</p>
          </div>
        </div>
      )}
      
      {hasError && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <div className="text-4xl mb-2">⚠️</div>
            <p className="text-lg font-medium">Stream Error</p>
            <p className="text-sm text-gray-300">Unable to load the video stream</p>
          </div>
        </div>
      )}
      
      {!isActive && !isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <div className="text-4xl mb-2">📺</div>
            <p className="text-lg font-medium">No Active Stream</p>
            <p className="text-sm text-gray-300">Camera stream not active</p>
          </div>
        </div>
      )}
    </div>
  )
}
