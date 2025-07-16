import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ServiceTypeId, BookingFormData, BookingLocation, QuoteBreakdown } from '../../types/booking-types';
import { LocationInput } from './LocationInput';
import { DateTimePicker } from './DateTimePicker';
import { SavedLocations } from './SavedLocations';
import { MapPreview } from '../maps/MapPreview';
import { Button } from '../ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { showToast } from '../ui/Toast';
import { addHours } from 'date-fns';
import { api } from '../../services/api';
import { bookingService } from '../../services/bookingService';
import { QuoteDisplay } from './QuoteDisplay';
import { debounce } from 'lodash';

// Form validation schemas
const baseSchema = z.object({
  pickupLocation: z.object({
    address: z.string().min(1, 'Pickup location is required'),
    lat: z.number(),
    lng: z.number(),
  }),
  pickupDateTime: z.date().min(new Date(), 'Pickup date must be in the future'),
  specialInstructions: z.string().optional(),
  contactPhone: z.string().regex(/^\+?1?\d{10,14}$/, 'Invalid phone number'),
});

const oneWaySchema = baseSchema.extend({
  dropoffLocation: z.object({
    address: z.string().min(1, 'Dropoff location is required'),
    lat: z.number(),
    lng: z.number(),
  }),
});

const roundtripSchema = baseSchema.extend({
  dropoffLocation: z.object({
    address: z.string().min(1, 'Destination is required'),
    lat: z.number(),
    lng: z.number(),
  }),
  returnDateTime: z.date(),
  samePickupLocation: z.boolean().default(true),
}).refine((data) => data.returnDateTime > data.pickupDateTime, {
  message: 'Return time must be after pickup time',
  path: ['returnDateTime'],
});

const hourlySchema = baseSchema.extend({
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
      return baseSchema;
  }
};

interface BookingFormProps {
  serviceType: ServiceTypeId;
}

