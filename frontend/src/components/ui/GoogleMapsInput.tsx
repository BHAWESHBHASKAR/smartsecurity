'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

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
  const [value, setValue] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState<
    { display_name: string; lat: string; lon: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSelectedSuggestion, setHasSelectedSuggestion] = useState(false);

  useEffect(() => {
    setValue(initialAddress);

    if (initialAddress) {
      onLocationSelect({
        address: initialAddress,
        latitude: 0,
        longitude: 0,
      });
    }
  }, [initialAddress, onLocationSelect]);

  useEffect(() => {
    if (!value || value.trim().length < 3 || hasSelectedSuggestion) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    setIsLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            value.trim()
          )}&limit=5`,
          {
            headers: {
              'User-Agent': 'SmartSecurityMonitoring/1.0',
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = (await response.json()) as {
          display_name: string;
          lat: string;
          lon: string;
        }[];

        if (isActive) {
          setSuggestions(data);
        }
      } catch (err) {
        if (isActive) {
          setSuggestions([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }, 350);

    return () => {
      isActive = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [value, hasSelectedSuggestion]);

  const handleSuggestionSelect = (suggestion: {
    display_name: string;
    lat: string;
    lon: string;
  }) => {
    const latitude = Number(suggestion.lat);
    const longitude = Number(suggestion.lon);

    setValue(suggestion.display_name);
    setSuggestions([]);
    setHasSelectedSuggestion(true);
    onLocationSelect({
      address: suggestion.display_name,
      latitude: Number.isFinite(latitude) ? latitude : 0,
      longitude: Number.isFinite(longitude) ? longitude : 0,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setValue(nextValue);
    setHasSelectedSuggestion(false);

    if (!nextValue) {
      onLocationSelect({ address: '', latitude: 0, longitude: 0 });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        event.target instanceof Node &&
        !inputRef.current.contains(event.target)
      ) {
        setSuggestions([]);
      }
    };

    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5 relative">
      <label className="block text-sm font-medium text-foreground">
        <MapPin className="inline w-4 h-4 mr-1" />
        Store Address
      </label>
      <input
        ref={inputRef}
        type="text"
        placeholder="Enter your store address"
        value={value}
        onChange={handleChange}
        className={`w-full px-3 py-2 bg-background border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all ${
          error ? 'border-destructive' : 'border-input'
        }`}
      />
      {isLoading && (
        <Loader2 className="absolute right-3 top-[38px] h-4 w-4 animate-spin text-muted-foreground" />
      )}
      {suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <li
              key={`${suggestion.lat}-${suggestion.lon}`}
              className="px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              {suggestion.display_name}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Start typing your address to search. Drag the map marker to fine-tune the location.
      </p>
    </div>
  );
}
