import React from 'react';
import { ServiceTypeSelector } from '../components/booking/ServiceTypeSelector';

export const Booking: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <ServiceTypeSelector />
    </div>
  );
};