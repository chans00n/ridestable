import React from 'react';
import { motion } from 'framer-motion';
import { 
  TruckIcon,
  MapPinIcon,
  CreditCardIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface BookingProgressProps {
  currentStep: number;
  totalSteps?: number;
}

const steps = [
  { id: 1, name: 'Service Type', icon: TruckIcon },
  { id: 2, name: 'Details', icon: MapPinIcon },
  { id: 3, name: 'Payment', icon: CreditCardIcon },
  { id: 4, name: 'Confirmation', icon: CheckCircleIcon },
];

export const BookingProgress: React.FC<BookingProgressProps> = ({ 
  currentStep, 
  totalSteps = 4 
}) => {
  const displaySteps = steps.slice(0, totalSteps);

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between max-w-3xl mx-auto px-4">
        {displaySteps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const isLast = index === displaySteps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </motion.div>
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.05 }}
                  className={`mt-2 text-xs font-medium ${
                    isActive
                      ? 'text-primary'
                      : isCompleted
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.name}
                </motion.span>
              </div>
              
              {!isLast && (
                <div className="flex-1 h-0.5 mx-2">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isCompleted ? 1 : 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="h-full bg-primary origin-left"
                  />
                  <div className={`h-full ${isCompleted ? 'hidden' : 'bg-muted'}`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};