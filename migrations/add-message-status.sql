-- Migration: Add status field to messages table
-- Date: 2025-11-20
-- Purpose: Enable tracking of message delivery status (pending, sent, failed, read)

-- Add status column
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent'
CHECK (status IN ('pending', 'sent', 'failed', 'read'));

-- Add index for filtering by status
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- Add external_message_id index (for idempotency check in n8n)
CREATE INDEX IF NOT EXISTS idx_messages_external_message_id ON messages(external_message_id)
WHERE external_message_id IS NOT NULL;

-- Update existing messages to 'sent' (backward compatibility)
UPDATE messages
SET status = 'sent'
WHERE status IS NULL;

-- Add comment
COMMENT ON COLUMN messages.status IS 'Message delivery status: pending (sending), sent (delivered), failed (error), read (customer saw it)';
