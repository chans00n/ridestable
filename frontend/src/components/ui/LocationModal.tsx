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

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  title?: string;
}

export const LocationModal: React.FC<LocationModalProps> = ({ 
  isOpen, 
  onClose, 
  address, 
  title = "Location" 
}) => {

  // Generate Google Maps URLs
  const encodedAddress = encodeURIComponent(address);
  const mapLinkUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  
  // To enable map preview, add your Google Maps API key to .env file:
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const mapEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodedAddress}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPinIcon className="h-5 w-5 text-blue-600" />
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Address */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Address:</p>
            <p className="text-foreground font-medium">{address}</p>
          </div>

          {/* Map Container */}
          <div className="relative">
            <div className="bg-muted rounded-lg overflow-hidden border-2 border-dashed border-border" style={{ height: '400px' }}>
              {GOOGLE_MAPS_API_KEY ? (
                <iframe
                  src={mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location Map"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPinIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Location Preview</h4>
                    <p className="text-muted-foreground mb-4 text-sm">Interactive map preview requires Google Maps API key</p>
                    <Button asChild>
                      <a
                        href={mapLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                        Open in Google Maps
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex justify-between items-center w-full">
            <Button variant="link" asChild>
              <a
                href={mapLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                Open in Google Maps
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