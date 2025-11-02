// Use native fetch (Node.js 18+) or import if needed
const fetch = globalThis.fetch || require('node-fetch');

// MediaMTX API configuration
const MEDIAMTX_API_URL = process.env.MEDIAMTX_API_URL || "http://localhost:9997/v3";
const MEDIAMTX_HLS_URL = process.env.MEDIAMTX_HLS_URL || "http://localhost:8888";
const MEDIAMTX_WEBRTC_URL = process.env.MEDIAMTX_WEBRTC_URL || "http://localhost:8889";
const MEDIAMTX_RTSP_URL = process.env.MEDIAMTX_RTSP_URL || "rtsp://localhost:8554";

export interface StreamUrls {
  hls: string;
  webrtc: string;
  rtsp: string;
  mjpeg: string;
}

export interface StreamInfo {
  name: string;
  ready: boolean;
  source?: any;
  tracks?: any[];
}

/**
 * Check if MediaMTX is available
 */
export async function isMediaMTXAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${MEDIAMTX_API_URL}/paths/list`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('MediaMTX availability check failed:', error);
    return false;
  }
}

/**
 * Add a stream to MediaMTX
 */
export async function addStream(streamId: string, rtspUrl: string): Promise<void> {
  const pathConfig = {
    source: rtspUrl,
    rtspTransport: "tcp",
    runOnInit: "",
    runOnInitRestart: false,
    runOnDemand: "",
    runOnDemandRestart: false,
    runOnDemandStartTimeout: "10s",
    runOnDemandCloseAfter: "10s",
    runOnUnDemand: "",
    runOnReady: "",
    runOnNotReady: "",
    runOnRead: "",
    runOnUnread: "",
    runOnRecordSegmentCreate: "",
    runOnRecordSegmentComplete: "",
  };

  const response = await fetch(`${MEDIAMTX_API_URL}/config/paths/add/${streamId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pathConfig),
  });

  if (!response.ok) {
    const errorText = await response.text();
    
    // Check if the error is because the path already exists
    if (errorText.includes("path already exists")) {
      console.log(`Stream ${streamId} already exists in MediaMTX`);
      return;
    }
    
    throw new Error(`Failed to add stream to MediaMTX: ${errorText}`);
  }
}

/**
 * Get stream information from MediaMTX
 */
export async function getStreamInfo(streamId: string): Promise<StreamInfo | null> {
  try {
    const response = await fetch(`${MEDIAMTX_API_URL}/paths/get/${streamId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to get stream info: ${response.statusText}`);
    }

    const data = await response.json() as {
      name: string;
      ready?: boolean;
      source?: unknown;
      tracks?: unknown[];
    };
    return {
      name: data.name,
      ready: data.ready || false,
      source: data.source,
      tracks: data.tracks || [],
    };
  } catch (error) {
    console.error(`Failed to get stream info for ${streamId}:`, error);
    return null;
  }
}

/**
 * Remove a stream from MediaMTX
 */
export async function removeStream(streamId: string): Promise<void> {
  const response = await fetch(`${MEDIAMTX_API_URL}/config/paths/remove/${streamId}`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    throw new Error(`Failed to remove stream from MediaMTX: ${errorText}`);
  }
}

/**
 * Generate stream URLs for different protocols
 */
export function generateStreamUrls(streamId: string): StreamUrls {
  return {
    hls: `${MEDIAMTX_HLS_URL}/${streamId}/index.m3u8`,
    webrtc: `${MEDIAMTX_WEBRTC_URL}/${streamId}`,
    rtsp: `${MEDIAMTX_RTSP_URL}/${streamId}`,
    mjpeg: `${MEDIAMTX_HLS_URL}/${streamId}/index.m3u8`, // Use HLS as fallback for MJPEG
  };
}

/**
 * Wait for stream to be ready
 */
export async function waitForStreamReady(streamId: string, timeoutMs: number = 10000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const streamInfo = await getStreamInfo(streamId);
    
    if (streamInfo && streamInfo.ready) {
      return true;
    }
    
    // Wait 500ms before checking again
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return false;
}

/**
 * Validate RTSP URL format
 */
export function validateRtspUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['rtsp:', 'rtsps:', 'http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * List all streams in MediaMTX
 */
export async function listStreams(): Promise<any[]> {
  try {
    const response = await fetch(`${MEDIAMTX_API_URL}/paths/list`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to list streams: ${response.statusText}`);
    }

    const data = await response.json() as { items?: unknown[] };
    return data.items ?? [];
  } catch (error) {
    console.error('Failed to list streams:', error);
    return [];
  }
}
