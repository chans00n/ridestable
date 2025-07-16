-- Sprint 7: Booking Lifecycle Management Schema

-- Booking Modifications Table
CREATE TABLE booking_modifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    modification_type VARCHAR(50) NOT NULL,
    original_data JSONB NOT NULL,
    new_data JSONB NOT NULL,
    price_difference DECIMAL(10, 2) DEFAULT 0,
    modification_fee DECIMAL(10, 2) DEFAULT 0,
    modified_by TEXT NOT NULL REFERENCES users(id),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Cancellations Table
CREATE TABLE cancellations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    cancelled_by TEXT NOT NULL REFERENCES users(id),
    cancellation_reason VARCHAR(255),
    cancellation_type VARCHAR(50) NOT NULL, -- 'customer', 'driver', 'system'
    refund_amount DECIMAL(10, 2) DEFAULT 0,
    refund_status VARCHAR(50) DEFAULT 'pending',
    refund_transaction_id TEXT,
    refund_processed_at TIMESTAMP,
    trip_protection_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id TEXT REFERENCES bookings(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'push'
    template_id VARCHAR(100),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    content TEXT,
    metadata JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    failed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notification Preferences Table
CREATE TABLE notification_preferences (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    reminder_frequency VARCHAR(20) DEFAULT 'normal', -- 'none', 'normal', 'extra'
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Booking Confirmations Table
CREATE TABLE booking_confirmations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    booking_reference VARCHAR(20) NOT NULL UNIQUE,
    confirmation_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed',
    confirmation_sent_at TIMESTAMP,
    modification_deadline TIMESTAMP NOT NULL,
    calendar_invite_sent BOOLEAN DEFAULT FALSE,
    pdf_receipt_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Saved Locations Table
CREATE TABLE saved_locations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_type VARCHAR(20), -- 'home', 'work', 'other'
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notification Templates Table
CREATE TABLE notification_templates (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    variables JSONB, -- List of required variables
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_booking_modifications_booking_id ON booking_modifications(booking_id);
CREATE INDEX idx_booking_modifications_status ON booking_modifications(status);
CREATE INDEX idx_cancellations_booking_id ON cancellations(booking_id);
CREATE INDEX idx_cancellations_refund_status ON cancellations(refund_status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_booking_id ON notifications(booking_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_saved_locations_user_id ON saved_locations(user_id);

-- Add columns to existing bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS confirmation_id TEXT REFERENCES booking_confirmations(id),
ADD COLUMN IF NOT EXISTS is_modified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS modification_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancellation_id TEXT REFERENCES cancellations(id);

-- Add trigger to update modification_count
CREATE OR REPLACE FUNCTION update_modification_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE bookings 
    SET modification_count = modification_count + 1,
        is_modified = TRUE
    WHERE id = NEW.booking_id
    AND NEW.status = 'completed';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_modification_count
AFTER INSERT ON booking_modifications
FOR EACH ROW
EXECUTE FUNCTION update_modification_count();

-- Add updated_at triggers
CREATE TRIGGER update_booking_modifications_updated_at
BEFORE UPDATE ON booking_modifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cancellations_updated_at
BEFORE UPDATE ON cancellations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_confirmations_updated_at
BEFORE UPDATE ON booking_confirmations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_locations_updated_at
BEFORE UPDATE ON saved_locations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON notification_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();