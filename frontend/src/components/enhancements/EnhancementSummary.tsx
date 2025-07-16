import React from 'react';
import type { TripEnhancements, EnhancementCalculationResponse } from '@stable-ride/shared';

interface EnhancementSummaryProps {
  enhancements: TripEnhancements;
  breakdown: EnhancementCalculationResponse['breakdown'];
  totalCost: number;
}

export const EnhancementSummary: React.FC<EnhancementSummaryProps> = ({
  enhancements,
  breakdown,
  totalCost
}) => {
  if (breakdown.length === 0) {
    return null;
  }

  return (
    <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
      <h4 className="text-sm font-medium text-foreground mb-3">Selected Enhancements</h4>
      
      <div className="space-y-2">
        {breakdown.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.item}</span>
            <span className="font-medium text-foreground">+${item.cost.toFixed(2)}</span>
          </div>
        ))}
        
        <div className="pt-2 border-t border-primary/20">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-foreground">Enhancement Total</span>
            <span className="text-base font-semibold text-primary">
              +${totalCost.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Selected preferences summary */}
      <div className="mt-4 space-y-1 text-xs text-muted-foreground">
        {enhancements.flightInfo && (
          <p>• Flight: {enhancements.flightInfo.airline}{enhancements.flightInfo.flightNumber}</p>
        )}
        {enhancements.specialRequests?.customRequests.temperature && (
          <p>• Temperature: {enhancements.specialRequests.customRequests.temperature}</p>
        )}
        {enhancements.specialRequests?.businessNeeds.wifiRequired && (
          <p>• WiFi required</p>
        )}
        {enhancements.specialRequests?.customRequests.specialInstructions && (
          <p>• Special instructions provided</p>
        )}
      </div>
    </div>
  );
};