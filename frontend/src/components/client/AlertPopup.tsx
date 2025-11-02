'use client';

import { useEffect, useState } from 'react';
import { IconAlertTriangle, IconX, IconBell, IconPhone, IconShieldCheck } from '@tabler/icons-react';
import type { Alert } from '@/types';
import api from '@/lib/api';

interface AlertPopupProps {
  alert: Alert | null;
  onClose: () => void;
  onSirenToggle: () => void;
}

export default function AlertPopup({ alert, onClose, onSirenToggle }: AlertPopupProps) {
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (alert) {
      // Play alert sound
      const audio = new Audio('/alert-sound.mp3');
      audio.play().catch(err => console.log('Audio play failed:', err));
    }
  }, [alert]);

  if (!alert) return null;

  const handleTurnOffSiren = async () => {
    setIsResolving(true);
    try {
      await api.patch(`/alerts/${alert.id}/resolve`);
      onSirenToggle();
      onClose();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const handleCallPolice = () => {
    if (alert.storeContact?.policeNumber) {
      window.location.href = `tel:${alert.storeContact.policeNumber}`;
    }
  };

  const handleContactSupport = () => {
    // Open support contact
    window.open('mailto:support@smartsecurity.com', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card border-2 border-destructive rounded-lg max-w-2xl w-full shadow-2xl animate-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-destructive/10 border-b border-destructive/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive rounded-full flex items-center justify-center animate-pulse">
              <IconAlertTriangle className="w-6 h-6 text-white" stroke={2} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-destructive font-serif">
                Security Alert Detected!
              </h2>
              <p className="text-sm text-muted-foreground">
                {alert.detectionType === 'MANUAL' ? 'Manual Emergency Alert' : `${alert.detectionType} Detected`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconX className="w-5 h-5" stroke={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Alert Image */}
          {alert.imageUrl && (
            <div className="mb-4 rounded-lg overflow-hidden border border-border">
              <img
                src={alert.imageUrl}
                alt="Alert detection"
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Alert Details */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Time</p>
                <p className="font-medium text-foreground">
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Location</p>
                <p className="font-medium text-foreground">
                  {alert.location?.address || 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 font-serif">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Raise Alert Button */}
              <button
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg p-4 transition-all flex flex-col items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
                onClick={onClose}
              >
                <IconBell className="w-6 h-6" stroke={2} />
                <span className="text-sm">Alert Active</span>
              </button>

              {/* Turn Off Siren */}
              <button
                onClick={handleTurnOffSiren}
                disabled={isResolving}
                className="bg-muted hover:bg-accent text-foreground rounded-lg p-4 transition-all flex flex-col items-center justify-center gap-2 font-semibold border border-border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconShieldCheck className="w-6 h-6" stroke={2} />
                <span className="text-sm">
                  {isResolving ? 'Turning Off...' : 'Turn Siren OFF'}
                </span>
              </button>

              {/* Call Police */}
              <button
                onClick={handleCallPolice}
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg p-4 transition-all flex flex-col items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
              >
                <IconPhone className="w-6 h-6" stroke={2} />
                <span className="text-sm">Call Police</span>
              </button>

              {/* Contact Support */}
              <button
                onClick={handleContactSupport}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg p-4 transition-all flex flex-col items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
              >
                <IconPhone className="w-6 h-6" stroke={2} />
                <span className="text-sm">Contact Support</span>
              </button>
            </div>
          </div>

          {/* Warning Message */}
          <div className="mt-4 bg-orange-600/10 border border-orange-600/30 rounded-lg p-3">
            <p className="text-sm text-foreground">
              <strong>⚠️ Emergency Response Active:</strong> Siren is ON and police have been notified via WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
