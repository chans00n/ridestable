import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDriver() {
  try {
    // Check if driver already exists
    const existingDriver = await prisma.user.findUnique({
      where: { email: 'driver@stableride.com' }
    });

    if (existingDriver) {
      console.log('Driver user already exists');
      return;
    }

    // Create driver user
    const hashedPassword = await bcrypt.hash('Driver123!', 10);
    
    const driver = await prisma.user.create({
      data: {
        email: 'driver@stableride.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Driver',
        phone: '+1234567890',
        emailVerified: true,
        isDriver: true,
        driverStatus: 'ACTIVE',
        driverLicenseNumber: 'DL123456789',
        driverLicenseExpiry: new Date('2025-12-31'),
        vehicleInfo: {
          make: 'Mercedes-Benz',
          model: 'S-Class',
          year: 2023,
          color: 'Black',
          licensePlate: 'LUX 123',
          vin: 'WDD2221821A123456',
        },
        driverRating: 5.0,
        totalTrips: 0,
      }
    });

    console.log('Driver user created successfully:', {
      email: driver.email,
      name: `${driver.firstName} ${driver.lastName}`,
      status: driver.driverStatus,
      temporaryPassword: 'Driver123!'
    });

    console.log('\n⚠️  IMPORTANT: Please change the password immediately after first login!');
    
    // Also create some test bookings for the driver
    const testCustomer = await prisma.user.findFirst({
      where: {
        email: { not: 'driver@stableride.com' },
        isDriver: false
      }
    });

    if (testCustomer) {
      // Create a few upcoming bookings
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      await prisma.booking.create({
        data: {
          userId: testCustomer.id,
          driverId: driver.id,
          serviceType: 'ONE_WAY',
          status: 'CONFIRMED',
          scheduledDateTime: tomorrow,
          pickupAddress: '123 Main St, Dallas, TX 75201',
          dropoffAddress: 'DFW International Airport, Terminal A',
          totalAmount: 75.00,
          notes: 'Airport pickup - Terminal A, Gate 23',
        }
      });

      const laterTomorrow = new Date(tomorrow);
      laterTomorrow.setHours(14, 0, 0, 0);

      await prisma.booking.create({
        data: {
          userId: testCustomer.id,
          driverId: driver.id,
          serviceType: 'ROUNDTRIP',
          status: 'CONFIRMED',
          scheduledDateTime: laterTomorrow,
          pickupAddress: '456 Oak Ave, Dallas, TX 75202',
          dropoffAddress: '789 Business Plaza, Dallas, TX 75203',
          totalAmount: 120.00,
          notes: 'Business meeting - return trip at 4:00 PM',
        }
      });

      console.log('\nTest bookings created for tomorrow');
    }

  } catch (error) {
    console.error('Error seeding driver:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedDriver();