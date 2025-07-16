import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import type { ServiceTypeId, BookingFormData, QuoteBreakdown } from '../../types/booking-types';
import type { TripEnhancements, VehicleOption, EnhancementCalculationResponse } from '@stable-ride/shared';

// Import form steps
import { ServiceDetailsStep } from './steps/ServiceDetailsStep';
import { EnhancementsStep } from './steps/EnhancementsStep';
import { ReviewStep } from './steps/ReviewStep';

// Import services
import { api } from '../../services/api';
import { bookingService } from '../../services/bookingService';
import { useEnhancements } from '../../hooks/useEnhancements';
import { useAuth } from '../../contexts/AuthContext';
import { showToast } from '../ui/Toast';
import { debounce } from 'lodash';

// Base schema with enhancements
const baseSchemaWithEnhancements = z.object({
  serviceType: z.string(),
  pickupLocation: z.object({
    address: z.string().min(1, 'Pickup location is required'),
    lat: z.number(),
    lng: z.number(),
  }),
  pickupDateTime: z.date().min(new Date(), 'Pickup date must be in the future'),
  specialInstructions: z.string().optional(),
  contactPhone: z.string().regex(/^\+?1?\d{10,14}$/, 'Invalid phone number'),
  // Enhancements
  tripProtection: z.boolean().optional(),
  meetAndGreet: z.boolean().optional(),
  extraLuggage: z.number().optional(),
  specialHandling: z.array(z.string()).optional(),
  vehicleType: z.string().optional(),
  childSeats: z.object({
    infant: z.number(),
    toddler: z.number(),
    booster: z.number(),
  }).optional(),
  flightInfo: z.object({
    airline: z.string(),
    flightNumber: z.string(),
    departureAirport: z.string(),
    arrivalAirport: z.string(),
    scheduledArrival: z.string(),
    terminal: z.string().optional(),
    gate: z.string().optional(),
  }).optional(),
  customPreferences: z.object({
    temperature: z.string().optional(),
    music: z.string().optional(),
    refreshments: z.boolean().optional(),
    specialInstructions: z.string().optional(),
  }).optional(),
  businessNeeds: z.object({
    wifiRequired: z.boolean().optional(),
    quietRide: z.boolean().optional(),
    phoneConference: z.boolean().optional(),
  }).optional(),
});

// Service-specific schemas
const oneWaySchema = baseSchemaWithEnhancements.extend({
  dropoffLocation: z.object({
    address: z.string().min(1, 'Dropoff location is required'),
    lat: z.number(),
    lng: z.number(),
  }),
});

const roundtripSchema = baseSchemaWithEnhancements.extend({
  dropoffLocation: z.object({
    address: z.string().min(1, 'Destination is required'),
    lat: z.number(),
    lng: z.number(),
  }),
  returnDateTime: z.date(),
}).refine((data) => data.returnDateTime > data.pickupDateTime, {
  message: 'Return time must be after pickup time',
  path: ['returnDateTime'],
});

const hourlySchema = baseSchemaWithEnhancements.extend({
  durationHours: z.number().min(2, 'Minimum duration is 2 hours').max(8, 'Maximum duration is 8 hours'),
});

const getSchema = (serviceType: ServiceTypeId) => {
  switch (serviceType) {
    case 'one-way':
      return oneWaySchema;
    case 'roundtrip':
      return roundtripSchema;
    case 'hourly':
      return hourlySchema;
    default:
      return baseSchemaWithEnhancements;
  }
};

type BookingFormDataWithEnhancements = z.infer<typeof baseSchemaWithEnhancements> & {
  dropoffLocation?: z.infer<typeof oneWaySchema>['dropoffLocation'];
  returnDateTime?: Date;
  durationHours?: number;
};

interface MultiStepBookingFormProps {
  serviceType: ServiceTypeId;
}

const steps = [
  { id: 'details', title: 'Service Details', description: 'Where and when' },
  { id: 'enhancements', title: 'Enhancements', description: 'Customize your ride' },
  { id: 'review', title: 'Review & Pay', description: 'Confirm your booking' },
];

