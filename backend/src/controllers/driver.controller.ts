import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
import { driverService } from '../services/driver.service';
import { AppError } from '../utils/errors';

class DriverController {
  async getTodaySchedule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user!.id;
      const schedule = await driverService.getTodaySchedule(driverId);
      
      res.json({
        status: 'success',
        data: schedule
      });
    } catch (error) {
      next(error);
    }
  }

  async getWeekSchedule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user!.id;
      const { start, end } = req.query;
      const weekSchedule = await driverService.getWeekSchedule(
        driverId, 
        start as string | undefined, 
        end as string | undefined
      );
      
      res.json({
        status: 'success',
        data: weekSchedule
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveRide(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user!.id;
      const activeRide = await driverService.getActiveRide(driverId);
      
      res.json({
        status: 'success',
        data: activeRide
      });
    } catch (error) {
      next(error);
    }
  }

  async getRideDetails(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rideId } = req.params;
      const driverId = req.user!.id;
      const ride = await driverService.getRideDetails(rideId, driverId);
      
      res.json({
        status: 'success',
        data: ride
      });
    } catch (error) {
      next(error);
    }
  }

  async startRide(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rideId } = req.params;
      const driverId = req.user!.id;
      await driverService.updateRideStatus(rideId, driverId, 'started');
      
      res.json({
        status: 'success',
        message: 'Ride started successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async arrivedAtPickup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rideId } = req.params;
      const driverId = req.user!.id;
      await driverService.updateRideStatus(rideId, driverId, 'arrived_pickup');
      
      res.json({
        status: 'success',
        message: 'Marked as arrived at pickup'
      });
    } catch (error) {
      next(error);
    }
  }

  async passengerAboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rideId } = req.params;
      const driverId = req.user!.id;
      await driverService.updateRideStatus(rideId, driverId, 'passenger_aboard');
      
      res.json({
        status: 'success',
        message: 'Passenger aboard, ride in progress'
      });
    } catch (error) {
      next(error);
    }
  }

  async arrivedAtDestination(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rideId } = req.params;
      const driverId = req.user!.id;
      await driverService.updateRideStatus(rideId, driverId, 'arrived_destination');
      
      res.json({
        status: 'success',
        message: 'Arrived at destination'
      });
    } catch (error) {
      next(error);
    }
  }

  async completeRide(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rideId } = req.params;
      const driverId = req.user!.id;
      await driverService.completeRide(rideId, driverId);
      
      res.json({
        status: 'success',
        message: 'Ride completed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLocation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user!.id;
      const location = req.body;
      await driverService.updateDriverLocation(driverId, location);
      
      res.json({
        status: 'success',
        message: 'Location updated'
      });
    } catch (error) {
      next(error);
    }
  }

  async startLocationSharing(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rideId } = req.params;
      const driverId = req.user!.id;
      await driverService.startLocationSharing(rideId, driverId);
      
      res.json({
        status: 'success',
        message: 'Location sharing started'
      });
    } catch (error) {
      next(error);
    }
  }

  async stopLocationSharing(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rideId } = req.params;
      const driverId = req.user!.id;
      await driverService.stopLocationSharing(rideId, driverId);
      
      res.json({
        status: 'success',
        message: 'Location sharing stopped'
      });
    } catch (error) {
      next(error);
    }
  }

  async getDriverProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user!.id;
      const profile = await driverService.getDriverProfile(driverId);
      
      res.json({
        status: 'success',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  async updateVehicleInfo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user!.id;
      const vehicleInfo = req.body;
      await driverService.updateVehicleInfo(driverId, vehicleInfo);
      
      res.json({
        status: 'success',
        message: 'Vehicle information updated'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user!.id;
      const { status } = req.body;
      await driverService.updateAvailability(driverId, status);
      
      res.json({
        status: 'success',
        message: 'Availability updated'
      });
    } catch (error) {
      next(error);
    }
  }

  async getTodayEarnings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user!.id;
      const earnings = await driverService.getTodayEarnings(driverId);
      
      res.json({
        status: 'success',
        data: earnings
      });
    } catch (error) {
      next(error);
    }
  }

  async getWeekEarnings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user!.id;
      const earnings = await driverService.getWeekEarnings(driverId);
      
      res.json({
        status: 'success',
        data: earnings
      });
    } catch (error) {
      next(error);
    }
  }

  async getEarningsHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user!.id;
      const { startDate, endDate } = req.query;
      const history = await driverService.getEarningsHistory(
        driverId,
        startDate as string,
        endDate as string
      );
      
      res.json({
        status: 'success',
        data: history
      });
    } catch (error) {
      next(error);
    }
  }
}

export const driverController = new DriverController();