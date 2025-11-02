'use client';

import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface GoogleMapsInputProps {
  onLocationSelect: (data: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialAddress?: string;
  error?: string;
}

export default function GoogleMapsInput({
  onLocationSelect,
  initialAddress = '',
  error,
}: GoogleMapsInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialAddress) {
      onLocationSelect({ address: initialAddress, latitude: 0, longitude: 0 });
    }
  }, [initialAddress, onLocationSelect]);

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        <MapPin className="inline w-4 h-4 mr-1" />
        Store Address
      </label>
      <input
        ref={inputRef}
        type="text"
        placeholder="Enter your store address"
        defaultValue={initialAddress}
        onChange={(e) => {
          onLocationSelect({
            address: e.target.value,
            latitude: 0,
            longitude: 0,
          });
        }}
        className={`w-full px-3 py-2 bg-background border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all ${
          error ? 'border-destructive' : 'border-input'
        }`}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Enter your store address. Map selection is temporarily disabled.
      </p>
    </div>
  );
}
