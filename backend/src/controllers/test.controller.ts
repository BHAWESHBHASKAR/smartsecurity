/**
 * Test Controller
 * Endpoints for testing RTSP streams before adding to cameras
 */

import { Request, Response } from 'express';
import { addStream, removeStream, getStreamInfo, generateStreamUrls, waitForStreamReady } from '../lib/mediamtx';

/**
 * Test an RTSP stream without saving to database
 * POST /api/test/stream
 * Body: { url: string }
 */
export async function testStream(req: Request, res: Response) {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Stream URL is required'
      });
    }

    // Generate a temporary test stream ID
    const testStreamId = `test_${Date.now()}`;

    // Try to register the stream with go2rtc
    await addStream(testStreamId, url);

    // Wait for stream to be ready (max 10 seconds)
    const isReady = await waitForStreamReady(testStreamId, 10000);

    if (!isReady) {
      // Clean up the test stream
      await removeStream(testStreamId);
      
      return res.status(400).json({
        success: false,
        error: 'Stream failed to connect. Please verify the RTSP URL is correct and accessible.'
      });
    }

    // Get stream info to verify it's working
    const streamInfo = await getStreamInfo(testStreamId);

    // Generate URLs for testing
    const urls = generateStreamUrls(testStreamId);

    // Return success with test URLs (valid for 30 seconds)
    res.json({
      success: true,
      message: 'Stream is working! You can test it now.',
      testStreamId,
      validFor: '30 seconds',
      streamInfo,
      urls: {
        mjpeg: urls.mjpeg,
        webrtc: urls.webrtc,
        hls: urls.hls,
        rtsp: urls.rtsp
      }
    });

    // Clean up test stream after 30 seconds
    setTimeout(async () => {
      await removeStream(testStreamId);
      console.log(`🧹 Cleaned up test stream: ${testStreamId}`);
    }, 30000);

  } catch (error) {
    console.error('Stream test failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test stream'
    });
  }
}

/**
 * Get list of available test streams
 * GET /api/test/streams
 */
export async function getTestStreams(req: Request, res: Response) {
  try {
    const testStreams = [
      {
        name: 'Big Buck Bunny (Wowza)',
        url: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
        description: 'Public test stream - very reliable, low latency',
        recommended: true
      },
      {
        name: 'Big Buck Bunny (Direct)',
        url: 'rtsp://184.72.239.149/vod/mp4:BigBuckBunny_115k.mov',
        description: 'Alternative test stream'
      },
      {
        name: 'Local Test Video',
        url: 'local_video',
        description: 'Your local showcase.mov file (pre-configured)'
      },
      {
        name: 'Pre-configured Test',
        url: 'test_stream',
        description: 'Alias for Big Buck Bunny stream'
      }
    ];

    res.json({
      success: true,
      streams: testStreams,
      note: 'Use these URLs to test streaming before adding your own RTSP cameras'
    });

  } catch (error) {
    console.error('Failed to get test streams:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test streams'
    });
  }
}
