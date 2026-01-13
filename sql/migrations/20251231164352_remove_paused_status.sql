-- Migration: Remove 'paused' status from conversations
-- Date: 2025-12-31
-- Purpose: Simplify conversation status to only 'open' and 'closed'
--
-- IMPORTANT: This migration will affect all applications using this database
-- Make sure all applications are updated to handle only 'open' and 'closed' statuses

BEGIN;

-- Step 1: Convert all 'paused' conversations to 'open'
-- Note: These conversations likely have ia_active=false, which is what matters
UPDATE conversations
SET status = 'open'
WHERE status = 'paused';

-- Step 2: Alter the enum type to remove 'paused'
-- PostgreSQL doesn't allow direct enum modification, so we need to:
-- 1. Create new enum
-- 2. Alter column to use new enum
-- 3. Drop old enum

-- Create new enum without 'paused'
CREATE TYPE conversation_status_enum_new AS ENUM ('open', 'closed');

-- Alter the column to use the new enum
ALTER TABLE conversations 
  ALTER COLUMN status TYPE conversation_status_enum_new 
  USING status::text::conversation_status_enum_new;

-- Drop the old enum
DROP TYPE conversation_status_enum;

-- Rename new enum to original name
ALTER TYPE conversation_status_enum_new RENAME TO conversation_status_enum;

-- Step 3: Update any views or functions that might reference 'paused' status
-- (The dashboard functions will be updated separately)

COMMIT;

-- Verification query (run after migration):
-- SELECT status, COUNT(*) FROM conversations GROUP BY status;
-- Expected result: Only 'open' and 'closed'
