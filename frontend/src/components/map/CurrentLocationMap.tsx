import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface CurrentLocationMapProps {
  height?: string;
  onLocationChange?: (lat: number, lng: number) => void;
}

export const CurrentLocationMap: React.FC<CurrentLocationMapProps> = ({ 
  height = '12rem',
  onLocationChange 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    // Load Google Maps script
    if (!window.google?.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initializeMap();
      script.onerror = () => setError('Failed to load Google Maps');
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      // Cleanup
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google?.maps) return;

    // Get user's current location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Initialize map
          const map = new google.maps.Map(mapRef.current!, {
            center: { lat: latitude, lng: longitude },
            zoom: 15,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          });

          mapInstanceRef.current = map;

          // Add marker for current location
          const marker = new google.maps.Marker({
            position: { lat: latitude, lng: longitude },
            map: map,
            title: 'Your location',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4F46E5',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }
          });

          markerRef.current = marker;

          // Add accuracy circle
          new google.maps.Circle({
            map: map,
            center: { lat: latitude, lng: longitude },
            radius: position.coords.accuracy,
            fillColor: '#4F46E5',
            fillOpacity: 0.1,
            strokeColor: '#4F46E5',
            strokeOpacity: 0.3,
            strokeWeight: 1,
          });

          setLoading(false);
          onLocationChange?.(latitude, longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError('Unable to get your location');
          setLoading(false);
          
          // Fall back to a default location (e.g., city center)
          const defaultLocation = { lat: 40.7128, lng: -74.0060 }; // NYC
          
          const map = new google.maps.Map(mapRef.current!, {
            center: defaultLocation,
            zoom: 12,
            disableDefaultUI: true,
            zoomControl: true,
          });

          mapInstanceRef.current = map;
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full rounded-lg overflow-hidden" style={{ height }}>
      {loading && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
};