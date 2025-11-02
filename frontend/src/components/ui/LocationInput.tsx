'use client';

import { useState, useEffect } from 'react';
import { IconMapPin, IconSearch } from '@tabler/icons-react';
import { Input } from './input';
import { Label } from './label';

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationInputProps {
  onLocationSelect: (data: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialAddress?: string;
  error?: string;
}

export default function LocationInput({
  onLocationSelect,
  initialAddress = '',
  error,
}: LocationInputProps) {
  const [address, setAddress] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (address.length > 3) {
        searchAddress(address);
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [address]);

  const searchAddress = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        {
          headers: {
            'User-Agent': 'SmartSecurityMonitoring/1.0',
          },
        }
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Failed to search address:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (result: LocationResult) => {
    setAddress(result.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    onLocationSelect({
      address: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    });
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor="address" className="text-sm flex items-center gap-1.5">
        <IconMapPin className="w-4 h-4 text-primary" stroke={1.5} />
        Store Address & Location
      </Label>
      
      <div className="relative">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" stroke={1.5} />
          <Input
            id="address"
            type="text"
            placeholder="Search for your store address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className={`pl-10 ${error ? 'border-destructive' : ''}`}
          />
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectLocation(result)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors border-b border-border last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  <IconMapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" stroke={1.5} />
                  <span className="text-foreground">{result.display_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      
      <p className="text-xs text-muted-foreground">
        {address ? 'Drag the map marker to adjust your exact location' : 'Start typing to search for your store address'}
      </p>
    </div>
  );
}
