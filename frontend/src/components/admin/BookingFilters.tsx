import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { format } from 'date-fns';

interface BookingFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
}

export default function BookingFilters({ filters, onFiltersChange }: BookingFiltersProps) {
  const [localFilters, setLocalFilters] = useState({
    dateRange: filters.dateRange || '',
    status: Array.isArray(filters.status) ? filters.status : [],
    serviceType: Array.isArray(filters.serviceType) ? filters.serviceType : [],
    amountRange: filters.amountRange || '',
    showCancelled: filters.showCancelled ?? false,
    showCompleted: filters.showCompleted ?? false,
    showPending: filters.showPending ?? true
  });

  const handleApplyFilters = () => {
    const processedFilters: any = {};

    if (localFilters.dateRange) {
      processedFilters.dateRange = localFilters.dateRange;
    }

    if (localFilters.status.length > 0) {
      processedFilters.status = localFilters.status.join(',');
    }

    if (localFilters.serviceType.length > 0) {
      processedFilters.serviceType = localFilters.serviceType.join(',');
    }

    if (localFilters.amountRange) {
      processedFilters.amountRange = localFilters.amountRange;
    }

    processedFilters.showCancelled = localFilters.showCancelled;
    processedFilters.showCompleted = localFilters.showCompleted;
    processedFilters.showPending = localFilters.showPending;

    onFiltersChange(processedFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      dateRange: '',
      status: [],
      serviceType: [],
      amountRange: '',
      showCancelled: true,
      showCompleted: true,
      showPending: true
    };
    setLocalFilters(resetFilters);
    onFiltersChange({});
  };

  return (
    <div className="mt-4 bg-card dark:bg-zinc-900 p-4 rounded-lg shadow-sm border border-border">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Date Range
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Select date range"
              value={localFilters.dateRange}
              className="pl-10"
              readOnly
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Status
          </label>
          <div className="space-y-2">
            {['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
              <label key={status} className="flex items-center">
                <Checkbox
                  checked={Array.isArray(localFilters.status) && localFilters.status.includes(status)}
                  onChange={(e) => {
                    const currentStatuses = Array.isArray(localFilters.status) ? localFilters.status : [];
                    if (e.target.checked) {
                      setLocalFilters({
                        ...localFilters,
                        status: [...currentStatuses, status]
                      });
                    } else {
                      setLocalFilters({
                        ...localFilters,
                        status: currentStatuses.filter((s: string) => s !== status)
                      });
                    }
                  }}
                />
                <span className="ml-2 text-sm text-foreground">
                  {status.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Service Type Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Service Type
          </label>
          <div className="space-y-2">
            {['ONE_WAY', 'ROUNDTRIP', 'HOURLY'].map((type) => (
              <label key={type} className="flex items-center">
                <Checkbox
                  checked={Array.isArray(localFilters.serviceType) && localFilters.serviceType.includes(type)}
                  onChange={(e) => {
                    const currentServiceTypes = Array.isArray(localFilters.serviceType) ? localFilters.serviceType : [];
                    if (e.target.checked) {
                      setLocalFilters({
                        ...localFilters,
                        serviceType: [...currentServiceTypes, type]
                      });
                    } else {
                      setLocalFilters({
                        ...localFilters,
                        serviceType: currentServiceTypes.filter((t: string) => t !== type)
                      });
                    }
                  }}
                />
                <span className="ml-2 text-sm text-foreground">
                  {type.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Amount Range */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Amount Range
          </label>
          <Input
            type="text"
            placeholder="e.g., 50-200"
            value={localFilters.amountRange}
            onChange={(e) => setLocalFilters({ ...localFilters, amountRange: e.target.value })}
          />
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mt-4 flex items-center space-x-4">
        <label className="flex items-center">
          <Checkbox
            checked={localFilters.showPending}
            onChange={(e) => setLocalFilters({ ...localFilters, showPending: e.target.checked })}
          />
          <span className="ml-2 text-sm text-foreground">Show Pending</span>
        </label>
        <label className="flex items-center">
          <Checkbox
            checked={localFilters.showCompleted}
            onChange={(e) => setLocalFilters({ ...localFilters, showCompleted: e.target.checked })}
          />
          <span className="ml-2 text-sm text-foreground">Show Completed</span>
        </label>
        <label className="flex items-center">
          <Checkbox
            checked={localFilters.showCancelled}
            onChange={(e) => setLocalFilters({ ...localFilters, showCancelled: e.target.checked })}
          />
          <span className="ml-2 text-sm text-foreground">Show Cancelled</span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex justify-end space-x-2">
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button onClick={handleApplyFilters}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
}