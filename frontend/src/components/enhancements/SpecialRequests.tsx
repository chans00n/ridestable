import React from 'react';
import { 
  Baby,
  Thermometer,
  Music,
  Coffee,
  Briefcase,
  Wifi,
  VolumeX,
  Phone
} from 'lucide-react';
import type { SpecialRequests } from '@stable-ride/shared';
import { AdditionalStops } from './AdditionalStops';

interface SpecialRequestsProps {
  requests: SpecialRequests;
  onChange: (requests: SpecialRequests) => void;
}

export const SpecialRequests: React.FC<SpecialRequestsProps> = ({
  requests,
  onChange
}) => {
  const handleChildSeatChange = (type: 'infantSeat' | 'toddlerSeat' | 'boosterSeat', value: number) => {
    onChange({
      ...requests,
      childSafety: {
        ...requests.childSafety,
        [type]: value
      }
    });
  };

  const handleCustomRequestChange = (field: keyof SpecialRequests['customRequests'], value: any) => {
    onChange({
      ...requests,
      customRequests: {
        ...requests.customRequests,
        [field]: value
      }
    });
  };

  const handleBusinessNeedChange = (field: keyof SpecialRequests['businessNeeds'], value: boolean) => {
    onChange({
      ...requests,
      businessNeeds: {
        ...requests.businessNeeds,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-foreground">Special Requests & Preferences</h3>

      {/* Child Safety Seats */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Baby className="h-5 w-5 text-primary" />
          <h4 className="text-base font-medium text-foreground">Child Safety Seats</h4>
          <span className="text-sm text-muted-foreground">($15 per seat)</span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Infant Seat</label>
              <p className="text-xs text-muted-foreground">0-12 months, rear-facing</p>
            </div>
            <input
              type="number"
              min="0"
              max="3"
              value={requests.childSafety.infantSeat}
              onChange={(e) => handleChildSeatChange('infantSeat', parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 border border-input bg-background rounded-md focus:ring-ring focus:border-input text-foreground"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Toddler Seat</label>
              <p className="text-xs text-muted-foreground">1-3 years, forward-facing</p>
            </div>
            <input
              type="number"
              min="0"
              max="3"
              value={requests.childSafety.toddlerSeat}
              onChange={(e) => handleChildSeatChange('toddlerSeat', parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 border border-input bg-background rounded-md focus:ring-ring focus:border-input text-foreground"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Booster Seat</label>
              <p className="text-xs text-muted-foreground">4-8 years</p>
            </div>
            <input
              type="number"
              min="0"
              max="3"
              value={requests.childSafety.boosterSeat}
              onChange={(e) => handleChildSeatChange('boosterSeat', parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 border border-input bg-background rounded-md focus:ring-ring focus:border-input text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Comfort Preferences */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h4 className="text-base font-medium text-foreground mb-4">Comfort Preferences</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Thermometer className="inline h-4 w-4 mr-1" />
              Temperature
            </label>
            <select
              value={requests.customRequests.temperature || 'comfortable'}
              onChange={(e) => handleCustomRequestChange('temperature', e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md focus:ring-ring focus:border-input text-foreground"
            >
              <option value="cool">Cool</option>
              <option value="comfortable">Comfortable</option>
              <option value="warm">Warm</option>
            </select>
          </div>

          {/* Music */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Music className="inline h-4 w-4 mr-1" />
              Music Preference
            </label>
            <select
              value={requests.customRequests.music || 'soft'}
              onChange={(e) => handleCustomRequestChange('music', e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md focus:ring-ring focus:border-input text-foreground"
            >
              <option value="none">No music</option>
              <option value="soft">Soft background music</option>
              <option value="customer_playlist">I'll provide playlist</option>
            </select>
          </div>

          {/* Refreshments */}
          <div className="md:col-span-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requests.customRequests.refreshments || false}
                onChange={(e) => handleCustomRequestChange('refreshments', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-ring border-border rounded"
              />
              <Coffee className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Complimentary water bottles requested</span>
            </label>
          </div>
        </div>
      </div>

      {/* Business Traveler Options */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h4 className="text-base font-medium text-foreground mb-4">
          <Briefcase className="inline h-5 w-5 mr-2 text-primary" />
          Business Traveler Options
        </h4>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={requests.businessNeeds.wifiRequired || false}
              onChange={(e) => handleBusinessNeedChange('wifiRequired', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Wifi className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">WiFi hotspot required</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={requests.businessNeeds.quietRide || false}
              onChange={(e) => handleBusinessNeedChange('quietRide', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <VolumeX className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Quiet ride (no phone calls from driver)</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={requests.businessNeeds.phoneConference || false}
              onChange={(e) => handleBusinessNeedChange('phoneConference', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">May take phone calls during ride</span>
          </label>
        </div>
      </div>

      {/* Additional Stops */}
      <div className="bg-card rounded-lg border border-border p-4">
        <AdditionalStops
          stops={requests.customRequests.stops || []}
          onChange={(stops) => handleCustomRequestChange('stops', stops)}
          maxStops={3}
        />
      </div>

      {/* Special Instructions */}
      <div className="bg-card rounded-lg border border-border p-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Additional Instructions
        </label>
        <textarea
          value={requests.customRequests.specialInstructions || ''}
          onChange={(e) => handleCustomRequestChange('specialInstructions', e.target.value)}
          placeholder="Any other special requests or instructions for your driver..."
          rows={3}
          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:ring-ring focus:border-input text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
};