import React from 'react';
import { useFormContext } from 'react-hook-form';
import { format } from 'date-fns';
import type { QuoteBreakdown } from '../../../types/booking-types';
import type { EnhancementCalculationResponse } from '@stable-ride/shared';

interface ReviewStepProps {
  quote: QuoteBreakdown | null;
  enhancementCalculation: EnhancementCalculationResponse | null;
  selectedGratuity: number;
  onGratuityChange: (percentage: number) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  quote,
  enhancementCalculation,
  selectedGratuity,
  onGratuityChange,
}) => {
  const { watch } = useFormContext();
  const watchedValues = watch();

  if (!quote) {
    return <div>Loading quote...</div>;
  }

  const subtotal = quote.subtotal;
  const taxes = quote.taxes.total;
  const enhancementCost = enhancementCalculation?.totalEnhancementCost || 0;
  const baseTotal = subtotal + taxes + enhancementCost;
  const gratuityAmount = baseTotal * (selectedGratuity / 100);
  const finalTotal = baseTotal + gratuityAmount;

  const gratuityOptions = [15, 18, 20, 25];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Review Your Booking</h2>
        <p className="text-muted-foreground">Please review all details before proceeding to payment</p>
      </div>

      {/* Service Details */}
      <div className="bg-muted/50 rounded-lg p-6 border border-border">
        <h3 className="text-lg font-medium text-foreground mb-4">Service Details</h3>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Service Type:</dt>
            <dd className="font-medium text-foreground">
              {watchedValues.serviceType.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Pickup Location:</dt>
            <dd className="font-medium text-foreground text-right max-w-xs">
              {watchedValues.pickupLocation?.address}
            </dd>
          </div>
          {watchedValues.dropoffLocation && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Dropoff Location:</dt>
              <dd className="font-medium text-foreground text-right max-w-xs">
                {watchedValues.dropoffLocation.address}
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Pickup Date & Time:</dt>
            <dd className="font-medium text-foreground">
              {format(watchedValues.pickupDateTime, 'MMM d, yyyy h:mm a')}
            </dd>
          </div>
          {watchedValues.returnDateTime && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Return Date & Time:</dt>
              <dd className="font-medium text-foreground">
                {format(watchedValues.returnDateTime, 'MMM d, yyyy h:mm a')}
              </dd>
            </div>
          )}
          {watchedValues.durationHours && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Duration:</dt>
              <dd className="font-medium text-foreground">{watchedValues.durationHours} hours</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Contact Phone:</dt>
            <dd className="font-medium text-foreground">{watchedValues.contactPhone}</dd>
          </div>
        </dl>
      </div>

      {/* Selected Enhancements */}
      {enhancementCalculation && enhancementCalculation.breakdown.length > 0 && (
        <div className="bg-primary/10 rounded-lg p-6 border border-primary/20">
          <h3 className="text-lg font-medium text-foreground mb-4">Selected Enhancements</h3>
          <dl className="space-y-2">
            {enhancementCalculation.breakdown.map((item, index) => (
              <div key={index} className="flex justify-between">
                <dt className="text-muted-foreground">{item.item}:</dt>
                <dd className="font-medium text-foreground">+${item.cost.toFixed(2)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Flight Information */}
      {watchedValues.flightInfo && (
        <div className="bg-muted/50 rounded-lg p-6 border border-border">
          <h3 className="text-lg font-medium text-foreground mb-4">Flight Information</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Flight:</dt>
              <dd className="font-medium text-foreground">
                {watchedValues.flightInfo.airline}{watchedValues.flightInfo.flightNumber}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Route:</dt>
              <dd className="font-medium text-foreground">
                {watchedValues.flightInfo.departureAirport} → {watchedValues.flightInfo.arrivalAirport}
              </dd>
            </div>
            {watchedValues.flightInfo.terminal && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Terminal:</dt>
                <dd className="font-medium text-foreground">{watchedValues.flightInfo.terminal}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Pricing Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Pricing Summary</h3>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Base Fare:</dt>
            <dd className="font-medium text-foreground">${subtotal.toFixed(2)}</dd>
          </div>
          
          {enhancementCost > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Enhancements:</dt>
              <dd className="font-medium text-foreground">${enhancementCost.toFixed(2)}</dd>
            </div>
          )}
          
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Taxes & Fees:</dt>
            <dd className="font-medium text-foreground">${taxes.toFixed(2)}</dd>
          </div>
          
          <div className="border-t pt-3">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal:</dt>
              <dd className="font-medium text-foreground">${baseTotal.toFixed(2)}</dd>
            </div>
          </div>

          {/* Gratuity Selection */}
          <div className="border-t pt-3">
            <dt className="text-foreground font-medium mb-3">Driver Gratuity</dt>
            <div className="grid grid-cols-4 gap-2">
              {gratuityOptions.map((percentage) => (
                <button
                  key={percentage}
                  type="button"
                  onClick={() => onGratuityChange(percentage)}
                  className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    selectedGratuity === percentage
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'
                  }`}
                >
                  {percentage}%
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-3">
              <span className="text-muted-foreground">Gratuity ({selectedGratuity}%):</span>
              <span className="font-medium text-foreground">${gratuityAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between">
              <dt className="text-lg font-semibold text-foreground">Total:</dt>
              <dd className="text-lg font-semibold text-primary">${finalTotal.toFixed(2)}</dd>
            </div>
          </div>
        </dl>
      </div>

      {/* Special Instructions */}
      {watchedValues.specialInstructions && (
        <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
          <h4 className="text-sm font-medium text-foreground mb-1">Special Instructions:</h4>
          <p className="text-sm text-muted-foreground">{watchedValues.specialInstructions}</p>
        </div>
      )}

      {/* Terms */}
      <div className="text-sm text-muted-foreground">
        <p>By continuing, you agree to our terms of service and cancellation policy.</p>
        {watchedValues.tripProtection && (
          <p className="mt-2 text-green-600 dark:text-green-400">
            ✓ Trip Protection included - Cancel up to 1 hour before pickup for full refund
          </p>
        )}
      </div>
    </div>
  );
};