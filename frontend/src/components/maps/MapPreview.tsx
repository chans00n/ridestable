import React, { useEffect, useRef } from 'react';
import { getGoogleMapsLoader } from '../../services/googleMapsLoader';
import type { BookingLocation } from '../../types/booking-types';

interface MapPreviewProps {
  pickup?: BookingLocation;
  dropoff?: BookingLocation;
  height?: string;
  className?: string;
}

export const MapPreview: React.FC<MapPreviewProps> = ({ 
  pickup, 
  dropoff, 
  height = '300px',
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<{
    pickup?: google.maps.Marker;
    dropoff?: google.maps.Marker;
  }>({});
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const loader = getGoogleMapsLoader();
    
    loader.load().then(() => {
      if (!mapRef.current) return;

      // Initialize map centered on Las Vegas
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 36.1699, lng: -115.1398 },
        zoom: 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      mapInstanceRef.current = map;
      directionsServiceRef.current = new google.maps.DirectionsService();
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#0080ff',
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      });
    });
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    if (markersRef.current.pickup) {
      markersRef.current.pickup.setMap(null);
    }
    if (markersRef.current.dropoff) {
      markersRef.current.dropoff.setMap(null);
    }

    // Clear directions
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
    }

    const bounds = new google.maps.LatLngBounds();
    
    // Add pickup marker
    if (pickup && pickup.lat && pickup.lng) {
      const pickupMarker = new google.maps.Marker({
        position: { lat: pickup.lat, lng: pickup.lng },
        map: mapInstanceRef.current,
        title: 'Pickup Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          scale: 10,
        },
        label: {
          text: 'P',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 'bold',
        },
      });
      
      markersRef.current.pickup = pickupMarker;
      bounds.extend(pickupMarker.getPosition()!);

      // Create info window for pickup
      const pickupInfo = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <p class="font-semibold text-sm">Pickup Location</p>
            <p class="text-xs text-gray-600">${pickup.address}</p>
          </div>
        `,
      });

      pickupMarker.addListener('click', () => {
        pickupInfo.open(mapInstanceRef.current!, pickupMarker);
      });
    }

    // Add dropoff marker
    if (dropoff && dropoff.lat && dropoff.lng) {
      const dropoffMarker = new google.maps.Marker({
        position: { lat: dropoff.lat, lng: dropoff.lng },
        map: mapInstanceRef.current,
        title: 'Dropoff Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          scale: 10,
        },
        label: {
          text: 'D',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 'bold',
        },
      });
      
      markersRef.current.dropoff = dropoffMarker;
      bounds.extend(dropoffMarker.getPosition()!);

      // Create info window for dropoff
      const dropoffInfo = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <p class="font-semibold text-sm">Dropoff Location</p>
            <p class="text-xs text-gray-600">${dropoff.address}</p>
          </div>
        `,
      });

      dropoffMarker.addListener('click', () => {
        dropoffInfo.open(mapInstanceRef.current!, dropoffMarker);
      });
    }

    // Draw route if both locations exist
    if (pickup?.lat && pickup?.lng && dropoff?.lat && dropoff?.lng && 
        directionsServiceRef.current && directionsRendererRef.current) {
      const request: google.maps.DirectionsRequest = {
        origin: { lat: pickup.lat, lng: pickup.lng },
        destination: { lat: dropoff.lat, lng: dropoff.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      };

      directionsServiceRef.current.route(request, (result, status) => {
        if (status === 'OK' && result && directionsRendererRef.current) {
          directionsRendererRef.current.setDirections(result);
        }
      });
    } else if ((pickup?.lat && pickup?.lng) || (dropoff?.lat && dropoff?.lng)) {
      // Fit bounds to show all markers
      mapInstanceRef.current.fitBounds(bounds);
      
      // Don't zoom in too much for single marker
      const listener = google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
        if (mapInstanceRef.current!.getZoom()! > 16) {
          mapInstanceRef.current!.setZoom(16);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [pickup, dropoff]);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted/20 dark:bg-zinc-900/50 rounded-lg ${className}`}
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">Map preview unavailable</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full rounded-lg" style={{ height }} />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card dark:bg-zinc-900 border border-border rounded-lg shadow-md p-3 text-xs">
        <div className="flex items-center space-x-4">
          {pickup && (
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold" style={{ fontSize: '10px' }}>P</span>
              </div>
              <span className="text-muted-foreground">Pickup</span>
            </div>
          )}
          {dropoff && (
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold" style={{ fontSize: '10px' }}>D</span>
              </div>
              <span className="text-muted-foreground">Dropoff</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};