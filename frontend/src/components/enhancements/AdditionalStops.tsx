import React from 'react';
import { Plus, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import type { AdditionalStop } from '@stable-ride/shared';

interface AdditionalStopsProps {
  stops: AdditionalStop[];
  onChange: (stops: AdditionalStop[]) => void;
  maxStops?: number;
}

export const AdditionalStops: React.FC<AdditionalStopsProps> = ({
  stops = [],
  onChange,
  maxStops = 3
}) => {
  const addStop = () => {
    if (stops.length < maxStops) {
      onChange([...stops, { address: '', duration: 10, purpose: '' }]);
    }
  };

  const removeStop = (index: number) => {
    onChange(stops.filter((_, i) => i !== index));
  };

  const updateStop = (index: number, field: keyof AdditionalStop, value: string | number) => {
    const updatedStops = stops.map((stop, i) => {
      if (i === index) {
        return { ...stop, [field]: value };
      }
      return stop;
    });
    onChange(updatedStops);
  };

  const getTotalStopTime = () => {
    return stops.reduce((total, stop) => total + stop.duration, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">Additional Stops</h3>
          <p className="text-sm text-muted-foreground">
            Add up to {maxStops} stops along your route ($10 per stop)
          </p>
        </div>
        {stops.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Total stop time: {getTotalStopTime()} minutes
          </div>
        )}
      </div>

      <div className="space-y-4">
        {stops.map((stop, index) => (
          <div key={index} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h4 className="text-sm font-medium text-foreground">Stop {index + 1}</h4>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeStop(index)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor={`stop-address-${index}`}>Address</Label>
                <Input
                  id={`stop-address-${index}`}
                  type="text"
                  value={stop.address}
                  onChange={(e) => updateStop(index, 'address', e.target.value)}
                  placeholder="Enter stop address"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`stop-duration-${index}`}>Duration (minutes)</Label>
                  <Input
                    id={`stop-duration-${index}`}
                    type="number"
                    min="5"
                    max="60"
                    value={stop.duration}
                    onChange={(e) => updateStop(index, 'duration', parseInt(e.target.value) || 10)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor={`stop-purpose-${index}`}>Purpose (optional)</Label>
                  <Input
                    id={`stop-purpose-${index}`}
                    type="text"
                    value={stop.purpose || ''}
                    onChange={(e) => updateStop(index, 'purpose', e.target.value)}
                    placeholder="e.g., Pick up package"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {stops.length < maxStops && (
          <Button
            type="button"
            variant="outline"
            onClick={addStop}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Stop
          </Button>
        )}
      </div>

      {stops.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Each additional stop adds $10 to your fare. The driver will wait for the specified duration at each stop.
          </p>
        </div>
      )}
    </div>
  );
};