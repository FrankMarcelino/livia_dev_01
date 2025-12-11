-- Migration: Add is_category field to tags table
-- Description: Adds a boolean field to differentiate category tags from regular tags
-- Date: 2025-12-11

-- Add is_category column to tags table
ALTER TABLE tags
ADD COLUMN IF NOT EXISTS is_category BOOLEAN DEFAULT false;

-- Add comment to document the field
COMMENT ON COLUMN tags.is_category IS 'Indica se a tag é uma categoria do Livechat (true) ou uma tag regular do CRM (false)';

-- Create index for better query performance when filtering categories
CREATE INDEX IF NOT EXISTS idx_tags_is_category ON tags(is_category) WHERE is_category = true;
