import React from 'react';
import { UserGroupIcon, BriefcaseIcon, HandRaisedIcon } from '@heroicons/react/24/outline';
import type { LuggageServices, SpecialHandlingOption } from '@stable-ride/shared';

interface LuggageAssistanceProps {
  services: LuggageServices;
  onChange: (services: LuggageServices) => void;
}

export const LuggageAssistance: React.FC<LuggageAssistanceProps> = ({
  services,
  onChange
}) => {
  const specialHandlingOptions: SpecialHandlingOption[] = [
    { type: 'golf_clubs', cost: 10, requirements: 'Proper golf bag required', selected: false },
    { type: 'ski_equipment', cost: 10, requirements: 'Ski bag or boot bag', selected: false },
    { type: 'musical_instruments', cost: 10, requirements: 'Hard case recommended', selected: false },
    { type: 'fragile_items', cost: 10, requirements: 'Proper packaging required', selected: false }
  ];

  const handleMeetAndGreetChange = (enabled: boolean) => {
    onChange({
      ...services,
      meetAndGreet: {
        ...services.meetAndGreet,
        enabled
      }
    });
  };

  const handleExtraLuggageChange = (count: number) => {
    onChange({
      ...services,
      extraLuggage: {
        ...services.extraLuggage,
        enabled: count > 2,
        count
      }
    });
  };

  const handleSpecialHandlingChange = (type: string, selected: boolean) => {
    const updatedOptions = services.specialHandling.options.map(opt => 
      opt.type === type ? { ...opt, selected } : opt
    );
    
    // If no options exist yet, create them
    const finalOptions = updatedOptions.length > 0 
      ? updatedOptions 
      : specialHandlingOptions.map(opt => 
          opt.type === type ? { ...opt, selected } : opt
        );

    onChange({
      ...services,
      specialHandling: {
        enabled: finalOptions.some(opt => opt.selected),
        options: finalOptions
      }
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground">Luggage & Assistance Services</h3>

      {/* Meet & Greet Service */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="meet-greet"
            checked={services.meetAndGreet.enabled}
            onChange={(e) => handleMeetAndGreetChange(e.target.checked)}
            className="mt-1 h-4 w-4 text-primary focus:ring-ring border-border rounded"
          />
          <div className="flex-1">
            <label htmlFor="meet-greet" className="cursor-pointer">
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="h-5 w-5 text-primary" />
                <span className="text-base font-medium text-foreground">
                  Meet & Greet Service
                </span>
                <span className="text-sm font-medium text-primary">
                  +${services.meetAndGreet.cost.toFixed(2)}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Your driver will meet you at the arrival gate with a sign
              </p>
              <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
                <li>Personal greeting at arrival gate</li>
                <li>Assistance with luggage</li>
                <li>Direct escort to vehicle</li>
              </ul>
            </label>
          </div>
        </div>
      </div>

      {/* Extra Luggage */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center space-x-2 mb-3">
          <BriefcaseIcon className="h-5 w-5 text-primary" />
          <h4 className="text-base font-medium text-foreground">Luggage Count</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Standard fare includes 2 large bags. Additional bags +${services.extraLuggage.costPerBag.toFixed(2)} each
        </p>
        <div className="flex items-center space-x-4">
          <label className="text-sm text-foreground">Number of large bags:</label>
          <input
            type="number"
            min="0"
            max="10"
            value={services.extraLuggage.count}
            onChange={(e) => handleExtraLuggageChange(parseInt(e.target.value) || 0)}
            className="w-20 px-3 py-1 border border-input bg-background rounded-md focus:ring-ring focus:border-input"
          />
          {services.extraLuggage.count > 2 && (
            <span className="text-sm text-blue-600">
              +${((services.extraLuggage.count - 2) * services.extraLuggage.costPerBag).toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Special Handling */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center space-x-2 mb-3">
          <HandRaisedIcon className="h-5 w-5 text-primary" />
          <h4 className="text-base font-medium text-foreground">Special Handling</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Select any items requiring special care (+$10 each)
        </p>
        <div className="space-y-2">
          {specialHandlingOptions.map((option) => {
            const isSelected = services.specialHandling.options.find(
              opt => opt.type === option.type
            )?.selected || false;

            return (
              <label key={option.type} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleSpecialHandlingChange(option.type, e.target.checked)}
                  className="mt-1 h-4 w-4 text-primary focus:ring-ring border-border rounded"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground capitalize">
                    {option.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    {option.requirements}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};