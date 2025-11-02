'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  onMarkerDragEnd: (lat: number, lng: number) => void;
  className?: string;
}

export default function LeafletMap({
  center,
  zoom = 13,
  onMarkerDragEnd,
  className = '',
}: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Wait for next tick to ensure container is fully rendered
    const initMap = () => {
      if (!containerRef.current) return;

      // Fix default icon
      const DefaultIcon = L.icon({
        iconUrl: icon.src,
        shadowUrl: iconShadow.src,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      // Initialize map
      const map = L.map(containerRef.current, {
        preferCanvas: true,
      }).setView(center, zoom);
      mapRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add draggable marker
      const marker = L.marker(center, {
        draggable: true,
        icon: DefaultIcon,
      }).addTo(map);
      markerRef.current = marker;

      // Handle marker drag
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        onMarkerDragEnd(position.lat, position.lng);
      });

      // Wait for tiles to load before invalidating size
      map.whenReady(() => {
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }, 200);
      });
    };

    // Delay initialization to ensure DOM is ready
    const timer = setTimeout(initMap, 100);

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map center and marker when center prop changes
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      mapRef.current.setView(center, zoom);
      markerRef.current.setLatLng(center);
    }
  }, [center, zoom]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full rounded-lg overflow-hidden ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
}
