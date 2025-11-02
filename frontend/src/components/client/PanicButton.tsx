'use client';

import { useState } from 'react';
import { IconAlertTriangle, IconX } from '@tabler/icons-react';
import api from '@/lib/api';

interface PanicButtonProps {
  onAlertCreated?: () => void;
}

export default function PanicButton({ onAlertCreated }: PanicButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [error, setError] = useState('');

  const handlePanicClick = () => {
    setShowConfirmDialog(true);
    setError('');
  };

  const handleConfirm = async () => {
    setIsCreatingAlert(true);
    setError('');

    try {
      const response = await api.post('/alerts/panic');
      
      if (response.data.success) {
        setShowConfirmDialog(false);
        // Show success notification
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('toast', {
            detail: {
              type: 'success',
              message: 'Emergency alert activated! Police notified and siren turned ON.',
            },
          });
          window.dispatchEvent(event);
        }
        
        // Notify parent component
        if (onAlertCreated) {
          onAlertCreated();
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to create alert. Please try again.';
      setError(errorMessage);
      
      // Show error toast
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('toast', {
          detail: {
            type: 'error',
            message: errorMessage,
          },
        });
        window.dispatchEvent(event);
      }
    } finally {
      setIsCreatingAlert(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setError('');
  };

  return (
    <>
      <button
        onClick={handlePanicClick}
        className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg p-4 transition-all flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
        title="Raise emergency alert"
      >
        <IconAlertTriangle className="w-5 h-5" stroke={2} />
        <span className="text-sm">Raise Alert</span>
      </button>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                <IconAlertTriangle className="w-5 h-5 text-orange-600" stroke={2} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1 font-serif">
                  Confirm Emergency Alert
                </h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to raise an emergency alert?
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={isCreatingAlert}
              >
                <IconX className="w-5 h-5" stroke={1.5} />
              </button>
            </div>

            <div className="bg-orange-600/10 border border-orange-600/30 rounded-lg p-3 mb-4">
              <p className="text-sm text-foreground font-medium mb-2">This will immediately:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li className="list-disc">Activate your store's siren</li>
                <li className="list-disc">Send WhatsApp notification to police</li>
                <li className="list-disc">Alert all administrators</li>
                <li className="list-disc">Create an emergency alert record</li>
              </ul>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                disabled={isCreatingAlert}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg py-2.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreatingAlert ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Activating...
                  </span>
                ) : (
                  'Confirm Emergency'
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isCreatingAlert}
                className="flex-1 bg-card hover:bg-accent border border-border text-foreground rounded-lg py-2.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
