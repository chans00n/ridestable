import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { getGoogleMapsLoader } from '../../services/googleMapsLoader';
import type { BookingLocation } from '../../types/booking-types';
import { showToast } from '../ui/Toast';
import { api } from '../../services/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';

interface LocationInputProps {
  value?: BookingLocation;
  onChange: (location: BookingLocation) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  onBlur?: () => void;
}

export const LocationInput = forwardRef<HTMLInputElement, LocationInputProps>(({
  value,
  onChange,
  placeholder = 'Enter address',
  label,
  error,
  required = false,
  onBlur,
}, forwardedRef) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(value?.address || '');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Expose input element to parent via ref if needed
  useImperativeHandle(forwardedRef, () => inputRef.current!, []);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    let mounted = true;
    
    const initAutocomplete = async () => {
      if (!inputRef.current || autocompleteRef.current) return;

      try {
        const loader = getGoogleMapsLoader();
        await loader.load();
        
        if (!mounted) return;
        
        if (!inputRef.current) {
          console.error('LocationInput: No input element found');
          return;
        }

        console.log('LocationInput: Initializing Google Places Autocomplete');
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['place_id', 'formatted_address', 'geometry', 'address_components'],
      });

      autocomplete.addListener('place_changed', () => {
        console.log('LocationInput: Place changed event fired');
        const place = autocomplete.getPlace();
        console.log('LocationInput: Selected place:', place);
        
        if (!place.geometry?.location) {
          showToast.error('Please select a valid address from the dropdown');
          return;
        }

        const location: BookingLocation = {
          address: place.formatted_address || '',
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          placeId: place.place_id,
        };

        console.log('LocationInput: Setting location:', location);
        setInputValue(location.address);
        
        // Check if location is in Las Vegas area (rough check)
        const isInServiceArea = checkServiceArea(location.lat, location.lng);
        if (!isInServiceArea) {
          showToast.warning('This location may be outside our service area (Las Vegas region)');
        }
        
        onChange(location);
      });

        autocompleteRef.current = autocomplete;
        console.log('LocationInput: Autocomplete initialized successfully');
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        showToast.error('Failed to load address autocomplete');
      }
    };

    initAutocomplete();

    return () => {
      mounted = false;
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value?.address || '');
  }, [value?.address]);

  // Use current location
  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLoadingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get address
          const response = await api.post('/locations/reverse', {
            lat: latitude,
            lng: longitude,
          });

          const location: BookingLocation = {
            address: response.data.location.address,
            lat: latitude,
            lng: longitude,
            placeId: response.data.location.placeId,
          };

          // Check if location is in service area
          const isInServiceArea = checkServiceArea(latitude, longitude);
          if (!isInServiceArea) {
            showToast.warning('Your current location is outside our service area (Las Vegas region)');
          }

          setInputValue(location.address);
          onChange(location);
        } catch (error) {
          showToast.error('Failed to get your current location');
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        setIsLoadingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            showToast.error('Location permission denied');
            break;
          case error.POSITION_UNAVAILABLE:
            showToast.error('Location information unavailable');
            break;
          case error.TIMEOUT:
            showToast.error('Location request timed out');
            break;
          default:
            showToast.error('An unknown error occurred');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onChange]);

  // Check if location is within Las Vegas service area (75 mile radius)
  const checkServiceArea = (lat: number, lng: number): boolean => {
    const centerLat = 36.1699;
    const centerLng = -115.1398;
    const R = 3959; // Earth's radius in miles
    
    const dLat = (lat - centerLat) * Math.PI / 180;
    const dLng = (lng - centerLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(centerLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance <= 75;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Clear the location data when user types manually
    if (value?.address !== e.target.value) {
      onChange({ address: e.target.value, lat: 0, lng: 0 });
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={inputRef.current?.id || 'location-input'}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          ref={inputRef}
          id="location-input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`pr-10 ${error ? 'border-destructive' : ''}`}
        />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={useCurrentLocation}
          disabled={isLoadingLocation}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
          title="Use current location"
        >
          {isLoadingLocation ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          ) : (
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
          )}
        </Button>
        
        {error && (
          <p className="mt-1 text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
});

LocationInput.displayName = 'LocationInput';