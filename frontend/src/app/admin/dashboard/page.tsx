'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { 
  IconBell, 
  IconLogout, 
  IconSearch, 
  IconX, 
  IconMenu2, 
  IconVideo, 
  IconShieldCheck, 
  IconAlertTriangle, 
  IconBuilding 
} from '@tabler/icons-react';
import { useRequireAuth } from '@/hooks/useAuth';
import AdminAlertsFeed from '@/components/admin/AdminAlertsFeed';
import ClientList from '@/components/admin/ClientList';
import StatsCards from '@/components/admin/StatsCards';
import CameraGrid from '@/components/client/CameraGrid';
import api from '@/lib/api';
import type { User, Alert, SystemStats, Camera } from '@/types';

export default function AdminDashboard() {
  const { user, isLoading } = useRequireAuth('ADMIN');
  const [clients, setClients] = useState<User[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<SystemStats>({ totalUsers: 0, activeCamera: 0, activeAlerts: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [showAlertsSidebar, setShowAlertsSidebar] = useState(false);
  const [showClientsSidebar, setShowClientsSidebar] = useState(true);
  const [allCameras, setAllCameras] = useState<Camera[]>([]);

  useEffect(() => {
    if (!isLoading && user) {
      fetchClients();
      fetchAlerts();
      fetchStats();
    }
  }, [user, isLoading]);

  useEffect(() => {
    const cameras: Camera[] = [];
    clients.forEach(client => {
      if (client.store?.cameras) {
        cameras.push(...client.store.cameras);
      }
    });
    setAllCameras(cameras);
  }, [clients]);

  const fetchClients = async (search?: string) => {
    try {
      const response = await api.get(`/users/list${search ? `?search=${search}` : ''}`);
      if (response.data.success) {
        setClients(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/alerts');
      if (response.data.success) {
        setAlerts(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [usersRes, alertsRes] = await Promise.all([
        api.get('/users/list'),
        api.get('/alerts?status=ACTIVE'),
      ]);

      const users = usersRes.data.data || [];
      const activeAlerts = alertsRes.data.data || [];
      const totalCameras = users.reduce((acc: number, user: User) => {
        return acc + (user.store?.cameras?.length || 0);
      }, 0);

      setStats({
        totalUsers: users.length,
        activeCamera: totalCameras,
        activeAlerts: activeAlerts.length,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchClients(query);
  };

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const response = await api.delete(`/users/${clientId}`);
      if (response.data.success) {
        // Remove from local state
        setClients(clients.filter(c => c.id !== clientId));
        // Clear selection if deleted client was selected
        if (selectedClient?.id === clientId) {
          setSelectedClient(null);
        }
        // Refresh stats
        fetchStats();
      }
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Failed to delete client');
      console.error('Failed to delete client:', error);
    }
  };

  if (isLoading) {
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
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar - Clients */}
      <aside 
        className={`${
          showClientsSidebar ? 'w-72' : 'w-0'
        } bg-card border-r border-border flex flex-col transition-all duration-300 overflow-hidden`}
      >
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <IconBuilding className="w-4 h-4 text-primary" stroke={1.5} />
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-serif">Clients</h2>
            </div>
            <button
              onClick={() => setShowClientsSidebar(false)}
              className="lg:hidden p-1 hover:bg-accent rounded transition-colors"
            >
              <IconX className="w-4 h-4 text-muted-foreground" stroke={1.5} />
            </button>
          </div>
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" stroke={1.5} />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ClientList
            clients={clients}
            selectedClient={selectedClient}
            onSelectClient={setSelectedClient}
            onDeleteClient={handleDeleteClient}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-card border-b border-border sticky top-0 z-20">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!showClientsSidebar && (
                <button
                  onClick={() => setShowClientsSidebar(true)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <IconMenu2 className="w-5 h-5 text-muted-foreground" stroke={1.5} />
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <IconShieldCheck className="w-5 h-5 text-primary-foreground" stroke={1.5} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground font-serif">Security Command Center</h1>
                  <p className="text-muted-foreground text-xs">Real-time monitoring system</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Alerts Toggle Button */}
              <button
                onClick={() => setShowAlertsSidebar(!showAlertsSidebar)}
                className={`relative p-2.5 rounded-lg transition-all ${
                  showAlertsSidebar 
                    ? 'bg-accent text-destructive' 
                    : alerts.length > 0
                    ? 'hover:bg-accent text-destructive'
                    : 'hover:bg-accent text-muted-foreground'
                }`}
              >
                <IconBell className="w-5 h-5" stroke={1.5} />
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-semibold shadow-lg animate-pulse">
                    {alerts.length}
                  </span>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
              >
                <IconLogout className="w-4 h-4" stroke={1.5} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className={`transition-all duration-300 ${showAlertsSidebar ? 'pr-[400px]' : 'pr-0'}`}>
            <div className="p-6 space-y-6">
              {/* Stats Cards */}
              <StatsCards stats={stats} />

              {/* Camera Grid Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <IconVideo className="w-5 h-5 text-primary" stroke={1.5} />
                    <div>
                      <h2 className="text-lg font-semibold text-foreground font-serif">Live Camera Feeds</h2>
                      <p className="text-xs text-muted-foreground">{allCameras.length} cameras across all locations</p>
                    </div>
                  </div>
                </div>
                
                {selectedClient && selectedClient.store?.cameras ? (
                  <div>
                    <div className="mb-4 p-4 bg-card border border-border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Currently viewing</p>
                          <p className="text-base font-semibold text-foreground">{selectedClient.store.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground mb-1">Cameras</p>
                          <p className="text-base font-semibold text-foreground">{selectedClient.store.cameras.length}</p>
                        </div>
                      </div>
                    </div>
                    <CameraGrid cameras={selectedClient.store.cameras} />
                  </div>
                ) : (
                  <div className="bg-card border border-border border-dashed rounded-lg p-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
                      <IconVideo className="w-8 h-8 text-primary-foreground" stroke={1.5} />
                    </div>
                    <p className="text-foreground mb-2 font-medium font-serif">No client selected</p>
                    <p className="text-muted-foreground text-sm">Select a client from the sidebar to view their camera feeds</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar - Alerts */}
      <aside 
        className={`fixed right-0 top-0 h-full w-[400px] bg-card border-l border-border transform transition-transform duration-300 z-30 shadow-2xl ${
          showAlertsSidebar ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Alerts Header */}
          <div className="px-4 py-4 flex items-center border-b border-border">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5">
                <IconAlertTriangle className="w-5 h-5 text-destructive" stroke={1.5} />
                <div>
                  <h2 className="text-sm font-semibold text-foreground font-serif">Live Alerts</h2>
                  <p className="text-xs text-muted-foreground">
                    {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAlertsSidebar(false)}
                className="p-1.5 hover:bg-accent rounded transition-colors"
              >
                <IconX className="w-4 h-4 text-muted-foreground" stroke={1.5} />
              </button>
            </div>
          </div>

          {/* Alerts List */}
          <div className="flex-1 overflow-y-auto p-4">
            <AdminAlertsFeed alerts={alerts} onAlertsUpdate={fetchAlerts} />
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {showAlertsSidebar && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setShowAlertsSidebar(false)}
        />
      )}
    </div>
  );
}
