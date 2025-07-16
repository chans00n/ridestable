import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugDriverData() {
  try {
    console.log('=== DEBUGGING DRIVER APP DATA ===\n')

    // 1. Check all bookings
    console.log('1. ALL BOOKINGS:')
    const bookings = await prisma.booking.findMany({
      include: {
        user: true,
        driver: true,
      },
      orderBy: { id: 'asc' }
    })

    for (const booking of bookings) {
      console.log(`\nBooking ID: ${booking.id}`)
      console.log(`  Customer: ${booking.user.firstName} ${booking.user.lastName} (ID: ${booking.userId})`)
      console.log(`  Driver: ${booking.driver ? `${booking.driver.firstName} ${booking.driver.lastName} (ID: ${booking.driverId})` : 'NOT ASSIGNED'}`)
      console.log(`  Status: ${booking.status}`)
      console.log(`  Scheduled: ${booking.scheduledDateTime}`)
      console.log(`  Pickup: ${booking.pickupAddress}`)
      console.log(`  Dropoff: ${booking.dropoffAddress}`)
      console.log(`  Total: $${booking.totalAmount}`)
      console.log(`  Created: ${booking.createdAt}`)
      console.log(`  Updated: ${booking.updatedAt}`)
    }

    // 2. Check driver users
    console.log('\n\n2. DRIVER USERS:')
    const drivers = await prisma.user.findMany({
      where: { isDriver: true }
    })

    for (const driver of drivers) {
      console.log(`\nDriver: ${driver.firstName} ${driver.lastName}`)
      console.log(`  ID: ${driver.id}`)
      console.log(`  Email: ${driver.email}`)
      console.log(`  Status: ${driver.driverStatus}`)
      console.log(`  Total Trips: ${driver.totalTrips}`)
      console.log(`  License: ${driver.driverLicenseNumber}`)
      console.log(`  Last Login: ${driver.lastLoginAt}`)
    }

    // 3. Check bookings assigned to drivers
    console.log('\n\n3. BOOKINGS ASSIGNED TO DRIVERS:')
    const assignedBookings = await prisma.booking.findMany({
      where: {
        driverId: { not: null }
      },
      include: {
        driver: true,
        user: true
      }
    })

    if (assignedBookings.length === 0) {
      console.log('  No bookings have drivers assigned!')
    } else {
      for (const booking of assignedBookings) {
        console.log(`\nBooking ${booking.id}:`)
        console.log(`  Driver: ${booking.driver!.firstName} ${booking.driver!.lastName}`)
        console.log(`  Customer: ${booking.user.firstName} ${booking.user.lastName}`)
        console.log(`  Status: ${booking.status}`)
        console.log(`  Scheduled: ${booking.scheduledDateTime}`)
      }
    }

    // 4. Check today's bookings
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    console.log('\n\n4. TODAY\'S BOOKINGS:')
    const todaysBookings = await prisma.booking.findMany({
      where: {
        scheduledDateTime: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        driver: true,
        user: true
      }
    })

    if (todaysBookings.length === 0) {
      console.log('  No bookings scheduled for today!')
    } else {
      for (const booking of todaysBookings) {
        console.log(`\nBooking ${booking.id}:`)
        console.log(`  Driver: ${booking.driver ? `${booking.driver.firstName} ${booking.driver.lastName}` : 'NOT ASSIGNED'}`)
        console.log(`  Customer: ${booking.user.firstName} ${booking.user.lastName}`)
        console.log(`  Status: ${booking.status}`)
        console.log(`  Scheduled: ${booking.scheduledDateTime}`)
      }
    }

    // 5. Check for the specific third booking
    console.log('\n\n5. THIRD BOOKING DETAILS:')
    const thirdBooking = await prisma.booking.findFirst({
      skip: 2,
      orderBy: { id: 'asc' },
      include: {
        driver: true,
        user: true
      }
    })

    if (thirdBooking) {
      console.log(`Booking ID: ${thirdBooking.id}`)
      console.log(`  Customer: ${thirdBooking.user.firstName} ${thirdBooking.user.lastName}`)
      console.log(`  Driver ID: ${thirdBooking.driverId || 'NULL'}`)
      console.log(`  Driver: ${thirdBooking.driver ? `${thirdBooking.driver.firstName} ${thirdBooking.driver.lastName}` : 'NOT ASSIGNED'}`)
      console.log(`  Status: ${thirdBooking.status}`)
      console.log(`  Scheduled: ${thirdBooking.scheduledDateTime}`)
      console.log(`  Is scheduled for today? ${thirdBooking.scheduledDateTime >= today && thirdBooking.scheduledDateTime < tomorrow}`)
    } else {
      console.log('  No third booking found!')
    }

  } catch (error) {
    console.error('Error debugging driver data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugDriverData()