-- Migration: Add image_url column to notifications table
-- Description: Allows storing image URLs for notifications (push notifications, announcements, etc.)

-- Add image_url column to notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment
COMMENT ON COLUMN notifications.image_url IS 'Optional image URL for notification thumbnails (e.g., Cloudinary URLs)';
