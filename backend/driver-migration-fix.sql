-- Fix driver_status column to use enum type
-- First, drop the existing column if it's not using the enum
ALTER TABLE users DROP COLUMN IF EXISTS driver_status;

-- Re-add with correct enum type
ALTER TABLE users ADD COLUMN driver_status "DriverStatus" DEFAULT 'INACTIVE';

-- Add driver_id to bookings table (using TEXT to match users.id type)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_id TEXT REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON bookings(driver_id);

-- Add comments
COMMENT ON COLUMN bookings.driver_id IS 'Reference to the driver assigned to this booking';