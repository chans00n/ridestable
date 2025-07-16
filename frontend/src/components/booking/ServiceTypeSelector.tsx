import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRightIcon, 
  ArrowsRightLeftIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

import type { ServiceType, ServiceTypeId } from '../../types/booking-types';

const serviceTypes = [
  {
    id: 'one-way' as ServiceTypeId,
    name: 'One-Way',
    description: 'Single pickup to dropoff location',
    icon: ArrowRightIcon,
    features: [
      'Direct route to destination',
      'No return trip needed',
      'Perfect for airport transfers',
      'Most economical option'
    ],
    startingPrice: 'From $65'
  },
  {
    id: 'roundtrip' as ServiceTypeId,
    name: 'Roundtrip',
    description: 'Pickup, destination, and return',
    icon: ArrowsRightLeftIcon,
    features: [
      'Complete round journey',
      'Return to pickup or new location',
      'Ideal for events and meetings',
      'Driver waits at destination'
    ],
    startingPrice: 'From $120'
  },
  {
    id: 'hourly' as ServiceTypeId,
    name: 'Hourly',
    description: 'Flexible hourly chauffeur service',
    icon: ClockIcon,
    features: [
      'Minimum 2 hours',
      'Multiple stops allowed',
      'Perfect for tours or errands',
      'Dedicated driver throughout'
    ],
    startingPrice: 'From $80/hour'
  }
];

export const ServiceTypeSelector: React.FC = () => {
  const navigate = useNavigate();

  const handleServiceSelect = (serviceType: ServiceTypeId) => {
    navigate(`/booking/new?service=${serviceType}`);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 sm:py-12 lg:py-24">
        <h1 className="text-2xl font-semibold text-foreground mb-3">
          Select Your Service Type
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto">
          Choose the transportation service that best fits your needs. 
          All services include professional drivers and luxury vehicles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {serviceTypes.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col border border-border">
              <div className="p-8 flex-grow">
                <service.icon className="h-10 w-10 text-primary mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {service.name}
                </h2>
                <p className="text-sm text-muted-foreground mb-6">{service.description}</p>
                
                <ul className="space-y-3 mb-6">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg 
                        className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="px-8 pb-8">
                <div className="text-base font-semibold text-primary mb-4">
                  {service.startingPrice}
                </div>
                <button
                  onClick={() => handleServiceSelect(service.id)}
                  className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200 transform hover:scale-105"
                >
                  Select {service.name}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};