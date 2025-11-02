'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocketEvent } from './useSocket';
import type { Alert } from '@/types';
import api from '@/lib/api';

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/alerts?status=ACTIVE');
      if (response.data.success) {
        setAlerts(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Listen for new alerts
  useSocketEvent<Alert>('alert:new', (alert) => {
    setAlerts((prev) => [alert, ...prev]);
    
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Security Alert!', {
        body: `${alert.detectionType} detected at ${alert.storeName}`,
        icon: '/alert-icon.png',
        tag: alert.id,
      });
    }
  });

  // Listen for resolved alerts
  useSocketEvent<string>('alert:resolved', (alertId) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  });

  return {
    alerts,
    isLoading,
    refetch: fetchAlerts,
  };
}
