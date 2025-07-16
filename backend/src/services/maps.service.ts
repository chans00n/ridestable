import { Client, PlaceAutocompleteType } from '@googlemaps/google-maps-services-js';
import { AppError } from '../middleware/error';
import { logger } from '../config/logger';

export interface GeocodeResult {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  formattedAddress: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isAirport?: boolean;
  airportCode?: string;
}

export interface AutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface DistanceResult {
  distance: number; // in meters
  duration: number; // in seconds
  distanceText: string;
  durationText: string;
}

class MapsService {
  private client: Client;
  private apiKey: string;

  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY!;
    
    if (!this.apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY is not configured');
    }
  }

  async autocomplete(input: string, sessionToken?: string): Promise<AutocompleteResult[]> {
    try {
      const response = await this.client.placeAutocomplete({
        params: {
          input,
          key: this.apiKey,
          sessiontoken: sessionToken,
          types: PlaceAutocompleteType.address,
          components: ['country:us'], // Restrict to US addresses
        },
      });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        logger.error('Google Places Autocomplete error:', response.data);
        throw new AppError(500, 'Failed to fetch address suggestions');
      }

      return response.data.predictions.map(prediction => ({
        placeId: prediction.place_id,
        description: prediction.description,
        mainText: prediction.structured_formatting.main_text,
        secondaryText: prediction.structured_formatting.secondary_text || '',
      }));
    } catch (error) {
      logger.error('Autocomplete error:', error);
      throw new AppError(500, 'Address autocomplete service unavailable');
    }
  }

  async geocode(address: string): Promise<GeocodeResult> {
    try {
      const response = await this.client.geocode({
        params: {
          address,
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK' || !response.data.results.length) {
        throw new AppError(400, 'Invalid address');
      }

      const result = response.data.results[0];
      const location = result.geometry.location;
      
      // Extract address components
      const addressComponents = result.address_components;
      const getComponent = (types: string[]) => {
        const component = addressComponents.find(comp => 
          types.some(type => comp.types.includes(type))
        );
        return component?.long_name;
      };

      const airportInfo = this.detectAirport(result.formatted_address, location.lat, location.lng);
      
      return {
        address,
        lat: location.lat,
        lng: location.lng,
        placeId: result.place_id,
        formattedAddress: result.formatted_address,
        city: getComponent(['locality', 'sublocality']),
        state: getComponent(['administrative_area_level_1']),
        country: getComponent(['country']),
        postalCode: getComponent(['postal_code']),
        isAirport: airportInfo.isAirport,
        airportCode: airportInfo.airportCode,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Geocoding error:', error);
      throw new AppError(500, 'Geocoding service unavailable');
    }
  }

  async geocodeFromPlaceId(placeId: string): Promise<GeocodeResult> {
    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          key: this.apiKey,
          fields: ['formatted_address', 'geometry', 'address_components'],
        },
      });

      if (response.data.status !== 'OK' || !response.data.result) {
        throw new AppError(400, 'Invalid place ID');
      }

      const result = response.data.result;
      const location = result.geometry!.location;
      
      // Extract address components
      const addressComponents = result.address_components || [];
      const getComponent = (types: string[]) => {
        const component = addressComponents.find(comp => 
          types.some(type => comp.types.includes(type))
        );
        return component?.long_name;
      };

      const airportInfo = this.detectAirport(result.formatted_address!, location.lat, location.lng);
      
      return {
        address: result.formatted_address!,
        lat: location.lat,
        lng: location.lng,
        placeId: placeId,
        formattedAddress: result.formatted_address!,
        city: getComponent(['locality', 'sublocality']),
        state: getComponent(['administrative_area_level_1']),
        country: getComponent(['country']),
        postalCode: getComponent(['postal_code']),
        isAirport: airportInfo.isAirport,
        airportCode: airportInfo.airportCode,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Place details error:', error);
      throw new AppError(500, 'Place details service unavailable');
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK' || !response.data.results.length) {
        throw new AppError(400, 'No address found for coordinates');
      }

      const result = response.data.results[0];
      
      // Extract address components
      const addressComponents = result.address_components;
      const getComponent = (types: string[]) => {
        const component = addressComponents.find(comp => 
          types.some(type => comp.types.includes(type))
        );
        return component?.long_name;
      };

      const airportInfo = this.detectAirport(result.formatted_address, lat, lng);
      
      return {
        address: result.formatted_address,
        lat,
        lng,
        placeId: result.place_id,
        formattedAddress: result.formatted_address,
        city: getComponent(['locality', 'sublocality']),
        state: getComponent(['administrative_area_level_1']),
        country: getComponent(['country']),
        postalCode: getComponent(['postal_code']),
        isAirport: airportInfo.isAirport,
        airportCode: airportInfo.airportCode,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Reverse geocoding error:', error);
      throw new AppError(500, 'Reverse geocoding service unavailable');
    }
  }

  async calculateDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<DistanceResult> {
    try {
      const response = await this.client.distancematrix({
        params: {
          origins: [origin],
          destinations: [destination],
          key: this.apiKey,
          units: 'imperial', // Use miles for US
        },
      });

      if (response.data.status !== 'OK') {
        throw new AppError(500, 'Distance calculation failed');
      }

      const element = response.data.rows[0].elements[0];
      
      if (element.status !== 'OK') {
        throw new AppError(400, 'Route not found');
      }

      return {
        distance: element.distance.value,
        duration: element.duration.value,
        distanceText: element.distance.text,
        durationText: element.duration.text,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Distance calculation error:', error);
      throw new AppError(500, 'Distance calculation service unavailable');
    }
  }

  // Check if location is within service area (example: 75 mile radius from city center)
  isWithinServiceArea(lat: number, lng: number): boolean {
    // Las Vegas city center coordinates
    const centerLat = 36.1699;
    const centerLng = -115.1398;
    const maxDistanceMiles = 75;

    const distance = this.calculateHaversineDistance(
      { lat: centerLat, lng: centerLng },
      { lat, lng }
    );

    return distance <= maxDistanceMiles;
  }

  // Calculate distance between two points using Haversine formula
  private calculateHaversineDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    const lat1 = this.toRad(point1.lat);
    const lat2 = this.toRad(point2.lat);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Known Las Vegas area airports
  private readonly AIRPORTS = [
    { 
      code: 'LAS', 
      name: 'Harry Reid International Airport',
      lat: 36.0840, 
      lng: -115.1537,
      keywords: ['harry reid', 'mccarran', 'las vegas airport', 'las airport']
    },
    { 
      code: 'HND', 
      name: 'Henderson Executive Airport',
      lat: 35.9728, 
      lng: -115.1345,
      keywords: ['henderson airport', 'hnd airport', 'henderson executive']
    },
    { 
      code: 'VGT', 
      name: 'North Las Vegas Airport',
      lat: 36.2107, 
      lng: -115.1944,
      keywords: ['north las vegas airport', 'vgt airport']
    }
  ];

  // Check if a location is an airport
  detectAirport(address: string, lat?: number, lng?: number): { isAirport: boolean; airportCode?: string } {
    const addressLower = address.toLowerCase();
    
    // Check by keywords in address
    for (const airport of this.AIRPORTS) {
      if (airport.keywords.some(keyword => addressLower.includes(keyword))) {
        return { isAirport: true, airportCode: airport.code };
      }
    }

    // Check by proximity to known airports
    if (lat && lng) {
      for (const airport of this.AIRPORTS) {
        const distance = this.calculateHaversineDistance(
          { lat, lng },
          { lat: airport.lat, lng: airport.lng }
        );
        // Within 1 mile of airport center
        if (distance <= 1) {
          return { isAirport: true, airportCode: airport.code };
        }
      }
    }

    // Generic airport keywords
    const genericAirportKeywords = ['airport', 'terminal', 'concourse', 'gate '];
    if (genericAirportKeywords.some(keyword => addressLower.includes(keyword))) {
      return { isAirport: true };
    }

    return { isAirport: false };
  }
}

export const mapsService = new MapsService();