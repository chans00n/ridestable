import { Loader } from '@googlemaps/js-api-loader';

let loaderInstance: Loader | null = null;

export const getGoogleMapsLoader = () => {
  if (!loaderInstance) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    
    if (!apiKey) {
      console.error('Google Maps API key is not configured');
    } else {
      console.log('Google Maps API key configured:', apiKey.substring(0, 10) + '...');
    }
    
    loaderInstance = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });
  }
  return loaderInstance;
};