export const BookingForm: React.FC<BookingFormProps> = ({ serviceType }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [quote, setQuote] = useState<QuoteBreakdown | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [selectedGratuity, setSelectedGratuity] = useState(20);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: zodResolver(getSchema(serviceType)),
    defaultValues: {
      serviceType,
      contactPhone: user?.phone || '',
      samePickupLocation: true,
      durationHours: 2,
    },
  });

  // Watch form values for auto-save and price calculation
  const watchedValues = watch();

  // Auto-save to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(`booking_draft_${serviceType}`, JSON.stringify(watchedValues));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [watchedValues, serviceType]);

  // Load saved draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(`booking_draft_${serviceType}`);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        Object.entries(draft).forEach(([key, value]) => {
          if (key === 'pickupDateTime' || key === 'returnDateTime') {
            setValue(key as any, value ? new Date(value) : undefined);
          } else {
            setValue(key as any, value);
          }
        });
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [serviceType, setValue]);

  // Create debounced quote calculation function
  const calculateQuote = React.useCallback(
    debounce(async (formData: any) => {
      const { pickupLocation, dropoffLocation, pickupDateTime, returnDateTime, durationHours } = formData;
      
      console.log('Quote calculation triggered:', { 
        serviceType, 
        pickupLocation, 
        dropoffLocation, 
        pickupDateTime, 
        returnDateTime, 
        durationHours 
      });
      
      // Validate minimum required fields
      if (!pickupLocation?.lat || !pickupDateTime) {
        console.log('Missing required fields for quote');
        setQuote(null);
        return;
      }

      // Additional validation based on service type
      if ((serviceType === 'one-way' || serviceType === 'roundtrip') && !dropoffLocation?.lat) {
        console.log('Missing dropoff location for', serviceType);
        setQuote(null);
        return;
      }

      setIsCalculatingPrice(true);
      setQuoteError(null);
      
      try {
        console.log('Sending quote request...');
        const response = await api.post('/quotes/calculate', {
          serviceType: serviceType.toUpperCase().replace('-', '_'),
          pickupLocation,
          dropoffLocation,
          pickupDateTime: pickupDateTime.toISOString(),
          returnDateTime: returnDateTime?.toISOString(),
          durationHours,
          corporateAccount: false,
        });

        console.log('Quote response:', response.data);
        
        if (response.data.success) {
          setQuote(response.data.quote);
        } else {
          setQuoteError('Unable to calculate price');
        }
      } catch (error: any) {
        console.error('Failed to calculate quote:', error);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to calculate price';
        setQuoteError(errorMessage);
        setQuote(null);
        
        // Show toast for service area errors
        if (errorMessage.includes('outside our service area') || errorMessage.includes('Location is outside')) {
          showToast.error('This location is outside our service area. We currently serve the Las Vegas area (75-mile radius).');
        }
      } finally {
        setIsCalculatingPrice(false);
      }
    }, 1000),
    [serviceType]
  );

  // Calculate quote when relevant fields change
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

  const onSubmit = async (data: BookingFormData) => {
    try {
      // Calculate gratuity amount if quote exists
      let gratuityAmount = 0;
      if (quote) {
        gratuityAmount = (quote.subtotal + quote.taxes.total) * (selectedGratuity / 100);
      }
      
      // Create the booking with serviceType and gratuity
      const bookingData = {
        ...data,
        serviceType,
        gratuityPercentage: selectedGratuity,
        gratuityAmount
      };
      const booking = await bookingService.createBooking(bookingData);
      
      showToast.success('Booking created successfully!');
      
      // Clear the draft
      localStorage.removeItem(`booking_draft_${serviceType}`);
      
      // Navigate to payment page with booking ID
      navigate(`/payment/${booking.id}`, {
        state: {
          bookingId: booking.id,
          amount: booking.totalAmount,
          serviceType: data.serviceType,
          pickupLocation: data.pickupLocation,
          dropoffLocation: data.dropoffLocation,
          pickupDateTime: data.pickupDateTime,
          dropoffDateTime: data.returnDateTime
        }
      });
    } catch (error) {
      console.error('Booking creation error:', error);
      showToast.error('Failed to create booking. Please try again.');
    }
  };

  const getServiceTypeTitle = () => {
    switch (serviceType) {
      case 'one-way':
        return 'One-Way Ride';
      case 'roundtrip':
        return 'Roundtrip Service';
      case 'hourly':
        return 'Hourly Chauffeur';
      default:
        return 'Book a Ride';
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {getServiceTypeTitle()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Map Preview */}
            {(watchedValues.pickupLocation?.lat || watchedValues.dropoffLocation?.lat) && (
              <div className="mb-6">
                <MapPreview 
                  pickup={watchedValues.pickupLocation}
                  dropoff={watchedValues.dropoffLocation}
                  height="250px"
                  className="mb-4"
                />
              </div>
            )}

            {/* Saved Locations */}
            <SavedLocations 
              onSelectLocation={(location) => {
                // Determine which field to update based on what's empty
                if (!watchedValues.pickupLocation?.lat) {
                  setValue('pickupLocation', location);
                } else if ((serviceType === 'one-way' || serviceType === 'roundtrip') && 
                          !watchedValues.dropoffLocation?.lat) {
                  setValue('dropoffLocation', location);
                }
              }}
              currentLocation={watchedValues.pickupLocation}
            />

            {/* Pickup Location */}
            <Controller
              name="pickupLocation"
              control={control}
              render={({ field }) => (
                <LocationInput
                  {...field}
                  label="Pickup Location"
                  placeholder="Enter pickup address"
                  error={errors.pickupLocation?.address?.message}
                  required
                />
              )}
            />

            {/* Dropoff Location (for one-way and roundtrip) */}
            {(serviceType === 'one-way' || serviceType === 'roundtrip') && (
              <Controller
                name="dropoffLocation"
                control={control}
                render={({ field }) => (
                  <LocationInput
                    {...field}
                    label={serviceType === 'roundtrip' ? 'Destination' : 'Dropoff Location'}
                    placeholder={serviceType === 'roundtrip' ? 'Enter destination' : 'Enter dropoff address'}
                    error={errors.dropoffLocation?.address?.message}
                    required
                  />
                )}
              />
            )}

            {/* Pickup Date/Time */}
            <Controller
              name="pickupDateTime"
              control={control}
              render={({ field }) => (
                <DateTimePicker
                  {...field}
                  label="Pickup Date & Time"
                  error={errors.pickupDateTime?.message}
                  required
                />
              )}
            />

            {/* Return Date/Time (for roundtrip) */}
            {serviceType === 'roundtrip' && (
              <>
                <Controller
                  name="returnDateTime"
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      {...field}
                      label="Return Date & Time"
                      error={errors.returnDateTime?.message}
                      minDate={watchedValues.pickupDateTime || addHours(new Date(), 2)}
                      required
                    />
                  )}
                />
                
                <Controller
                  name="samePickupLocation"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="same-pickup"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="same-pickup" className="text-sm">
                        Return to the same pickup location
                      </Label>
                    </div>
                  )}
                />
              </>
            )}

            {/* Duration (for hourly) */}
            {serviceType === 'hourly' && (
              <Controller
                name="durationHours"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="duration">
                      Service Duration <span className="text-destructive">*</span>
                    </Label>
                    <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                      <SelectTrigger id="duration">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 7, 8].map((hours) => (
                          <SelectItem key={hours} value={hours.toString()}>
                            {hours} hours
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.durationHours && (
                      <p className="text-sm text-destructive">{errors.durationHours.message}</p>
                    )}
                  </div>
                )}
              />
            )}

            {/* Contact Phone */}
            <Controller
              name="contactPhone"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">
                    Contact Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...field}
                    id="contact-phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className={errors.contactPhone ? 'border-destructive' : ''}
                  />
                  {errors.contactPhone && (
                    <p className="text-sm text-destructive">{errors.contactPhone.message}</p>
                  )}
                </div>
              )}
            />

            {/* Special Instructions */}
            <Controller
              name="specialInstructions"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="special-instructions">
                    Special Instructions (Optional)
                  </Label>
                  <Textarea
                    {...field}
                    id="special-instructions"
                    rows={3}
                    placeholder="Any special requests or instructions..."
                    className="resize-none"
                  />
                </div>
              )}
            />

            {/* Quote Display */}
            <div className="mt-6">
              <QuoteDisplay
                quote={quote}
                loading={isCalculatingPrice}
                error={quoteError}
                onGratuityChange={(amount, percentage) => {
                  setSelectedGratuity(percentage);
                }}
                onQuoteExpired={() => {
                  setQuote(null);
                  showToast.error('Quote has expired. Please refresh to get a new quote.');
                }}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/booking')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
                className="flex-1"
              >
                Continue to Payment
              </Button>
            </div>
          </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};