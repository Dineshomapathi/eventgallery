"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, Loader } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
  src: string
  poster?: string
  className?: string
}

export default function VideoPlayer({ src, poster, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Reset state when src changes
    setLoading(true)
    setError(null)
    setProgress(0)
    setIsPlaying(false)

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100
      setProgress(progress)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleLoadedData = () => setLoading(false)
    const handleError = () => {
      console.error("Video error:", video.error)
      setLoading(false)
      setError("Failed to load video. Please try again later.")
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("loadeddata", handleLoadedData)
    video.addEventListener("error", handleError)

    // Add a timeout to handle cases where the video doesn't load
    const timeoutId = setTimeout(() => {
      if (loading && !error) {
        setLoading(false)
        setError("Video loading timed out. Please check your connection and try again.")
      }
    }, 15000) // 15 seconds timeout

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("loadeddata", handleLoadedData)
      video.removeEventListener("error", handleError)
      clearTimeout(timeoutId)
    }
  }, [src, loading, error])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch((err) => {
          console.error("Error playing video:", err)
          setError("Failed to play video. Please try again.")
        })
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const progressBar = e.currentTarget
      const rect = progressBar.getBoundingClientRect()
      const pos = (e.clientX - rect.left) / rect.width
      videoRef.current.currentTime = pos * videoRef.current.duration
    }
  }

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen().catch((err) => {
          console.error("Error entering fullscreen:", err)
        })
      }
    }
  }

  if (!src) {
    return null // Don't render anything if no src is provided
  }

  return (
    <div className={cn("relative rounded-lg overflow-hidden bg-black", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <Loader className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white text-center p-4">
            <p className="text-red-400 mb-2">Error loading video</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-auto"
        poster={poster}
        preload="metadata"
        playsInline
        onError={() => setError("Failed to load video")}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        {/* Progress bar */}
        <div className="h-1 bg-gray-600 rounded-full mb-2 cursor-pointer" onClick={handleProgressClick}>
          <div className="h-full bg-teal-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={togglePlay}
            className="text-white p-1 rounded-full hover:bg-white/20 transition"
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={!!error}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="text-white p-1 rounded-full hover:bg-white/20 transition"
              aria-label={isMuted ? "Unmute" : "Mute"}
              disabled={!!error}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            <button
              onClick={handleFullscreen}
              className="text-white p-1 rounded-full hover:bg-white/20 transition"
              aria-label="Fullscreen"
              disabled={!!error}
            >
              <Maximize size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
