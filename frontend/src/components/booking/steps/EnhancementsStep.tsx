import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { 
  TripProtectionOption,
  LuggageAssistance,
  FlightInformation,
  VehicleSelector,
  SpecialRequests,
  EnhancementSummary
} from '../../enhancements';
import type { VehicleOption, EnhancementCalculationResponse, LuggageServices, SpecialRequests as SpecialRequestsType } from '@stable-ride/shared';

interface EnhancementsStepProps {
  vehicleOptions: VehicleOption[];
  enhancementCalculation: EnhancementCalculationResponse | null;
}

export const EnhancementsStep: React.FC<EnhancementsStepProps> = ({
  vehicleOptions,
  enhancementCalculation,
}) => {
  const { control, watch, setValue } = useFormContext();
  const watchedValues = watch();

  // Create luggage services object
  const luggageServices: LuggageServices = {
    meetAndGreet: {
      enabled: watchedValues.meetAndGreet || false,
      cost: 15,
      description: 'Meet & greet service',
      includes: ['Personal greeting at arrival', 'Assistance with luggage', 'Direct escort to vehicle'],
    },
    extraLuggage: {
      enabled: (watchedValues.extraLuggage || 2) > 2,
      count: watchedValues.extraLuggage || 2,
      threshold: 2,
      costPerBag: 5,
    },
    specialHandling: {
      enabled: (watchedValues.specialHandling?.length || 0) > 0,
      options: ['golf_clubs', 'ski_equipment', 'musical_instruments', 'fragile_items'].map(type => ({
        type: type as any,
        cost: 10,
        requirements: 'Handle with care',
        selected: watchedValues.specialHandling?.includes(type) || false,
      })),
    },
  };

  // Create special requests object
  const specialRequests: SpecialRequestsType = {
    vehiclePreferences: {
      type: watchedValues.vehicleType || 'standard',
      features: [],
      accessibility: [],
    },
    childSafety: {
      infantSeat: watchedValues.childSeats?.infant || 0,
      toddlerSeat: watchedValues.childSeats?.toddler || 0,
      boosterSeat: watchedValues.childSeats?.booster || 0,
    },
    customRequests: watchedValues.customPreferences || {},
    businessNeeds: watchedValues.businessNeeds || {},
  };

  const handleLuggageChange = (services: LuggageServices) => {
    setValue('meetAndGreet', services.meetAndGreet.enabled);
    setValue('extraLuggage', services.extraLuggage.count);
    setValue('specialHandling', services.specialHandling.options
      .filter(opt => opt.selected)
      .map(opt => opt.type)
    );
  };

  const handleSpecialRequestsChange = (requests: SpecialRequestsType) => {
    setValue('vehicleType', requests.vehiclePreferences.type);
    setValue('childSeats', {
      infant: requests.childSafety.infantSeat,
      toddler: requests.childSafety.toddlerSeat,
      booster: requests.childSafety.boosterSeat
    });
    setValue('customPreferences', requests.customRequests);
    setValue('businessNeeds', requests.businessNeeds);
  };

  const handleFlightInfoChange = (flightInfo: any) => {
    setValue('flightInfo', flightInfo || undefined);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Enhance Your Experience</h2>
        <p className="text-muted-foreground">Select optional services to customize your ride</p>
      </div>

      {/* Trip Protection */}
      <Controller
        name="tripProtection"
        control={control}
        render={({ field }) => (
          <TripProtectionOption
            enabled={field.value || false}
            cost={9}
            onChange={field.onChange}
          />
        )}
      />

      {/* Vehicle Selection */}
      {vehicleOptions.length > 0 && (
        <Controller
          name="vehicleType"
          control={control}
          render={({ field }) => (
            <VehicleSelector
              vehicles={vehicleOptions}
              selectedType={field.value || 'standard'}
              basePrice={100} // This should come from the quote
              onChange={field.onChange}
            />
          )}
        />
      )}

      {/* Luggage Assistance */}
      <LuggageAssistance
        services={luggageServices}
        onChange={handleLuggageChange}
      />

      {/* Flight Information */}
      <FlightInformation
        flightInfo={watchedValues.flightInfo}
        onChange={handleFlightInfoChange}
        serviceType="pickup"
      />

      {/* Special Requests */}
      <SpecialRequests
        requests={specialRequests}
        onChange={handleSpecialRequestsChange}
      />

      {/* Enhancement Summary */}
      {enhancementCalculation && enhancementCalculation.totalEnhancementCost > 0 && (
        <div className="mt-8 sticky bottom-0 bg-background pt-4 border-t border-border">
          <EnhancementSummary
            enhancements={{
              tripProtection: watchedValues.tripProtection ? {
                enabled: true,
                cost: 9,
                coverage: {
                  cancellationReasons: ['Any reason'],
                  refundPercentage: 100,
                  timeLimits: { fullRefund: 60, partialRefund: 30 },
                },
                termsAndConditions: '',
              } : undefined,
              luggageServices,
              flightInfo: watchedValues.flightInfo,
              specialRequests,
              totalEnhancementCost: enhancementCalculation.totalEnhancementCost,
            }}
            breakdown={enhancementCalculation.breakdown}
            totalCost={enhancementCalculation.totalEnhancementCost}
          />
        </div>
      )}
    </div>
  );
};