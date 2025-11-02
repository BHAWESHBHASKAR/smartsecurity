'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
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
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not found. Using manual input.');
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    });

    loader.load().then(() => {
      setIsLoaded(true);
      initializeMap();
    }).catch((error) => {
      console.error('Error loading Google Maps:', error);
    });
  }, []);

  const initializeMap = () => {
    if (!mapRef.current) return;

    // Default to New York
    const defaultLocation = { lat: 40.7128, lng: -74.0060 };

    const newMap = new google.maps.Map(mapRef.current, {
      center: defaultLocation,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
    });

    const newMarker = new google.maps.Marker({
      map: newMap,
      position: defaultLocation,
      draggable: true,
    });

    // Handle marker drag
    newMarker.addListener('dragend', () => {
      const position = newMarker.getPosition();
      if (position) {
        reverseGeocode(position.lat(), position.lng());
      }
    });

    setMap(newMap);
    setMarker(newMarker);

    // Initialize autocomplete
    if (inputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (place.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || '';

          newMap.setCenter({ lat, lng });
          newMarker.setPosition({ lat, lng });

          onLocationSelect({ address, latitude: lat, longitude: lng });
        }
      });
    }
  };

  const reverseGeocode = (lat: number, lng: number) => {
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const address = results[0].formatted_address;
        if (inputRef.current) {
          inputRef.current.value = address;
        }
        onLocationSelect({ address, latitude: lat, longitude: lng });
      }
    });
  };

  // Fallback for when Google Maps is not available
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">
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
          Google Maps API key not configured. Using manual address input.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        <MapPin className="inline w-4 h-4 mr-1" />
        Store Location
      </label>
      
      {/* Address Input with Autocomplete */}
      <input
        ref={inputRef}
        type="text"
        placeholder="Search for your store address..."
        defaultValue={initialAddress}
        className={`w-full px-3 py-2 bg-background border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all ${
          error ? 'border-destructive' : 'border-input'
        }`}
      />
      
      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Map */}
      <div
        ref={mapRef}
        className="w-full h-64 rounded-md border border-border overflow-hidden"
      />
      
      <p className="text-xs text-muted-foreground">
        Search for an address or drag the marker to set your store location
      </p>
    </div>
  );
}
