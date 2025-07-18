import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { getGoogleMapsLoader } from '../../services/googleMapsLoader';

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
  const { theme } = useTheme();

  useEffect(() => {
    let mounted = true;
    
    // Load Google Maps script
    const loader = getGoogleMapsLoader();
    loader.load()
      .then(() => {
        if (mounted) {
          initializeMap();
        }
      })
      .catch((error) => {
        if (mounted) {
          console.error('Failed to load Google Maps:', error);
          setError('Failed to load Google Maps');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      // Cleanup
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  // Update map styles when theme changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setOptions({
        styles: getMapStyles()
      });
    }
  }, [theme]);

  const getMapStyles = () => {
    const darkModeStyles = [
      { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
      {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }]
      },
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#263c3f' }]
      },
      {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#6b9a76' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#38414e' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#212a37' }]
      },
      {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca5b3' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#746855' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#1f2835' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#f3d19c' }]
      },
      {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{ color: '#2f3948' }]
      },
      {
        featureType: 'transit.station',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#17263c' }]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#515c6d' }]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#17263c' }]
      }
    ];

    const lightModeStyles = [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ];

    return theme === 'dark' ? darkModeStyles : lightModeStyles;
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google?.maps) {
      console.error('Google Maps not loaded or map ref not available');
      setError('Failed to initialize map');
      setLoading(false);
      return;
    }

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
            styles: getMapStyles()
          });

          mapInstanceRef.current = map;

          // Add marker for current location
          // Using legacy Marker for now as AdvancedMarkerElement requires additional setup
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
          // Only log actual errors, not expected unavailable positions
          if (error.code !== error.POSITION_UNAVAILABLE) {
            console.warn('Geolocation error:', error);
          }
          
          // Different error messages based on error code
          let errorMessage = 'Unable to get your location';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          
          setError(errorMessage);
          setLoading(false);
          
          // Fall back to a default location (e.g., city center)
          const defaultLocation = { lat: 36.1699, lng: -115.1398 }; // Las Vegas, NV
          
          const map = new google.maps.Map(mapRef.current!, {
            center: defaultLocation,
            zoom: 12,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: getMapStyles()
          });

          mapInstanceRef.current = map;
          
          // Add a marker for the default location
          new google.maps.Marker({
            position: defaultLocation,
            map: map,
            title: 'Default location (Las Vegas)',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#6B7280',
              fillOpacity: 0.7,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }
          });
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