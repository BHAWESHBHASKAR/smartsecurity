'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  IconMapPin,
  IconBell,
  IconLogout,
  IconAlertTriangle,
  IconShieldCheck,
  IconVideo,
  IconPlus
} from '@tabler/icons-react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useSocketEvent } from '@/hooks/useSocket';
import CameraGrid from '@/components/client/CameraGrid';
import AlertNotifications from '@/components/client/AlertNotifications';
import AlertPopup from '@/components/client/AlertPopup';
import api from '@/lib/api';
import type { Store, Alert } from '@/types';

export default function ClientDashboard() {
  const router = useRouter();
  const { user, isLoading } = useRequireAuth('CLIENT');
  const [store, setStore] = useState<Store | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sirenStatus, setSirenStatus] = useState(false);
  const [showAddCameraModal, setShowAddCameraModal] = useState(false);
  const [newCameraUrl, setNewCameraUrl] = useState('');
  const [isAddingCamera, setIsAddingCamera] = useState(false);
  const [addCameraError, setAddCameraError] = useState('');
  const [popupAlert, setPopupAlert] = useState<Alert | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      // Fetch fresh user data to check if store exists
      checkUserStore();
    }
  }, [user, isLoading, router]);

  const checkUserStore = async () => {
    try {
      const response = await api.get('/users/me');
      const userData = response.data.data;

      // Check if user has completed setup
      if (!userData.store) {
        router.push('/setup');
        return;
      }

      // User has store, fetch data
      fetchStoreData();
      fetchAlerts();
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      router.push('/setup');
    }
  };

  // Real-time socket updates
  useSocketEvent<Alert>('alert:new', (newAlert) => {
    setAlerts(prev => [newAlert, ...prev]);
    setSirenStatus(true);
    // Show popup for new alert
    setPopupAlert(newAlert);
  });

  useSocketEvent<string>('alert:resolved', (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    // Check if there are still active alerts
    setAlerts(prev => {
      if (prev.length === 0) {
        setSirenStatus(false);
      }
      return prev;
    });
  });

  useSocketEvent<{ storeId: string; status: boolean }>('siren:status', (data) => {
    if (store && data.storeId === store.id) {
      setSirenStatus(data.status);
    }
  });

  const fetchStoreData = async () => {
    try {
      const response = await api.get('/users/me');
      if (response.data.success && response.data.data.store) {
        setStore(response.data.data.store);
      }
    } catch (error) {
      console.error('Failed to fetch store data:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/alerts?status=ACTIVE');
      if (response.data.success) {
        const activeAlerts = response.data.data;
        setAlerts(activeAlerts);
        // If there are active alerts, siren should be ON
        setSirenStatus(activeAlerts.length > 0);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  const handleAddCamera = async () => {
    if (!newCameraUrl.trim()) {
      setAddCameraError('Please enter a camera RTSP URL');
      return;
    }

    const rtspPattern = /^rtsp(s)?:\/\/.+/i;
    if (!rtspPattern.test(newCameraUrl)) {
      setAddCameraError('Please enter a valid RTSP URL (e.g., rtsp://192.168.1.100:554/stream)');
      return;
    }

    setIsAddingCamera(true);
    setAddCameraError('');

    try {
      const response = await api.post(`/cameras`, {
        storeId: store?.id,
        rtspUrl: newCameraUrl,
      });

      if (response.data.success) {
        // Refresh store data to get updated camera list
        await fetchStoreData();
        setShowAddCameraModal(false);
        setNewCameraUrl('');
      }
    } catch (error: any) {
      setAddCameraError(error.response?.data?.error?.message || 'Failed to add camera');
    } finally {
      setIsAddingCamera(false);
    }
  };

  if (isLoading || !store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <IconShieldCheck className="w-5 h-5 text-primary-foreground" stroke={1.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground font-serif">{store.name}</h1>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <IconMapPin className="w-3 h-3" stroke={1.5} />
                <span>{store.address}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
              <IconBell className="w-4 h-4 text-muted-foreground" stroke={1.5} />
              <span className="text-xs text-muted-foreground">{alerts.length} Alerts</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
            >
              <IconLogout className="w-4 h-4" stroke={1.5} />
              <span className="hidden sm:inline text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Active Alerts Banner */}
        {alerts.length > 0 && (
          <div className="mb-6 bg-destructive/10 border border-destructive/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <IconAlertTriangle className="w-5 h-5 text-destructive" stroke={1.5} />
              <div>
                <h3 className="font-semibold text-destructive text-sm font-serif">Active Security Alert</h3>
                <p className="text-xs text-muted-foreground">
                  {alerts.length} threat{alerts.length > 1 ? 's' : ''} detected. Review below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Camera Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconVideo className="w-5 h-5 text-primary" stroke={1.5} />
              <h2 className="text-lg font-semibold text-foreground font-serif">Live Camera Feeds</h2>
              <span className="text-xs text-muted-foreground">({store.cameras.length} cameras)</span>
            </div>
            <button
              onClick={() => setShowAddCameraModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm font-medium"
              title="Add new camera"
            >
              <IconPlus className="w-4 h-4" stroke={1.5} />
              <span>Add Camera</span>
            </button>
          </div>
          <CameraGrid cameras={store.cameras} />
        </div>

        {/* Alerts */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <IconBell className="w-5 h-5 text-primary" stroke={1.5} />
            <h2 className="text-lg font-semibold text-foreground font-serif">Recent Alerts</h2>
          </div>
          <AlertNotifications alerts={alerts} onAlertsUpdate={fetchAlerts} />
        </div>
      </main>

      {/* Add Camera Modal */}
      {showAddCameraModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 font-serif">Add New Camera</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Camera RTSP URL
                </label>
                <input
                  type="text"
                  value={newCameraUrl}
                  onChange={(e) => setNewCameraUrl(e.target.value)}
                  placeholder="e.g., rtsp://192.168.1.100:554/stream"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isAddingCamera}
                />
                {addCameraError && (
                  <p className="text-xs text-destructive mt-1">{addCameraError}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddCamera}
                  disabled={isAddingCamera}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingCamera ? 'Adding...' : 'Add Camera'}
                </button>
                <button
                  onClick={() => {
                    setShowAddCameraModal(false);
                    setNewCameraUrl('');
                    setAddCameraError('');
                  }}
                  disabled={isAddingCamera}
                  className="flex-1 bg-card hover:bg-accent border border-border text-foreground rounded-lg py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Popup - Shows when new risk is detected */}
      <AlertPopup
        alert={popupAlert}
        onClose={() => setPopupAlert(null)}
        onSirenToggle={() => {
          setSirenStatus(false);
          fetchAlerts();
        }}
      />
    </div>
  );
}
