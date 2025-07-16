import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { LocationInput } from '../LocationInput';
import { DateTimePicker } from '../DateTimePicker';
import { SavedLocations } from '../SavedLocations';
import { MapPreview } from '../../maps/MapPreview';
import { QuoteDisplay } from '../QuoteDisplay';
import { addHours } from 'date-fns';
import type { ServiceTypeId, QuoteBreakdown } from '../../../types/booking-types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ServiceDetailsStepProps {
  serviceType: ServiceTypeId;
  quote: QuoteBreakdown | null;
  quoteLoading: boolean;
  onGratuityChange: (percentage: number) => void;
}

export const ServiceDetailsStep: React.FC<ServiceDetailsStepProps> = ({
  serviceType,
  quote,
  quoteLoading,
  onGratuityChange,
}) => {
  const { control, watch, setValue, formState: { errors } } = useFormContext();
  const watchedValues = watch();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">Service Details</h2>

      {/* Map Preview */}
      {(watchedValues.pickupLocation?.lat || watchedValues.dropoffLocation?.lat) && (
        <div className="mb-6">
          <MapPreview 
            pickup={watchedValues.pickupLocation}
            dropoff={watchedValues.dropoffLocation}
            height="250px"
            className="rounded-lg"
          />
        </div>
      )}

      {/* Saved Locations */}
      <SavedLocations 
        onSelectLocation={(location) => {
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

      {/* Dropoff Location */}
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

      {/* Return Date/Time for roundtrip */}
      {serviceType === 'roundtrip' && (
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
      )}

      {/* Duration for hourly */}
      {serviceType === 'hourly' && (
        <Controller
          name="durationHours"
          control={control}
          render={({ field }) => (
            <div className="space-y-2">
              <Label htmlFor="duration-hours">
                Service Duration <span className="text-destructive">*</span>
              </Label>
              <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                <SelectTrigger id="duration-hours">
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
            <Label htmlFor="contact-phone-step">
              Contact Phone <span className="text-destructive">*</span>
            </Label>
            <Input
              {...field}
              id="contact-phone-step"
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
            <Label htmlFor="special-instructions-step">
              Special Instructions (Optional)
            </Label>
            <Textarea
              {...field}
              id="special-instructions-step"
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
          loading={quoteLoading}
          error={null}
          onGratuityChange={(amount, percentage) => onGratuityChange(percentage)}
          onQuoteExpired={() => {}}
        />
      </div>
    </div>
  );
};