export const MultiStepBookingForm: React.FC<MultiStepBookingFormProps> = ({ serviceType }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [quote, setQuote] = useState<QuoteBreakdown | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [vehicleOptions, setVehicleOptions] = useState<VehicleOption[]>([]);
  const [enhancementCalculation, setEnhancementCalculation] = useState<EnhancementCalculationResponse | null>(null);
  const [selectedGratuity, setSelectedGratuity] = useState(20);
  
  const { 
    calculateEnhancements, 
    getVehicleOptions,
    upsertBookingEnhancements 
  } = useEnhancements();

  const methods = useForm<BookingFormDataWithEnhancements>({
    resolver: zodResolver(getSchema(serviceType)),
    defaultValues: {
      serviceType,
      tripProtection: false,
      meetAndGreet: false,
      extraLuggage: 2,
      specialHandling: [],
      vehicleType: 'standard',
      childSeats: {
        infant: 0,
        toddler: 0,
        booster: 0,
      },
      contactPhone: user?.phone || '',
      specialInstructions: '',
      durationHours: 2,
      customPreferences: {
        temperature: 'comfortable',
        music: 'soft',
        refreshments: false,
        specialInstructions: ''
      },
      businessNeeds: {
        wifiRequired: false,
        quietRide: false,
        phoneConference: false
      }
    },
    mode: 'onChange',
  });

  const { watch, handleSubmit, formState: { errors } } = methods;
  
  // Log form errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('Form validation errors:', errors);
    }
  }, [errors]);
  const watchedValues = watch();

  // Load vehicle options
  useEffect(() => {
    const loadVehicleOptions = async () => {
      try {
        const options = await getVehicleOptions();
        setVehicleOptions(options);
      } catch (error) {
        console.error('Failed to load vehicle options:', error);
      }
    };
    loadVehicleOptions();
  }, []);

  // Calculate base quote
  const calculateQuote = React.useCallback(
    debounce(async (formData: any) => {
      const { pickupLocation, dropoffLocation, pickupDateTime, returnDateTime, durationHours } = formData;
      
      if (!pickupLocation?.lat || !pickupDateTime) {
        setQuote(null);
        return;
      }

      if ((serviceType === 'one-way' || serviceType === 'roundtrip') && !dropoffLocation?.lat) {
        setQuote(null);
        return;
      }

      setQuoteLoading(true);
      
      try {
        const response = await api.post('/quotes/calculate', {
          serviceType: serviceType.toUpperCase().replace('-', '_'),
          pickupLocation,
          dropoffLocation,
          pickupDateTime: pickupDateTime.toISOString(),
          returnDateTime: returnDateTime?.toISOString(),
          durationHours,
          corporateAccount: false,
        });
        
        if (response.data.success) {
          setQuote(response.data.quote);
        }
      } catch (error) {
        console.error('Failed to calculate quote:', error);
        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    }, 1000),
    [serviceType]
  );

  // Calculate enhancements
  const calculateEnhancementCost = React.useCallback(
    debounce(async (formData: any) => {
      if (!quote) return;

      try {
        const calculation = await calculateEnhancements({
          bookingAmount: quote.total,
          serviceType: serviceType.toUpperCase().replace('-', '_') as any,
          tripProtection: formData.tripProtection,
          luggageServices: {
            meetAndGreet: formData.meetAndGreet,
            extraBags: formData.extraLuggage || 2,
            specialHandling: formData.specialHandling || [],
          },
          vehicleUpgrade: formData.vehicleType !== 'standard' ? formData.vehicleType : undefined,
          childSeats: formData.childSeats,
          additionalStops: formData.specialRequests?.customRequests?.stops?.length || 0,
        });
        
        setEnhancementCalculation(calculation);
      } catch (error) {
        console.error('Failed to calculate enhancements:', error);
        setEnhancementCalculation(null);
      }
    }, 500),
    [quote, serviceType]
  );

  // Watch for quote-related changes
  useEffect(() => {
    calculateQuote(watchedValues);
  }, [
    watchedValues.pickupLocation,
    watchedValues.dropoffLocation,
    watchedValues.pickupDateTime,
    watchedValues.returnDateTime,
    watchedValues.durationHours,
    calculateQuote
  ]);

  // Watch for enhancement changes
  useEffect(() => {
    if (currentStep >= 1) { // Only calculate enhancements after the first step
      calculateEnhancementCost(watchedValues);
    }
  }, [
    watchedValues.tripProtection,
    watchedValues.meetAndGreet,
    watchedValues.extraLuggage,
    watchedValues.specialHandling,
    watchedValues.vehicleType,
    watchedValues.childSeats,
    watchedValues.specialRequests,
    currentStep,
    calculateEnhancementCost
  ]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: BookingFormDataWithEnhancements) => {
    console.log('Form submitted with data:', data);
    try {
      // Calculate final amounts
      let gratuityAmount = 0;
      const subtotal = quote ? quote.subtotal : 0;
      const taxes = quote ? quote.taxes.total : 0;
      const enhancementCost = enhancementCalculation?.totalEnhancementCost || 0;
      
      if (quote) {
        gratuityAmount = (subtotal + taxes + enhancementCost) * (selectedGratuity / 100);
      }

      // Create the booking
      const bookingData = {
        serviceType: data.serviceType,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
        pickupDateTime: data.pickupDateTime,
        returnDateTime: data.returnDateTime,
        durationHours: data.durationHours,
        contactPhone: data.contactPhone,
        specialInstructions: data.specialInstructions,
        gratuityPercentage: selectedGratuity,
        gratuityAmount,
        enhancementCost,
      };

      const booking = await bookingService.createBooking(bookingData);

      // Save enhancements
      if (enhancementCost > 0) {
        const enhancements: any = {
          totalEnhancementCost: enhancementCost,
        };

        // Only add tripProtection if enabled
        if (data.tripProtection) {
          enhancements.tripProtection = {
            enabled: true,
            cost: 9,
            coverage: {
              cancellationReasons: ['Any reason'],
              refundPercentage: 100,
              timeLimits: {
                fullRefund: 60,
                partialRefund: 30,
              },
            },
            termsAndConditions: 'Standard terms apply',
          };
        }

        // Always include luggageServices
        enhancements.luggageServices = {
          meetAndGreet: {
            enabled: data.meetAndGreet || false,
            cost: 15,
            description: 'Meet & greet service',
            includes: ['Personal greeting', 'Luggage assistance', 'Direct escort'],
          },
          extraLuggage: {
            enabled: (data.extraLuggage || 2) > 2,
            count: data.extraLuggage || 2,
            threshold: 2,
            costPerBag: 5,
          },
          specialHandling: {
            enabled: (data.specialHandling?.length || 0) > 0,
            options: (data.specialHandling || []).map(type => ({
              type: type as any,
              cost: 10,
              requirements: 'Handle with care',
              selected: true,
            })),
          },
        };

        // Only add flightInfo if provided
        if (data.flightInfo) {
          enhancements.flightInfo = data.flightInfo;
        }

        // Always include specialRequests
        enhancements.specialRequests = {
          vehiclePreferences: {
            type: (data.vehicleType || 'standard').toLowerCase(),
            features: [],
            accessibility: [],
          },
          childSafety: {
            infantSeat: data.childSeats?.infant || 0,
            toddlerSeat: data.childSeats?.toddler || 0,
            boosterSeat: data.childSeats?.booster || 0
          },
          customRequests: data.customPreferences || {},
          businessNeeds: data.businessNeeds || {},
        };

        console.log('Sending enhancements:', JSON.stringify(enhancements, null, 2));
        await upsertBookingEnhancements(booking.id, enhancements);
      }

      showToast.warning('Booking created - please complete payment to confirm');
      
      // Navigate to payment
      navigate(`/payment/${booking.id}`, {
        state: {
          bookingId: booking.id,
          amount: booking.totalAmount,
        },
      });
    } catch (error: any) {
      console.error('Booking creation error:', error);
      console.error('Error details:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create booking. Please try again.';
      showToast.error(errorMessage);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ServiceDetailsStep 
            serviceType={serviceType}
            quote={quote}
            quoteLoading={quoteLoading}
            onGratuityChange={setSelectedGratuity}
          />
        );
      case 1:
        return (
          <EnhancementsStep 
            vehicleOptions={vehicleOptions}
            enhancementCalculation={enhancementCalculation}
          />
        );
      case 2:
        return (
          <ReviewStep 
            quote={quote}
            enhancementCalculation={enhancementCalculation}
            selectedGratuity={selectedGratuity}
            onGratuityChange={setSelectedGratuity}
          />
        );
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step content with integrated progress indicator */}
          <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
            {/* Progress indicator */}
            <div className="bg-muted/50 px-6 md:px-8 py-6 border-b border-border">
              <div className="flex items-start justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex-1 flex items-start">
                    <div className="flex flex-col items-center w-full">
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                        index <= currentStep ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'
                      }`}>
                        {index < currentStep ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <p className={`text-sm font-medium ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}>{step.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex-1 flex items-center mt-5 px-4">
                        <div className={`flex-1 h-0.5 ${
                          index < currentStep ? 'bg-primary' : 'bg-border'
                        }`} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-6 md:p-8"
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation buttons */}
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                currentStep === 0
                  ? 'text-muted-foreground cursor-not-allowed'
                  : 'text-foreground bg-secondary hover:bg-secondary/80'
              }`}
            >
              <ChevronLeftIcon className="w-5 h-5 mr-1" />
              Previous
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!quote || quoteLoading}
                className="flex items-center px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed"
              >
                Next
                <ChevronRightIcon className="w-5 h-5 ml-1" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!quote || methods.formState.isSubmitting}
                className="flex items-center px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed"
              >
                {methods.formState.isSubmitting ? 'Processing...' : 'Continue to Payment'}
              </button>
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  );
};