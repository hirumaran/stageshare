-- Add cloudinary_public_id to item_images so we can clean up
-- the Cloudinary asset when a row is deleted.
ALTER TABLE item_images ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR(255);
