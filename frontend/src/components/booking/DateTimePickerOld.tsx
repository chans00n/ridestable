import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { format, addDays, addHours, setHours, setMinutes, startOfDay, endOfDay } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | null) => void;
  label?: string;
  error?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  minTime?: Date;
  maxTime?: Date;
  showTimeSelect?: boolean;
  dateFormat?: string;
  timeIntervals?: number;
  placeholder?: string;
  disabled?: boolean;
  onBlur?: () => void;
}

interface CustomInputProps {
  value?: string;
  onClick?: () => void;
  onChange?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ value, onClick, placeholder, disabled }, ref) => (
    <div className="relative">
      <input
        ref={ref}
        type="text"
        value={value}
        onClick={onClick}
        placeholder={placeholder}
        disabled={disabled}
        readOnly
        className="w-full px-4 py-3 pr-10 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-muted text-foreground"
      />
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  )
);

CustomInput.displayName = 'CustomInput';

export const DateTimePickerOld = React.forwardRef<any, DateTimePickerProps>(({
  value,
  onChange,
  label,
  error,
  required = false,
  minDate = addHours(new Date(), 2), // Default: 2 hours from now
  maxDate = addDays(new Date(), 30), // Default: 30 days from now
  minTime,
  maxTime,
  showTimeSelect = true,
  dateFormat = 'MMMM d, yyyy h:mm aa',
  timeIntervals = 15,
  placeholder = 'Select date and time',
  disabled = false,
  onBlur,
}, ref) => {
  // Business hours: 6 AM to 11 PM
  const getMinTime = (date: Date) => {
    const isToday = date.toDateString() === new Date().toDateString();
    if (isToday) {
      // If today, ensure minimum 2 hours from now
      const twoHoursFromNow = addHours(new Date(), 2);
      const sixAM = setHours(setMinutes(new Date(), 0), 6);
      return twoHoursFromNow > sixAM ? twoHoursFromNow : sixAM;
    }
    return minTime || setHours(setMinutes(new Date(), 0), 6);
  };

  const getMaxTime = () => {
    return maxTime || setHours(setMinutes(new Date(), 0), 23);
  };

  const filterTime = (time: Date) => {
    const selectedDate = value || new Date();
    const dateWithTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      time.getHours(),
      time.getMinutes()
    );

    // Check if within business hours (6 AM - 11 PM)
    const hours = time.getHours();
    if (hours < 6 || hours >= 23) return false;

    // Check if at least 2 hours from now
    const twoHoursFromNow = addHours(new Date(), 2);
    if (dateWithTime < twoHoursFromNow) return false;

    return true;
  };

  const isWeekday = (date: Date) => {
    const day = date.getDay();
    // Optional: Disable weekends
    // return day !== 0 && day !== 6;
    return true;
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      <DatePicker
        selected={value}
        onChange={onChange}
        onBlur={onBlur}
        customInput={<CustomInput />}
        minDate={minDate}
        maxDate={maxDate}
        minTime={getMinTime(value || new Date())}
        maxTime={getMaxTime()}
        filterTime={filterTime}
        filterDate={isWeekday}
        showTimeSelect={showTimeSelect}
        timeIntervals={timeIntervals}
        dateFormat={dateFormat}
        placeholderText={placeholder}
        disabled={disabled}
        showPopperArrow={false}
        timeCaption="Time"
        className="w-full"
        calendarClassName="shadow-lg border-0"
        wrapperClassName="w-full"
        popperClassName="react-datepicker-popper"
        popperPlacement="bottom-start"
      />
      
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
      
      {!error && showTimeSelect && (
        <p className="mt-1 text-xs text-muted-foreground">
          Available hours: 6:00 AM - 11:00 PM • Minimum 2 hours advance booking
        </p>
      )}
    </div>
  );
});

DateTimePickerOld.displayName = 'DateTimePickerOld';