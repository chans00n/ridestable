import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuoteBreakdown } from '../../types/booking-types';
import { formatCurrency } from '../../utils/format';
import { GratuitySelector } from './GratuitySelector';
import { PriceBreakdown } from './PriceBreakdown';
import { QuoteTimer } from './QuoteTimer';
import { Skeleton } from '@/components/ui/skeleton';

interface QuoteDisplayProps {
  quote: QuoteBreakdown | null;
  loading?: boolean;
  error?: string;
  onGratuityChange?: (amount: number, percentage: number) => void;
  onQuoteExpired?: () => void;
}

export const QuoteDisplay: React.FC<QuoteDisplayProps> = ({
  quote,
  loading = false,
  error,
  onGratuityChange,
  onQuoteExpired,
}) => {
  const [selectedGratuity, setSelectedGratuity] = useState(20); // Default 20%
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    if (quote && onGratuityChange) {
      const gratuityAmount = (quote.subtotal + quote.taxes.total) * (selectedGratuity / 100);
      onGratuityChange(gratuityAmount, selectedGratuity);
    }
  }, [selectedGratuity, quote, onGratuityChange]);

  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-1/2" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 rounded-lg border border-destructive/20 p-6">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="bg-muted rounded-lg border border-border p-6">
        <p className="text-sm text-muted-foreground text-center">
          Enter your trip details to see pricing
        </p>
      </div>
    );
  }

  const totalWithGratuity = quote.total + ((quote.subtotal + quote.taxes.total) * (selectedGratuity / 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg shadow-sm border border-border overflow-hidden"
    >
      {/* Quote Header */}
      <div className="bg-muted px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Quote Summary</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Reference: {quote.bookingReference}
            </p>
          </div>
          <QuoteTimer 
            validUntil={quote.validUntil} 
            onExpired={onQuoteExpired}
          />
        </div>
      </div>

      {/* Main Quote Display */}
      <div className="p-6 space-y-6">
        {/* Distance and Duration */}
        {(quote.distanceText || quote.durationText) && (
          <div className="flex items-center justify-between text-sm">
            {quote.distanceText && (
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
                  />
                </svg>
                <span className="text-muted-foreground">{quote.distanceText}</span>
              </div>
            )}
            {quote.durationText && (
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <span className="text-muted-foreground">{quote.durationText}</span>
              </div>
            )}
          </div>
        )}

        {/* Price Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(quote.subtotal)}</span>
          </div>

          {/* Surcharges */}
          {quote.surcharges.length > 0 && (
            <div className="space-y-2">
              {quote.surcharges.map((surcharge, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center space-x-1">
                    <span>{surcharge.name}</span>
                    {surcharge.description && (
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <title>{surcharge.description}</title>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                    )}
                  </span>
                  <span className="text-destructive">+{formatCurrency(surcharge.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Discounts */}
          {quote.discounts.length > 0 && (
            <div className="space-y-2">
              {quote.discounts.map((discount, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center space-x-1">
                    <span>{discount.name}</span>
                    {discount.percentage && (
                      <span className="text-primary">({discount.percentage}%)</span>
                    )}
                  </span>
                  <span className="text-primary">-{formatCurrency(discount.amount)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Taxes</span>
              <span className="font-medium">{formatCurrency(quote.taxes.total)}</span>
            </div>
          </div>

          {/* Gratuity Selection */}
          <div className="border-t pt-3">
            <GratuitySelector
              subtotal={quote.subtotal + quote.taxes.total}
              selectedPercentage={selectedGratuity}
              onPercentageChange={setSelectedGratuity}
            />
          </div>

          {/* Total */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">Total</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(totalWithGratuity)}
              </span>
            </div>
          </div>
        </div>

        {/* Show/Hide Breakdown Button */}
        <button
          type="button"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full text-sm text-primary hover:text-primary/80 font-medium flex items-center justify-center space-x-2"
        >
          <span>{showBreakdown ? 'Hide' : 'Show'} detailed breakdown</span>
          <svg 
            className={`w-4 h-4 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Detailed Breakdown */}
        <AnimatePresence>
          {showBreakdown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PriceBreakdown quote={quote} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Note */}
      <div className="bg-muted px-6 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Final price may vary based on actual route and traffic conditions
        </p>
      </div>
    </motion.div>
  );
};