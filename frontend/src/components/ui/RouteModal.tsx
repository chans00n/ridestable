import React from 'react';
import { MapPinIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';

interface RouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  pickupAddress: string;
  dropoffAddress: string;
  title?: string;
}

export const RouteModal: React.FC<RouteModalProps> = ({ 
  isOpen, 
  onClose, 
  pickupAddress, 
  dropoffAddress,
  title = "Route Details" 
}) => {

  // Generate Google Maps URLs for directions
  const encodedPickup = encodeURIComponent(pickupAddress);
  const encodedDropoff = encodeURIComponent(dropoffAddress);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodedPickup}&destination=${encodedDropoff}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPinIcon className="h-5 w-5 text-blue-600" />
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pickup Location */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pickup Location</p>
              <p className="text-foreground">{pickupAddress}</p>
            </div>
          </div>

          {/* Route Line */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 flex justify-center">
              <div className="w-0.5 h-8 bg-border"></div>
            </div>
            <div></div>
          </div>

          {/* Dropoff Location */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dropoff Location</p>
              <p className="text-foreground">{dropoffAddress}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex justify-between items-center w-full">
            <Button asChild>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                Get Directions
              </a>
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};