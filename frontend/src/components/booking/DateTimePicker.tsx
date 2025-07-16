import React from 'react';
import { format, addDays, addHours, setHours, setMinutes, isAfter, isBefore, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | null) => void;
  label?: string;
  error?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  disabled?: boolean;
  onBlur?: () => void;
}

export const DateTimePicker = React.forwardRef<HTMLButtonElement, DateTimePickerProps>(({
  value,
  onChange,
  label,
  error,
  required = false,
  minDate = addHours(new Date(), 2), // Default: 2 hours from now
  maxDate = addDays(new Date(), 30), // Default: 30 days from now
  placeholder = 'Pick a date and time',
  disabled = false,
  onBlur,
}, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedTime, setSelectedTime] = React.useState<string>('12:00');

  // Initialize time from value
  React.useEffect(() => {
    if (value) {
      const hours = value.getHours().toString().padStart(2, '0');
      const minutes = value.getMinutes().toString().padStart(2, '0');
      setSelectedTime(`${hours}:${minutes}`);
    }
  }, [value]);

  // Generate time options (every 15 minutes from 6 AM to 11 PM)
  const timeOptions = React.useMemo(() => {
    const options: string[] = [];
    for (let hour = 6; hour < 23; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        options.push(
          `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        );
      }
    }
    return options;
  }, []);

  // Check if a date should be disabled
  const isDateDisabled = (date: Date) => {
    if (minDate && isBefore(date, startOfDay(minDate))) return true;
    if (maxDate && isAfter(date, maxDate)) return true;
    return false;
  };

  // Check if a time should be disabled for the selected date
  const isTimeDisabled = (time: string, selectedDate: Date | undefined) => {
    if (!selectedDate) return false;
    
    const [hours, minutes] = time.split(':').map(Number);
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hours, minutes, 0, 0);
    
    // Check if it's at least 2 hours from now
    const twoHoursFromNow = addHours(new Date(), 2);
    if (isBefore(dateTime, twoHoursFromNow)) return true;
    
    // Check business hours (6 AM - 11 PM)
    if (hours < 6 || hours >= 23) return true;
    
    return false;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(null);
      return;
    }

    // Apply the selected time to the date
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const newDateTime = new Date(date);
    newDateTime.setHours(hours, minutes, 0, 0);

    // Check if the resulting datetime is valid
    if (!isTimeDisabled(selectedTime, date)) {
      onChange(newDateTime);
    } else {
      // Find the next valid time
      const validTime = timeOptions.find(time => !isTimeDisabled(time, date));
      if (validTime) {
        setSelectedTime(validTime);
        const [h, m] = validTime.split(':').map(Number);
        newDateTime.setHours(h, m, 0, 0);
        onChange(newDateTime);
      }
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (value) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDateTime = new Date(value);
      newDateTime.setHours(hours, minutes, 0, 0);
      onChange(newDateTime);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground',
              error && 'border-destructive',
              'bg-background'
            )}
            disabled={disabled}
            onBlur={onBlur}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, 'PPP p') : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="sm:flex">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              initialFocus
              className="border-r"
            />
            <div className="p-3 border-t sm:border-t-0 sm:border-l">
              <div className="text-sm font-medium mb-3">Select time</div>
              <Select value={selectedTime} onValueChange={handleTimeChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {timeOptions.map((time) => {
                    const isDisabled = isTimeDisabled(time, value || new Date());
                    return (
                      <SelectItem 
                        key={time} 
                        value={time} 
                        disabled={isDisabled}
                        className={isDisabled ? 'text-muted-foreground' : ''}
                      >
                        {time}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-3">
                Hours: 6 AM - 11 PM
                <br />
                Min: 2 hours advance
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
});

DateTimePicker.displayName = 'DateTimePicker';