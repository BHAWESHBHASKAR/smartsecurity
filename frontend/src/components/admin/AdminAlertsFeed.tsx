'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, Phone, MapPin, Clock, CheckCircle, Circle, HandMetal } from 'lucide-react';
import type { Alert } from '@/types';
import api from '@/lib/api';
import { Button } from '../ui/button';

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString();
}

interface AdminAlertsFeedProps {
  alerts: Alert[];
  onAlertsUpdate: () => void;
}

export default function AdminAlertsFeed({ alerts, onAlertsUpdate }: AdminAlertsFeedProps) {
  const [loadingAlerts, setLoadingAlerts] = useState<Set<string>>(new Set());

  const handleCallPolice = (policeNumber: string) => {
    window.location.href = `tel:${policeNumber}`;
  };

  const handleCallClient = (clientPhone: string) => {
    window.location.href = `tel:${clientPhone}`;
  };

  const handleResolve = async (alertId: string) => {
    setLoadingAlerts(prev => new Set(prev).add(alertId));
    try {
      await api.patch(`/alerts/${alertId}/resolve`);
      onAlertsUpdate();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      alert('Failed to resolve alert. Please try again.');
    } finally {
      setLoadingAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2e2e2e] rounded-lg mb-4">
          <CheckCircle className="w-8 h-8 text-gray-500" />
        </div>
        <p className="text-gray-300 font-semibold mb-1">All Clear</p>
        <p className="text-gray-600 text-sm">No active security alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`bg-[#1a1a1a] border rounded-lg overflow-hidden transition-all hover:border-gray-700 ${alert.status === 'ACTIVE'
            ? 'border-red-500/50'
            : 'border-[#2e2e2e]'
            }`}
        >
          <div className="p-4">
            {/* Alert Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-2.5 flex-1">
                <div className={`p-2 rounded-lg ${alert.status === 'ACTIVE'
                  ? alert.detectionType === 'MANUAL' ? 'bg-orange-500/10' : 'bg-red-500/10'
                  : 'bg-[#2e2e2e]'
                  }`}>
                  {alert.detectionType === 'MANUAL' ? (
                    <HandMetal className={`w-4 h-4 ${alert.status === 'ACTIVE' ? 'text-orange-400' : 'text-gray-600'}`} />
                  ) : (
                    <AlertTriangle className={`w-4 h-4 ${alert.status === 'ACTIVE' ? 'text-red-400' : 'text-gray-600'}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-300">
                      {alert.detectionType === 'MANUAL' ? 'Manual Emergency Alert' : `${alert.detectionType} Detected`}
                    </h3>
                    {alert.detectionType === 'MANUAL' && (
                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full">
                        CLIENT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate">{alert.storeName}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${alert.status === 'ACTIVE'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-[#2e2e2e] text-gray-600'
                    }`}
                >
                  {alert.status === 'ACTIVE' && (
                    <Circle className="w-2 h-2 fill-red-400 animate-pulse" />
                  )}
                  {alert.status}
                </span>
              </div>
            </div>

            {/* Alert Image */}
            {alert.imageUrl && (
              <div className="relative mb-3 h-36 w-full overflow-hidden rounded-lg border border-[#2e2e2e]">
                <Image
                  src={alert.imageUrl}
                  alt="Alert"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}

            {/* Alert Details */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDate(alert.timestamp)}</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-600">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{alert.location.address}</span>
              </div>
            </div>

            {/* Contact Info */}
            {alert.storeContact && alert.status === 'ACTIVE' && (
              <div className="bg-[#0d0d0d] rounded-lg p-3 mb-3 border border-[#2e2e2e]">
                <p className="text-xs text-gray-600 font-medium mb-2 uppercase tracking-wider">Emergency Contacts</p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCallClient(alert.storeContact!.phone)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#2e2e2e] transition-all group"
                  >
                    <span className="text-xs text-gray-600 group-hover:text-gray-500">Client</span>
                    <span className="text-xs text-gray-400 group-hover:text-gray-300 flex items-center gap-1.5 font-medium">
                      <Phone className="w-3 h-3" />
                      {alert.storeContact.phone}
                    </span>
                  </button>
                  <button
                    onClick={() => handleCallPolice(alert.storeContact!.policeNumber)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#2e2e2e] transition-all group"
                  >
                    <span className="text-xs text-gray-600 group-hover:text-gray-500">Police</span>
                    <span className="text-xs text-red-400 group-hover:text-red-300 flex items-center gap-1.5 font-medium">
                      <Phone className="w-3 h-3" />
                      {alert.storeContact.policeNumber}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            {alert.status === 'ACTIVE' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleResolve(alert.id)}
                disabled={loadingAlerts.has(alert.id)}
                className="w-full text-xs h-9 font-semibold"
              >
                {loadingAlerts.has(alert.id) ? 'Resolving...' : 'Mark as Resolved'}
              </Button>
            )}

            {alert.status === 'RESOLVED' && (
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-[#2e2e2e] rounded-lg p-2.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="font-medium">Resolved {alert.resolvedAt && formatDate(alert.resolvedAt)}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
