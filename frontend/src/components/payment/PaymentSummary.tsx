import React from 'react';

interface PaymentSummaryProps {
  amount: number;
  currency?: string;
  serviceType: string;
  pickupDate: string;
  dropoffDate?: string;
  pickupLocation: string;
  dropoffLocation: string;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  amount,
  currency = 'USD',
  serviceType,
  pickupDate,
  dropoffDate,
  pickupLocation,
  dropoffLocation,
}) => {
  // Convert amount to number if it's a string (from Prisma Decimal)
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return (
    <div className="bg-card rounded-lg p-6 border">
      <h3 className="text-lg font-semibold text-foreground mb-4">Booking Summary</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Service Type:</span>
          <span className="font-medium text-foreground">
            {serviceType.replace('_', ' ')}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pickup:</span>
          <span className="font-medium text-foreground text-right max-w-[200px]">
            {pickupLocation}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Dropoff:</span>
          <span className="font-medium text-foreground text-right max-w-[200px]">
            {dropoffLocation}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pickup Date:</span>
          <span className="font-medium text-foreground">
            {new Date(pickupDate).toLocaleDateString()}
          </span>
        </div>

        {dropoffDate && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Dropoff Date:</span>
            <span className="font-medium text-foreground">
              {new Date(dropoffDate).toLocaleDateString()}
            </span>
          </div>
        )}

        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-foreground">Total Amount:</span>
            <span className="text-xl font-bold text-primary">
              ${numericAmount.toFixed(2)} {currency}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-primary/10 rounded-md">
        <p className="text-xs text-primary flex items-start">
          <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>
            This amount will be charged to your payment method upon confirmation.
            You can cancel your booking up to 24 hours before the pickup date for a full refund.
          </span>
        </p>
      </div>
    </div>
  );
};