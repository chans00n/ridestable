import React, { useEffect, useRef, useState } from 'react';
import { getGoogleMapsLoader } from '@/services/googleMapsLoader';
import { format } from 'date-fns';
import { Calendar, MapPin, DollarSign, User, X } from 'lucide-react';

interface BookingPin {
  id: string;
  lat: number;
  lng: number;
  type: 'pickup' | 'dropoff';
  status: string;
  scheduledDateTime: string;
  address: string;
  amount: number;
  customerName: string;
  bookingReference?: string;
}

interface DashboardMapProps {
  bookings: any[];
  height?: string;
  className?: string;
}

export const DashboardMap: React.FC<DashboardMapProps> = ({ 
  bookings, 
  height = '500px',
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('light');

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setMapTheme(isDark ? 'dark' : 'light');
    };

    checkDarkMode();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const loader = getGoogleMapsLoader();
    
    loader.load().then(() => {
      if (!mapRef.current) return;

      // Check current theme
      const isDark = document.documentElement.classList.contains('dark');
      
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 36.1699, lng: -115.1398 }, // Las Vegas
        zoom: 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: isDark ? getDarkMapStyles() : []
      });

      mapInstanceRef.current = map;
    });
  }, []);

  // Update map theme
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setOptions({
        styles: mapTheme === 'dark' ? getDarkMapStyles() : []
      });
    }
  }, [mapTheme]);

  // Update markers when bookings change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    const pins: BookingPin[] = [];

    // Process bookings to create pins
    bookings.forEach(booking => {
      // Skip if no coordinates
      if (!booking.pickupCoordinates?.lat || !booking.dropoffCoordinates?.lat) return;

      // Add pickup pin
      pins.push({
        id: booking.id,
        lat: booking.pickupCoordinates.lat,
        lng: booking.pickupCoordinates.lng,
        type: 'pickup',
        status: booking.status,
        scheduledDateTime: booking.scheduledDateTime,
        address: booking.pickupAddress,
        amount: booking.totalAmount,
        customerName: `${booking.user.firstName} ${booking.user.lastName}`,
        bookingReference: booking.confirmation?.bookingReference
      });

      // Add dropoff pin
      pins.push({
        id: booking.id,
        lat: booking.dropoffCoordinates.lat,
        lng: booking.dropoffCoordinates.lng,
        type: 'dropoff',
        status: booking.status,
        scheduledDateTime: booking.scheduledDateTime,
        address: booking.dropoffAddress,
        amount: booking.totalAmount,
        customerName: `${booking.user.firstName} ${booking.user.lastName}`,
        bookingReference: booking.confirmation?.bookingReference
      });
    });

    // Create markers
    pins.forEach(pin => {
      const isUpcoming = new Date(pin.scheduledDateTime) > new Date();
      const isPending = pin.status === 'PENDING';
      const isCompleted = pin.status === 'COMPLETED';
      const isCancelled = pin.status === 'CANCELLED';

      let color = '#6B7280'; // Default gray
      if (isCancelled) color = '#EF4444'; // Red
      else if (isCompleted) color = '#10B981'; // Green
      else if (isPending) color = '#F59E0B'; // Yellow
      else if (isUpcoming) color = '#3B82F6'; // Blue

      const marker = new google.maps.Marker({
        position: { lat: pin.lat, lng: pin.lng },
        map: mapInstanceRef.current,
        title: `${pin.type === 'pickup' ? 'Pickup' : 'Dropoff'} - ${pin.bookingReference || pin.id}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: pin.type === 'pickup' ? 1 : 0.6,
          strokeColor: mapTheme === 'dark' ? '#ffffff' : '#000000',
          strokeWeight: 2,
          scale: 8,
        },
        label: {
          text: pin.type === 'pickup' ? 'P' : 'D',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 'bold',
        },
      });

      // Add click handler
      marker.addListener('click', () => {
        const booking = bookings.find(b => b.id === pin.id);
        if (booking) {
          setSelectedBooking({
            ...booking,
            selectedType: pin.type,
            selectedAddress: pin.address
          });
        }
      });

      markersRef.current.push(marker);
      bounds.extend(marker.getPosition()!);
    });

    // Fit map to show all markers
    if (pins.length > 0) {
      mapInstanceRef.current.fitBounds(bounds);
      
      // Don't zoom in too much
      const listener = google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
        if (mapInstanceRef.current!.getZoom()! > 14) {
          mapInstanceRef.current!.setZoom(14);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [bookings, mapTheme]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getDarkMapStyles = () => [
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
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }]
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

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted/20 dark:bg-zinc-900/50 rounded-lg ${className}`}
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">Map unavailable - API key missing</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full rounded-lg shadow-sm" style={{ height }} />
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-card dark:bg-zinc-900 border border-border rounded-lg shadow-md p-3 text-xs">
        <h4 className="font-medium text-foreground mb-2">Trip Status</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-muted-foreground">Upcoming</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-muted-foreground">Cancelled</span>
          </div>
        </div>
      </div>

      {/* Selected Booking Info */}
      {selectedBooking && (
        <div className="absolute bottom-4 left-4 right-4 max-w-md bg-card dark:bg-zinc-900 border border-border rounded-lg shadow-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-foreground">
              {selectedBooking.confirmation?.bookingReference || `Booking ${selectedBooking.id.slice(0, 8)}`}
            </h3>
            <button
              onClick={() => setSelectedBooking(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-muted-foreground">
              <User className="h-4 w-4 mr-2" />
              {selectedBooking.user.firstName} {selectedBooking.user.lastName}
            </div>
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              {format(new Date(selectedBooking.scheduledDateTime), 'MMM d, yyyy h:mm a')}
            </div>
            <div className="flex items-center text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2" />
              {selectedBooking.selectedType === 'pickup' ? 'Pickup' : 'Dropoff'}: {selectedBooking.selectedAddress}
            </div>
            <div className="flex items-center text-muted-foreground">
              <DollarSign className="h-4 w-4 mr-2" />
              {formatCurrency(selectedBooking.totalAmount)}
            </div>
          </div>
          
          <div className={`mt-3 inline-flex px-2 py-1 rounded text-xs font-medium ${
            selectedBooking.status === 'COMPLETED' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
            selectedBooking.status === 'CANCELLED' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
            selectedBooking.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
            'bg-blue-500/10 text-blue-600 dark:text-blue-400'
          }`}>
            {selectedBooking.status}
          </div>
        </div>
      )}
    </div>
  );
};