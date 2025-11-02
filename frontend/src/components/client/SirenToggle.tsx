'use client';

import { useState } from 'react';
import { IconAlertOctagon } from '@tabler/icons-react';
import api from '@/lib/api';

interface SirenToggleProps {
  storeId: string;
  currentStatus: boolean;
  onStatusChange: (status: boolean) => void;
}

export default function SirenToggle({ storeId, currentStatus, onStatusChange }: SirenToggleProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const newStatus = !currentStatus;
      await api.post('/siren/toggle', {
        storeId,
        action: newStatus ? 'ON' : 'OFF',
      });
      onStatusChange(newStatus);
    } catch (error) {
      console.error('Failed to toggle siren:', error);
      alert('Failed to toggle siren. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`rounded-lg p-4 transition-all flex items-center justify-center gap-2 ${
        currentStatus
          ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
          : 'bg-card hover:bg-accent border border-border text-foreground'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <IconAlertOctagon className={`w-5 h-5 ${currentStatus ? 'animate-pulse' : ''}`} stroke={1.5} />
      <div className="text-left">
        <p className="font-semibold text-sm">Siren</p>
        <p className="text-xs opacity-90">
          {isLoading ? 'Updating...' : currentStatus ? 'ON - Click to turn OFF' : 'OFF - Click to turn ON'}
        </p>
      </div>
    </button>
  );
}
