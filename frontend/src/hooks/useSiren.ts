'use client';

import { useState, useCallback } from 'react';
import { useSocketEvent } from './useSocket';
import api from '@/lib/api';

export function useSiren(storeId: string) {
  const [status, setStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Listen for siren status updates
  useSocketEvent<{ storeId: string; status: boolean }>('siren:status', (data) => {
    if (data.storeId === storeId) {
      setStatus(data.status);
    }
  });

  const toggle = useCallback(async () => {
    setIsLoading(true);
    try {
      const newStatus = !status;
      await api.post('/siren/toggle', {
        storeId,
        action: newStatus ? 'ON' : 'OFF',
      });
      setStatus(newStatus);
    } catch (error) {
      console.error('Failed to toggle siren:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [storeId, status]);

  return {
    status,
    isLoading,
    toggle,
  };
}
