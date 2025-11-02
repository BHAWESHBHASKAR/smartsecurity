'use client';

import { IconAlertTriangle, IconPhone, IconX, IconCircleCheck, IconHandStop } from '@tabler/icons-react';
import Image from 'next/image';
import type { Alert } from '@/types';
import api from '@/lib/api';
import { Button } from '../ui/button';

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString();
}

interface AlertNotificationsProps {
  alerts: Alert[];
  onAlertsUpdate: () => void;
}

export default function AlertNotifications({ alerts, onAlertsUpdate }: AlertNotificationsProps) {
  const handleResolve = async (alertId: string) => {
    try {
      const response = await api.patch(`/alerts/${alertId}/resolve`, {});
      if (response.data.success) {
        // Success - refresh alerts
        onAlertsUpdate();
      } else {
        console.error('Failed to resolve alert:', response.data);
        alert('Failed to resolve alert. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to resolve alert:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to resolve alert. Please try again.';
      alert(errorMessage);
    }
  };

  const handleCallPolice = (policeNumber: string) => {
    window.location.href = `tel:${policeNumber}`;
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
          <IconCircleCheck className="w-8 h-8 text-primary-foreground" stroke={1.5} />
        </div>
        <p className="text-foreground font-semibold mb-1 font-serif">All Clear</p>
        <p className="text-muted-foreground text-sm">No active security alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-card border-2 border-destructive/50 rounded-lg overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Alert Image */}
              {alert.imageUrl && (
                <div className="relative flex-shrink-0 h-24 w-24 overflow-hidden rounded-lg border border-border">
                  <Image
                    src={alert.imageUrl}
                    alt="Alert"
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
              )}

              {/* Alert Details */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {alert.detectionType === 'MANUAL' ? (
                        <IconHandStop className="w-5 h-5 text-orange-600" stroke={1.5} />
                      ) : (
                        <IconAlertTriangle className="w-5 h-5 text-destructive" stroke={1.5} />
                      )}
                      <h3 className="text-base font-semibold text-foreground font-serif">
                        {alert.detectionType === 'MANUAL' ? 'Manual Emergency Alert' : `${alert.detectionType} Detected`}
                      </h3>
                      {alert.detectionType === 'MANUAL' && (
                        <span className="px-2 py-0.5 bg-orange-600/10 text-orange-600 text-xs font-medium rounded-full">
                          MANUAL
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(alert.timestamp)}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs font-medium rounded-full">
                    ACTIVE
                  </span>
                </div>

                <p className="text-muted-foreground text-xs mb-3">
                  Location: {alert.location.address}
                </p>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleResolve(alert.id)}
                    className="flex items-center gap-2"
                  >
                    <IconX className="w-4 h-4" stroke={1.5} />
                    Turn Siren OFF
                  </Button>
                  {alert.storeContact?.policeNumber && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCallPolice(alert.storeContact!.policeNumber)}
                      className="flex items-center gap-2"
                    >
                      <IconPhone className="w-4 h-4" stroke={1.5} />
                      Contact Police
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
