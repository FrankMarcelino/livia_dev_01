-- Migration: Convert message status from TEXT to ENUM
-- Date: 2025-11-21
-- Purpose:
--   1. Create proper ENUM type for message status
--   2. N8N will be responsible for updating status (not the API)
--   3. Improve data integrity and performance

-- 1. Create ENUM type
DO $$ BEGIN
  CREATE TYPE message_status AS ENUM ('pending', 'sent', 'failed', 'read');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Drop existing CHECK constraint if it exists
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_status_check;

-- 3. Remove DEFAULT before changing column type
ALTER TABLE messages ALTER COLUMN status DROP DEFAULT;

-- 4. Alter column to use ENUM type
-- First convert to the enum type using CAST
ALTER TABLE messages
ALTER COLUMN status TYPE message_status
USING (status::message_status);

-- 5. Set new default value with correct type
ALTER TABLE messages
ALTER COLUMN status SET DEFAULT 'pending'::message_status;

-- 6. Add comment explaining N8N responsibility
COMMENT ON COLUMN messages.status IS 'Message delivery status (ENUM). N8N is responsible for updating this field: pending → sent/failed → read. Frontend only inserts as pending.';

-- 7. Ensure index exists (should already exist from previous migration)
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
