'use client';

import { useState, useEffect } from 'react';
import { Camera as CameraIcon, Wifi, WifiOff, Circle, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from '@/components/shared/VideoPlayer';
import type { Camera } from '@/types';
import api from '@/lib/api';

interface CameraTileProps {
  camera: Camera;
  onDeleted?: (cameraId: string) => void;
}

export default function CameraTile({ camera, onDeleted }: CameraTileProps) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStatusVariant = () => {
    switch (camera.status) {
      case 'ACTIVE':
        return 'default';
      case 'INACTIVE':
        return 'secondary';
      case 'ERROR':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = () => {
    return camera.status === 'ACTIVE' ? (
      <Wifi className="w-4 h-4" />
    ) : (
      <WifiOff className="w-4 h-4" />
    );
  };

  useEffect(() => {
    const fetchStreamUrl = async () => {
      if (camera.status !== 'ACTIVE') return;

      try {
        const response = await api.get(`/stream/${camera.id}`);
        
        if (response.data.success) {
          setStreamUrl(response.data.data.streamUrl);
        }
      } catch (error) {
        console.error('Failed to fetch stream URL:', error);
      }
    };

    fetchStreamUrl();
  }, [camera.id, camera.status]);

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setError(null);

    try {
      await api.delete(`/cameras/${camera.id}`);
      onDeleted?.(camera.id);
    } catch (error: any) {
      console.error('Failed to delete camera:', error);
      setError(error.response?.data?.error?.message || 'Failed to delete camera');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="overflow-hidden bg-[#1a1a1a] border-[#2e2e2e] hover:border-gray-700 transition-all">
      {/* Camera Feed */}
      {camera.status === 'ACTIVE' && streamUrl ? (
        <div className="relative">
          <VideoPlayer
            streamUrl={streamUrl}
            cameraId={camera.id}
            onStatusChange={setStreamStatus}
          />
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/80 text-white p-2 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete camera"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {/* Status Badge Overlay */}
          <div className="absolute top-2 left-2 z-10">
            <Badge 
              variant={getStatusVariant()} 
              className="capitalize text-xs flex items-center gap-1.5 bg-[#1a1a1a]/90 backdrop-blur-sm"
            >
              {streamStatus === 'playing' && (
                <Circle className="w-2 h-2 fill-gray-400 text-gray-400" />
              )}
              {streamStatus === 'playing' ? 'Live' : camera.status.toLowerCase()}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-[#0d0d0d] relative flex items-center justify-center border-b border-[#2e2e2e]">
          {camera.status === 'ACTIVE' ? (
            <div className="w-full h-full bg-[#0d0d0d] flex items-center justify-center">
              <CameraIcon className="w-12 h-12 text-gray-800" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
                  <p className="text-gray-600 text-xs">Loading feed...</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="p-3 bg-[#2e2e2e] rounded-lg">
                <WifiOff className="w-8 h-8 text-gray-700" />
              </div>
              <p className="text-gray-600 text-sm font-medium">Camera Offline</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete camera"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {/* Status Badge */}
          <div className="absolute top-2 left-2">
            <Badge variant={getStatusVariant()} className="capitalize text-xs bg-[#1a1a1a]/90 backdrop-blur-sm">
              {camera.status.toLowerCase()}
            </Badge>
          </div>
        </div>
      )}

      {/* Camera Info */}
      <CardContent className="p-3 bg-[#0d0d0d]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm text-gray-300">Camera {camera.position + 1}</p>
            <p className="text-xs text-gray-600 font-mono">{camera.ipAddress}</p>
          </div>
          <div className={`p-2 rounded-lg ${
            camera.status === 'ACTIVE' 
              ? 'bg-[#2e2e2e] text-gray-500' 
              : 'bg-[#2e2e2e] text-gray-700'
          }`}>
            {getStatusIcon()}
          </div>
        </div>
        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      </CardContent>
    </Card>
  );
}
