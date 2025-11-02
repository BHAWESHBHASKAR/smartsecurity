/**
 * go2rtc Integration Service
 * 
 * Provides utilities to interact with go2rtc streaming server:
 * - Dynamic stream registration via API
 * - Stream status monitoring
 * - Format URL generation
 */

import axios, { AxiosError } from 'axios';

const GO2RTC_URL = process.env.GO2RTC_URL || 'http://localhost:1984';
const GO2RTC_RTSP_URL = process.env.GO2RTC_RTSP_URL || 'rtsp://localhost:8554';

export interface StreamInfo {
  producers?: Array<{ url: string; state?: string }>;
  consumers?: Array<{ url: string }> | null;
}

export interface StreamUrls {
  webrtc: string;
  mjpeg: string;
  hls: string;
  rtsp: string;
}

/**
 * Add or update a stream in go2rtc
 * go2rtc supports adding streams dynamically via PUT /api/streams
 * For RTSP sources, we use FFmpeg for better compatibility and features
 */
export async function addStream(streamId: string, sourceUrl: string): Promise<void> {
  try {
    // Format source URL for go2rtc with FFmpeg
    let formattedSource = sourceUrl;
    
    // If it's an RTSP URL, wrap it with ffmpeg for better compatibility
    if (sourceUrl.startsWith('rtsp://') || sourceUrl.startsWith('rtsps://')) {
      formattedSource = `ffmpeg:${sourceUrl}#video=copy#audio=copy`;
    }
    // If it's a local file path, use ffmpeg
    else if (sourceUrl.startsWith('/') || sourceUrl.startsWith('./')) {
      formattedSource = `ffmpeg:${sourceUrl}#video=copy#audio=copy`;
    }
    // For http/https streams, also use ffmpeg
    else if (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://')) {
      formattedSource = `ffmpeg:${sourceUrl}#video=copy#audio=copy`;
    }
    // If already has ffmpeg: prefix or is a named stream reference, use as-is
    
    // go2rtc API: PUT /api/streams?src=<stream_id> with source URL in body
    await axios.put(`${GO2RTC_URL}/api/streams?src=${streamId}`, formattedSource, {
      timeout: 5000,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    
    console.log(`✅ Stream "${streamId}" registered with go2rtc: ${formattedSource}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('❌ Failed to add stream to go2rtc:', axiosError.message);
      throw new Error(`go2rtc stream registration failed: ${axiosError.message}`);
    }
    throw error;
  }
}

/**
 * Remove a stream from go2rtc
 */
export async function removeStream(streamId: string): Promise<void> {
  try {
    await axios.delete(`${GO2RTC_URL}/api/streams?src=${streamId}`, {
      timeout: 5000
    });
    
    console.log(`✅ Stream "${streamId}" removed from go2rtc`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Failed to remove stream from go2rtc:', error.message);
    }
    // Don't throw - removal failures shouldn't block other operations
  }
}

/**
 * Check if a stream exists and is available in go2rtc
 */
export async function getStreamInfo(streamId: string): Promise<StreamInfo | null> {
  try {
    const response = await axios.get<Record<string, StreamInfo>>(`${GO2RTC_URL}/api/streams`, {
      timeout: 5000
    });
    
    return response.data[streamId] || null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Failed to get stream info:', error.message);
    }
    return null;
  }
}

/**
 * Check if go2rtc service is available
 */
export async function isGo2rtcAvailable(): Promise<boolean> {
  try {
    await axios.get(`${GO2RTC_URL}/api/streams`, { timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate all stream format URLs for a given stream ID
 */
export function generateStreamUrls(streamId: string): StreamUrls {
  return {
    webrtc: `${GO2RTC_URL}/api/webrtc?src=${streamId}`,
    mjpeg: `${GO2RTC_URL}/api/stream.mjpeg?src=${streamId}`,
    hls: `${GO2RTC_URL}/api/stream.m3u8?src=${streamId}`,
    rtsp: `${GO2RTC_RTSP_URL}/${streamId}`
  };
}

/**
 * Validate and normalize RTSP URL
 */
export function validateRtspUrl(url: string): { valid: boolean; normalized?: string; error?: string } {
  try {
    // Check if it's already a valid RTSP URL
    if (url.startsWith('rtsp://') || url.startsWith('rtsps://')) {
      return { valid: true, normalized: url };
    }
    
    // Check if it's a test stream reference
    if (url === 'test_stream' || url === 'test_stream2') {
      return { valid: true, normalized: url };
    }
    
    // Check if it's an HTTP/HTTPS stream
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return { valid: true, normalized: url };
    }
    
    // Check if it's a file path
    if (url.startsWith('/') || url.startsWith('./')) {
      return { valid: true, normalized: url };
    }
    
    // If it looks like an IP address without protocol, try to construct RTSP URL
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}/;
    if (ipPattern.test(url)) {
      return {
        valid: false,
        error: 'IP address provided without RTSP URL. Please provide full RTSP URL like: rtsp://username:password@192.168.1.100:554/stream'
      };
    }
    
    return {
      valid: false,
      error: 'Invalid stream URL. Supported formats: rtsp://, http://, https://, or file path'
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate stream URL'
    };
  }
}

/**
 * Wait for stream to be ready (producers connected)
 */
export async function waitForStreamReady(streamId: string, timeoutMs: number = 10000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const info = await getStreamInfo(streamId);
    
    if (info?.producers && info.producers.length > 0) {
      const hasActiveProducer = info.producers.some(p => !p.state || p.state === 'connected');
      if (hasActiveProducer) {
        return true;
      }
    }
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return false;
}
