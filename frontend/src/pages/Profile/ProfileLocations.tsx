import React, { useState, useEffect } from 'react';
import { 
  MapPinIcon, 
  HomeIcon, 
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import { showToast } from '../../components/ui/Toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SavedLocation {
  id: string;
  name: string;
  address: string;
  latitude?: number | string;
  longitude?: number | string;
  isDefault: boolean;
}

export const ProfileLocations: React.FC = () => {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<SavedLocation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    isDefault: false
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations/user');
      setLocations(response.data.locations || []);
    } catch (error) {
      showToast.error('Failed to load saved locations');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingLocation) {
        await api.put(`/locations/user/${editingLocation.id}`, { name: formData.name });
        showToast.success('Location updated successfully');
      } else {
        // For new locations, we need to geocode the address first
        const geocodeResponse = await api.post('/locations/geocode', { address: formData.address });
        const locationData = geocodeResponse.data.location;
        
        await api.post('/locations/user', {
          name: formData.name,
          address: locationData.address,
          lat: locationData.lat,
          lng: locationData.lng,
          placeId: locationData.placeId
        });
        showToast.success('Location added successfully');
      }
      
      await fetchLocations();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving location:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to save location';
      showToast.error(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    
    try {
      await api.delete(`/locations/user/${id}`);
      showToast.success('Location deleted successfully');
      await fetchLocations();
    } catch (error) {
      showToast.error('Failed to delete location');
    }
  };

  const handleEdit = (location: SavedLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      isDefault: location.isDefault
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingLocation(null);
    setFormData({
      name: '',
      address: '',
      isDefault: false
    });
  };

  const getLocationIcon = (name: string) => {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes('home')) {
      return HomeIcon;
    } else if (lowercaseName.includes('work') || lowercaseName.includes('office')) {
      return BuildingOfficeIcon;
    }
    return MapPinIcon;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Saved Locations</h2>
        <Button 
          onClick={() => setShowAddModal(true)}
          size="sm"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {locations.length === 0 ? (
        <div className="text-center py-12">
          <MapPinIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No saved locations yet</p>
          <Button
            variant="link"
            onClick={() => setShowAddModal(true)}
            className="mt-4"
          >
            Add your first location
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {locations.map((location) => {
            const Icon = getLocationIcon(location.name);
            return (
              <Card key={location.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{location.name}</h3>
                        {location.isDefault && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{location.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(location)}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(location.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => {
        if (!open) {
          handleCloseModal();
        } else {
          setShowAddModal(true);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </DialogTitle>
            <DialogDescription>
              {editingLocation 
                ? 'Update your saved location details.' 
                : 'Add a new location for quick access during booking.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Location Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Home, Office, Gym"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                disabled={!!editingLocation}
                placeholder="Enter full address"
              />
            </div>


            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => 
                  setFormData({ ...formData, isDefault: e.target.checked })
                }
              />
              <Label 
                htmlFor="isDefault" 
                className="text-sm font-normal cursor-pointer"
              >
                Set as default location
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingLocation ? 'Update' : 'Add'} Location
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};