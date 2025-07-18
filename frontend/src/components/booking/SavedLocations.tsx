import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { BookingLocation } from '../../types/booking-types';
import { showToast } from '../ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface SavedLocation extends BookingLocation {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface SavedLocationsProps {
  onSelectLocation: (location: BookingLocation) => void;
  currentLocation?: BookingLocation;
}

export const SavedLocations: React.FC<SavedLocationsProps> = ({ 
  onSelectLocation, 
  currentLocation 
}) => {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/dashboard/locations');
      const locations = response.data.data.items.map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        lat: loc.latitude ? parseFloat(loc.latitude.toString()) : undefined,
        lng: loc.longitude ? parseFloat(loc.longitude.toString()) : undefined,
        type: loc.locationType,
        userId: loc.userId,
        createdAt: loc.createdAt,
        updatedAt: loc.updatedAt
      }));
      setLocations(locations);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrentLocation = async () => {
    if (!currentLocation || !currentLocation.lat || !currentLocation.lng) {
      showToast.error('Please select a valid location first');
      return;
    }

    const name = prompt('Name this location (e.g., "Mom\'s House", "Office")');
    if (!name) return;

    try {
      const response = await api.post('/dashboard/locations', {
        address: currentLocation.address,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        name,
        locationType: name.toLowerCase() === 'home' ? 'home' : 
                      name.toLowerCase() === 'work' ? 'work' : 'other'
      });

      await fetchLocations(); // Refetch to get the updated list
      showToast.success('Location saved successfully!');
    } catch (error: any) {
      console.error('Save location error:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to save location';
      showToast.error(message);
    }
  };

  const handleUpdateName = async (id: string) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const response = await api.put(`/dashboard/locations/${id}`, {
        name: editName,
      });
      
      setLocations(locations.map(loc => 
        loc.id === id ? { ...loc, name: editName } : loc
      ));
      setEditingId(null);
      showToast.success('Location updated');
    } catch (error) {
      showToast.error('Failed to update location');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      await api.delete(`/dashboard/locations/${id}`);
      setLocations(locations.filter(loc => loc.id !== id));
      showToast.success('Location deleted');
    } catch (error) {
      showToast.error('Failed to delete location');
    }
  };

  const getLocationIcon = (type?: string) => {
    switch (type) {
      case 'home': return '🏠';
      case 'work': return '💼';
      case 'other': return '📍';
      default: return '📍';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Saved Locations</h3>
        {currentLocation && (
          <button
            onClick={handleSaveCurrentLocation}
            className="text-xs text-primary hover:text-primary/80 font-medium"
          >
            + Save Current
          </button>
        )}
      </div>

      {locations.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No saved locations yet
        </p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <AnimatePresence>
            {locations.map((location) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="group relative bg-muted hover:bg-muted/80 rounded-lg p-3 cursor-pointer transition-colors"
              >
                <div 
                  className="flex items-start space-x-3"
                  onClick={() => onSelectLocation(location)}
                >
                  <span className="text-xl mt-0.5">
                    {getLocationIcon(location.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    {editingId === location.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleUpdateName(location.id)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateName(location.id);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-medium text-foreground bg-background border border-border rounded px-2 py-1 w-full"
                        autoFocus
                      />
                    ) : (
                      <p className="text-sm font-medium text-foreground truncate">
                        {location.name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">
                      {location.address}
                    </p>
                  </div>
                </div>

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(location.id);
                      setEditName(location.name || '');
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    title="Edit name"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(location.id);
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                      />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};