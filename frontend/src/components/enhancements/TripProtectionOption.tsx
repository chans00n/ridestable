import React from 'react';
import { InformationCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface TripProtectionOptionProps {
  enabled: boolean;
  cost: number;
  onChange: (enabled: boolean) => void;
}

export const TripProtectionOption: React.FC<TripProtectionOptionProps> = ({
  enabled,
  cost,
  onChange
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="trip-protection"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 text-primary focus:ring-ring border-border rounded"
        />
        <div className="flex-1">
          <label htmlFor="trip-protection" className="cursor-pointer">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="h-5 w-5 text-primary" />
              <h3 className="text-base font-medium text-foreground">
                Trip Protection
              </h3>
              <span className="text-sm font-medium text-primary">
                +${cost.toFixed(2)}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Cancel for any reason up to 1 hour before pickup and receive a full refund
            </p>
          </label>
          
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="mt-2 text-sm text-primary hover:text-primary/80 flex items-center space-x-1"
          >
            <InformationCircleIcon className="h-4 w-4" />
            <span>{showDetails ? 'Hide' : 'Show'} details</span>
          </button>

          {showDetails && (
            <div className="mt-3 p-3 bg-muted rounded-md text-sm text-foreground">
              <h4 className="font-medium mb-2">Coverage includes:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>100% refund if cancelled 1+ hours before pickup</li>
                <li>50% refund if cancelled 30-60 minutes before pickup</li>
                <li>Coverage for illness, emergencies, or change of plans</li>
                <li>No questions asked cancellation policy</li>
                <li>Instant refund processing</li>
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                * Trip protection must be purchased at time of booking. Standard cancellation 
                policies apply without trip protection.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};