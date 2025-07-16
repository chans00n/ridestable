-- Create DriverStatus enum type
DO $$ BEGIN
    CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_APPROVAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add driver support to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_driver BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS driver_license_number VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS driver_license_expiry DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vehicle_info JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS driver_status "DriverStatus" DEFAULT 'INACTIVE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS driver_rating DECIMAL(3,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_trips INTEGER DEFAULT 0;

-- Create index for driver queries
CREATE INDEX IF NOT EXISTS idx_users_is_driver ON users(is_driver) WHERE is_driver = true;
CREATE INDEX IF NOT EXISTS idx_users_driver_status ON users(driver_status) WHERE is_driver = true;

-- No need for check constraint since we're using enum type

-- Add driver_id to bookings table (using TEXT to match users.id type)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_id TEXT REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON bookings(driver_id);

-- Add driver-specific fields to the response
COMMENT ON COLUMN users.is_driver IS 'Indicates if the user is a driver';
COMMENT ON COLUMN users.driver_license_number IS 'Driver license number for verification';
COMMENT ON COLUMN users.driver_license_expiry IS 'Driver license expiration date';
COMMENT ON COLUMN users.vehicle_info IS 'JSON object containing vehicle details';
COMMENT ON COLUMN users.driver_status IS 'Current driver status: ACTIVE, INACTIVE, SUSPENDED, PENDING_APPROVAL';
COMMENT ON COLUMN users.driver_rating IS 'Average driver rating from customers';
COMMENT ON COLUMN users.total_trips IS 'Total number of completed trips as a driver';
COMMENT ON COLUMN bookings.driver_id IS 'Reference to the driver assigned to this booking';