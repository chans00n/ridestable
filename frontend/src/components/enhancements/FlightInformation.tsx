import React from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import type { FlightInformation } from '@stable-ride/shared';

interface FlightInformationProps {
  flightInfo?: FlightInformation;
  onChange: (flightInfo: FlightInformation) => void;
  serviceType: 'pickup' | 'dropoff';
}

const MAJOR_AIRLINES = [
  { code: 'AA', name: 'American Airlines' },
  { code: 'DL', name: 'Delta Air Lines' },
  { code: 'UA', name: 'United Airlines' },
  { code: 'WN', name: 'Southwest Airlines' },
  { code: 'B6', name: 'JetBlue Airways' },
  { code: 'AS', name: 'Alaska Airlines' },
  { code: 'NK', name: 'Spirit Airlines' },
  { code: 'F9', name: 'Frontier Airlines' },
  { code: 'G4', name: 'Allegiant Air' },
  { code: 'SY', name: 'Sun Country Airlines' }
];

export const FlightInformation: React.FC<FlightInformationProps> = ({
  flightInfo,
  onChange,
  serviceType
}) => {
  const [enabled, setEnabled] = React.useState(!!flightInfo);

  const handleFieldChange = (field: keyof FlightInformation, value: string) => {
    onChange({
      ...flightInfo,
      [field]: value
    } as FlightInformation);
  };

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      onChange(undefined as any);
    } else {
      // Initialize with empty flight info
      onChange({
        airline: '',
        flightNumber: '',
        departureAirport: '',
        arrivalAirport: '',
        scheduledArrival: ''
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">Flight Information</h3>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleEnabledChange(e.target.checked)}
            className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
          />
          <span className="text-sm text-foreground">Add flight details</span>
        </label>
      </div>

      {enabled && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center space-x-2 mb-4">
            <PaperAirplaneIcon className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              {serviceType === 'pickup' 
                ? 'We\'ll track your flight and adjust pickup time if needed'
                : 'Help us ensure timely arrival for your departure'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Airline */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Airline
              </label>
              <select
                value={flightInfo?.airline || ''}
                onChange={(e) => handleFieldChange('airline', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:ring-ring focus:border-ring bg-background text-foreground"
                required={enabled}
              >
                <option value="">Select airline</option>
                {MAJOR_AIRLINES.map(airline => (
                  <option key={airline.code} value={airline.code}>
                    {airline.name} ({airline.code})
                  </option>
                ))}
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Flight Number */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Flight Number
              </label>
              <input
                type="text"
                value={flightInfo?.flightNumber || ''}
                onChange={(e) => handleFieldChange('flightNumber', e.target.value.toUpperCase())}
                placeholder="e.g., 123"
                className="w-full px-3 py-2 border border-input rounded-md focus:ring-ring focus:border-ring bg-background text-foreground"
                required={enabled}
              />
            </div>

            {/* Departure Airport */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {serviceType === 'pickup' ? 'Departure Airport' : 'Your Airport'}
              </label>
              <input
                type="text"
                value={flightInfo?.departureAirport || ''}
                onChange={(e) => handleFieldChange('departureAirport', e.target.value.toUpperCase())}
                placeholder="e.g., LAX"
                maxLength={3}
                className="w-full px-3 py-2 border border-input rounded-md focus:ring-ring focus:border-ring bg-background text-foreground"
                required={enabled}
              />
            </div>

            {/* Arrival Airport */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {serviceType === 'pickup' ? 'Arrival Airport (Your location)' : 'Destination Airport'}
              </label>
              <input
                type="text"
                value={flightInfo?.arrivalAirport || ''}
                onChange={(e) => handleFieldChange('arrivalAirport', e.target.value.toUpperCase())}
                placeholder="e.g., JFK"
                maxLength={3}
                className="w-full px-3 py-2 border border-input rounded-md focus:ring-ring focus:border-ring bg-background text-foreground"
                required={enabled}
              />
            </div>

            {/* Terminal */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Terminal (optional)
              </label>
              <input
                type="text"
                value={flightInfo?.terminal || ''}
                onChange={(e) => handleFieldChange('terminal', e.target.value)}
                placeholder="e.g., 2A"
                className="w-full px-3 py-2 border border-input rounded-md focus:ring-ring focus:border-ring bg-background text-foreground"
              />
            </div>

            {/* Gate */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Gate (optional)
              </label>
              <input
                type="text"
                value={flightInfo?.gate || ''}
                onChange={(e) => handleFieldChange('gate', e.target.value)}
                placeholder="e.g., B15"
                className="w-full px-3 py-2 border border-input rounded-md focus:ring-ring focus:border-ring bg-background text-foreground"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-primary/10 rounded-md">
            <p className="text-sm text-primary">
              <strong>Note:</strong> Flight tracking helps us monitor delays and adjust your 
              pickup time automatically. You'll receive notifications of any changes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};