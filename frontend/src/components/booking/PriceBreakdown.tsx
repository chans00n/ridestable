import React from 'react';
import type { QuoteBreakdown } from '../../types/booking-types';
import { formatCurrency } from '../../utils/format';

interface PriceBreakdownProps {
  quote: QuoteBreakdown;
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({ quote }) => {
  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-4 border border-border">
      <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
        Detailed Price Breakdown
      </h4>

      {/* Base Charges */}
      <div className="space-y-2">
        <h5 className="text-xs font-medium text-muted-foreground uppercase">Base Charges</h5>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Base Rate</span>
            <span className="font-medium">{formatCurrency(quote.baseRate)}</span>
          </div>
          {quote.distanceCharge > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Distance Charge</span>
              <span className="font-medium">{formatCurrency(quote.distanceCharge)}</span>
            </div>
          )}
          {quote.timeCharges > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time-Based Charges</span>
              <span className="font-medium">{formatCurrency(quote.timeCharges)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Surcharges */}
      {quote.surcharges.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-muted-foreground uppercase">Surcharges</h5>
          <div className="space-y-1">
            {quote.surcharges.map((surcharge, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {surcharge.name}
                  {surcharge.description && (
                    <span className="text-xs text-muted-foreground/70 block">{surcharge.description}</span>
                  )}
                </span>
                <span className="font-medium text-destructive">+{formatCurrency(surcharge.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discounts */}
      {quote.discounts.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-muted-foreground uppercase">Discounts</h5>
          <div className="space-y-1">
            {quote.discounts.map((discount, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {discount.name}
                  {discount.percentage && <span className="text-green-600 dark:text-green-400"> ({discount.percentage}%)</span>}
                  {discount.description && (
                    <span className="text-xs text-muted-foreground/70 block">{discount.description}</span>
                  )}
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">-{formatCurrency(discount.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Taxes */}
      <div className="space-y-2">
        <h5 className="text-xs font-medium text-muted-foreground uppercase">Taxes & Fees</h5>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sales Tax</span>
            <span className="font-medium">{formatCurrency(quote.taxes.salesTax)}</span>
          </div>
          {quote.taxes.airportFee && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Airport Fee</span>
              <span className="font-medium">{formatCurrency(quote.taxes.airportFee)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="pt-3 border-t border-border space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-foreground font-medium">Subtotal (before gratuity)</span>
          <span className="font-semibold">{formatCurrency(quote.subtotal + quote.taxes.total)}</span>
        </div>
      </div>

      {/* Additional Information */}
      {(quote.distance || quote.duration) && (
        <div className="pt-3 border-t border-border">
          <h5 className="text-xs font-medium text-muted-foreground uppercase mb-2">Trip Details</h5>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {quote.distance && (
              <div>
                <span className="text-muted-foreground">Distance: </span>
                <span className="font-medium">{(quote.distance / 1609.34).toFixed(1)} miles</span>
              </div>
            )}
            {quote.duration && (
              <div>
                <span className="text-muted-foreground">Est. Duration: </span>
                <span className="font-medium">{Math.round(quote.duration / 60)} mins</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};