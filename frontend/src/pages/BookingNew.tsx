import React from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { MultiStepBookingForm } from '../components/booking/MultiStepBookingForm';
import type { ServiceTypeId } from '../types/booking-types';

const validServiceTypes: ServiceTypeId[] = ['one-way', 'roundtrip', 'hourly'];

export const BookingNew: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceType = searchParams.get('service') as ServiceTypeId;

  // Redirect to service selection if no valid service type
  if (!serviceType || !validServiceTypes.includes(serviceType)) {
    return <Navigate to="/booking" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <MultiStepBookingForm serviceType={serviceType} />
    </div>
  );
};