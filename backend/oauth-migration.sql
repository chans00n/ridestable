-- Make password optional for OAuth users
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Create OAuth providers table
CREATE TABLE IF NOT EXISTS oauth_providers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_user
    FOREIGN KEY(user_id) 
    REFERENCES users(id)
    ON DELETE CASCADE,
    
  CONSTRAINT unique_provider_id
    UNIQUE(provider, provider_id)
);

-- Create indexes
CREATE INDEX idx_oauth_providers_user_id ON oauth_providers(user_id);

-- Add update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_oauth_providers_updated_at BEFORE UPDATE
    ON oauth_providers FOR EACH ROW EXECUTE FUNCTION 
    update_updated_at_column();