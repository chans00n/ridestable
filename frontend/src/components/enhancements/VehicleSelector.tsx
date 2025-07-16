import React from 'react';
import { TruckIcon, StarIcon, BoltIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { VehicleOption } from '@stable-ride/shared';

interface VehicleSelectorProps {
  vehicles: VehicleOption[];
  selectedType: string;
  basePrice: number;
  onChange: (vehicleType: string) => void;
}

const vehicleIcons: Record<string, React.ReactNode> = {
  standard: <TruckIcon className="h-6 w-6" />,
  luxury_sedan: <StarIcon className="h-6 w-6" />,
  suv: <TruckIcon className="h-6 w-6" />,
  executive: <SparklesIcon className="h-6 w-6" />,
  eco_friendly: <BoltIcon className="h-6 w-6" />
};

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  vehicles,
  selectedType,
  basePrice,
  onChange
}) => {
  const calculateUpgradePrice = (vehicle: VehicleOption) => {
    if (vehicle.type === 'standard') return 0;
    return (vehicle.basePriceMultiplier - 1) * basePrice;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground">Vehicle Selection</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => {
          const isSelected = selectedType === vehicle.type;
          const upgradePrice = calculateUpgradePrice(vehicle);
          
          return (
            <div
              key={vehicle.id}
              onClick={() => onChange(vehicle.type)}
              className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                isSelected 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border bg-card hover:border-border/80'
              }`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <svg className="h-4 w-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {/* Icon and Name */}
                <div className="flex items-center space-x-3">
                  <div className={`${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                    {vehicleIcons[vehicle.type] || vehicleIcons.standard}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-medium text-foreground">
                      {vehicle.name}
                    </h4>
                    {upgradePrice > 0 && (
                      <span className="text-sm font-medium text-primary">
                        +${upgradePrice.toFixed(2)}
                      </span>
                    )}
                    {vehicle.type === 'standard' && (
                      <span className="text-sm text-muted-foreground">Included</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {vehicle.description && (
                  <p className="text-sm text-muted-foreground">
                    {vehicle.description}
                  </p>
                )}

                {/* Features */}
                {vehicle.features && vehicle.features.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {vehicle.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-center space-x-1">
                        <span className="text-muted-foreground">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};