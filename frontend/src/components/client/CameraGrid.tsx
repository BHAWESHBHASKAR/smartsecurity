'use client';

import { Camera as CameraType } from '@/types';
import CameraTile from './CameraTile';

interface CameraGridProps {
  cameras: CameraType[];
}

export default function CameraGrid({ cameras }: CameraGridProps) {
  if (!cameras || cameras.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-8 text-center">
        <p className="text-text-secondary text-sm">No cameras configured</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {cameras.slice(0, 6).map((camera) => (
        <CameraTile key={camera.id} camera={camera} />
      ))}
    </div>
  );
}
